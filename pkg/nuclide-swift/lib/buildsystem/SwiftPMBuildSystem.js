'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Task, TaskInfo} from '../../../nuclide-build/lib/types';
import type {Level, Message} from '../../../nuclide-console/lib/types';

import invariant from 'assert';
import {Observable, Subject} from 'rxjs';
import {Dispatcher} from 'flux';
import {CompositeDisposable} from 'atom';
import {React} from 'react-for-atom';
import fsPromise from '../../../commons-node/fsPromise';
import {DisposableSubscription} from '../../../commons-node/stream';
import {observeProcess, safeSpawn} from '../../../commons-node/process';
import {observableToBuildTaskInfo} from '../../../commons-node/observableToBuildTaskInfo';
import SwiftPMBuildSystemStore from './SwiftPMBuildSystemStore';
import SwiftPMBuildSystemActions from './SwiftPMBuildSystemActions';
import {
  buildCommand,
  testCommand,
  createNewPackageCommand,
  fetchPackageDependenciesCommand,
  updatePackageDependenciesCommand,
  generateXcodeProjectCommand,
  visualizePackageDependenciesCommand,
  displayBufferDescriptionCommand,
} from './SwiftPMBuildSystemCommands';
import {
  SwiftPMBuildSystemBuildTask,
  SwiftPMBuildSystemTestTask,
  SwiftPMBuildSystemTasks,
} from './SwiftPMBuildSystemTasks';
import SwiftPMBuildSystemToolbar from './toolbar/SwiftPMBuildSystemToolbar';
import SwiftPMAutocompletionProvider from './autocompletion/SwiftPMAutocompletionProvider';
import {addTestResultGutterIcon, highlightLine} from './gutter/TestResults.js';
import {SwiftIcon} from '../ui/SwiftIcon';

/**
 * The primary controller for spawning SwiftPM tasks, such as building a
 * package, or running its tests.
 *
 * This class conforms to Nuclide's BuildSystem interface, and makes use of the
 * Flux design pattern. This class is responsible for kicking off SwiftPM tasks
 * such as building a package. How it builds the package is determined by the
 * state of the SwiftPMBuildSystemToolbar -- the path to the package, whether a
 * build path is specified, etc. -- and that state is maintained by the
 * SwiftPMBuildSystemStore. Updates to the toolbar UI options trigger actions,
 * defined in SwiftPMBuildSystemActions, which update the state of the store.
 * Actions are routed to the store via a Flux.Dispatcher (instantiated by this
 * class).
 */
export class SwiftPMBuildSystem {
  id: string;
  name: string;
  _disposables: CompositeDisposable;
  _store: SwiftPMBuildSystemStore;
  _autocompletionProvier: SwiftPMAutocompletionProvider;
  _actions: SwiftPMBuildSystemActions;
  _tasks: Observable<Array<Task>>;
  _outputMessages: Subject<Message>;

  constructor() {
    this.id = 'swiftpm';
    this.name = 'Swift';

    const dispatcher = new Dispatcher();
    this._store = new SwiftPMBuildSystemStore(dispatcher);
    this._actions = new SwiftPMBuildSystemActions(dispatcher);
    this._outputMessages = new Subject();
    this._autocompletionProvier = new SwiftPMAutocompletionProvider(this._store);

    this._disposables = new CompositeDisposable();
    this._disposables.add(this._store);
    this._disposables.add(this._outputMessages);

    this._disposables.add(atom.workspace.observeTextEditors(editor => {
      editor.addGutter({
        name: 'nuclide-swift-test-result',
        visible: false,
      });
    }));
  }

  dispose(): void {
    this._disposables.dispose();
  }

  getExtraUi(): ReactClass<any> {
    const store = this._store;
    const actions = this._actions;
    return class ExtraUi extends React.Component {
      props: {
        activeTaskType: ?string;
      };

      render(): React.Element<any> {
        return (
          <SwiftPMBuildSystemToolbar
            store={store}
            actions={actions}
            activeTaskType={this.props.activeTaskType}
          />
        );
      }
    };
  }

  observeTasks(cb: (tasks: Array<Task>) => mixed): IDisposable {
    if (this._tasks == null) {
      this._tasks = Observable.of(SwiftPMBuildSystemTasks);
    }
    return new DisposableSubscription(
      this._tasks.subscribe({next: cb})
    );
  }

  getIcon(): ReactClass<any> {
    return SwiftIcon;
  }

  runTask(taskType: string): TaskInfo {
    const chdir = this._store.getChdir();
    const configuration = this._store.getConfiguration();
    const buildPath = this._store.getBuildPath();

    let command;
    switch (taskType) {
      case SwiftPMBuildSystemBuildTask.type:
        command = buildCommand(
          chdir,
          configuration,
          this._store.getXcc(),
          this._store.getXlinker(),
          this._store.getXswiftc(),
          buildPath,
        );
        break;
      case SwiftPMBuildSystemTestTask.type:
        command = testCommand(chdir, buildPath);
        break;
      case 'create-new-package':
        command = createNewPackageCommand(this._store);
        break;
      case 'fetch-package-dependencies':
        command = fetchPackageDependenciesCommand(this._store);
        break;
      case 'update-package-dependencies':
        command = updatePackageDependenciesCommand(this._store);
        break;
      case 'generate-xcode-project':
        command = generateXcodeProjectCommand(this._store);
        break;
      case 'visualize-package-dependencies':
        command = visualizePackageDependenciesCommand(this._store);
        break;
      default:
        command = displayBufferDescriptionCommand(this._store);
    }

    atom.commands.dispatch(atom.views.getView(atom.workspace), 'nuclide-console:show');
    this._logOutput(`${command.command} ${command.args.join(' ')}`, 'log');

    const observable = observeProcess(
      () => safeSpawn(command.command, command.args)
    ).do(message => {
      switch (message.kind) {
        case 'stderr':
        case 'stdout':
          this._logOutput(message.data, 'log');
          // FIXME: These test failures are displayed but never removed.
          //        nuclide-swift should cache a list of files/lines for test
          //        failures, and remove test failures before each task is run.
          this._showTestFailure(message.data);
          break;
        case 'exit':
          this._logOutput(`Exited with exit code ${message.exitCode}`, 'log');
          if (message.exitCode === 0 && taskType === SwiftPMBuildSystemBuildTask.type) {
            this._actions.updateCompileCommands(
              chdir,
              configuration,
              buildPath,
            );
          }
          break;
        default:
          break;
      }
      return message;
    });

    const taskInfo = observableToBuildTaskInfo(observable);
    invariant(taskInfo.observeProgress != null);
    return {
      observeProgress: taskInfo.observeProgress,
      onDidComplete: taskInfo.onDidComplete,
      onDidError: taskInfo.onDidError,
      cancel: () => {
        this._logOutput('Task cancelled.', 'warning');
        taskInfo.cancel();
      },
    };
  }

  async updateCwd(path: string) {
    const fileExists = await fsPromise.exists(`${path}/Package.swift`);
    if (fileExists) {
      this._actions.updateChdir(path);
    }
  }

  getOutputMessages(): Observable<Message> {
    return this._outputMessages;
  }

  getAutocompletionProvider(): SwiftPMAutocompletionProvider {
    return this._autocompletionProvier;
  }

  _logOutput(text: string, level: Level) {
    this._outputMessages.next({text, level});
  }

  async _showTestFailure(text: string) {
    if (!text.includes('error:')) {
      return;
    }
    const components = text.split(':');
    if (components.length < 2) {
      return;
    }

    const path = components[0];
    const fileExists = await fsPromise.exists(path);
    if (fileExists) {
      for (const editor of atom.workspace.getTextEditors()) {
        if (editor.getBuffer().getPath() === path) {
          const line = parseInt(components[1], 10) - 1;
          addTestResultGutterIcon(editor, line, 'nuclide-swift-test-failed-icon');
          highlightLine(editor, line);
        }
      }
    } else {
      atom.notifications.addError('Error', {
        detail: text.substring(text.indexOf("error:") + 7),
        dismissable: true,
      });
    }
  }
}
