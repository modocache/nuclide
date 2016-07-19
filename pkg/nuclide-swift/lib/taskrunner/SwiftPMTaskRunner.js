'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Task, TaskInfo} from '../../../nuclide-task-runner/lib/types';
import type {Level, Message} from '../../../nuclide-console/lib/types';
import type {SwiftPMTaskRunnerStoreState} from './SwiftPMTaskRunnerStoreState';

import invariant from 'assert';
import {Observable, Subject} from 'rxjs';
import {Dispatcher} from 'flux';
import {CompositeDisposable} from 'atom';
import {React} from 'react-for-atom';
import fsPromise from '../../../commons-node/fsPromise';
import {DisposableSubscription} from '../../../commons-node/stream';
import {observeProcess, safeSpawn} from '../../../commons-node/process';
import {observableToTaskInfo} from '../../../commons-node/observableToTaskInfo';
import SwiftPMTaskRunnerStore from './SwiftPMTaskRunnerStore';
import SwiftPMTaskRunnerActions from './SwiftPMTaskRunnerActions';
import {buildCommand, testCommand} from './SwiftPMTaskRunnerCommands';
import {
  SwiftPMTaskRunnerBuildTask,
  SwiftPMTaskRunnerTestTask,
  SwiftPMTaskRunnerTasks,
} from './SwiftPMTaskRunnerTasks';
import SwiftPMTaskRunnerToolbar from './toolbar/SwiftPMTaskRunnerToolbar';
import SwiftPMAutocompletionProvider from './providers/SwiftPMAutocompletionProvider';
import {SwiftIcon} from '../ui/SwiftIcon';

/**
 * The primary controller for spawning SwiftPM tasks, such as building a
 * package, or running its tests.
 *
 * This class conforms to Nuclide's TaskRunner interface, and makes use of the
 * Flux design pattern. This class is responsible for kicking off SwiftPM tasks
 * such as building a package. How it builds the package is determined by the
 * state of the SwiftPMTaskRunnerToolbar -- the path to the package, whether a
 * build path is specified, etc. -- and that state is maintained by the
 * SwiftPMTaskRunnerStore. Updates to the toolbar UI options trigger actions,
 * defined in SwiftPMTaskRunnerActions, which update the state of the store.
 * Actions are routed to the store via a Flux.Dispatcher (instantiated by this
 * class).
 */
export class SwiftPMTaskRunner {
  id: string;
  name: string;
  _disposables: CompositeDisposable;
  _store: SwiftPMTaskRunnerStore;
  _autocompletionProvier: SwiftPMAutocompletionProvider;
  _actions: SwiftPMTaskRunnerActions;
  _tasks: Observable<Array<Task>>;
  _outputMessages: Subject<Message>;

  constructor(initialState: ?SwiftPMTaskRunnerStoreState) {
    this.id = 'swiftpm';
    this.name = 'Swift';

    const dispatcher = new Dispatcher();
    this._store = new SwiftPMTaskRunnerStore(dispatcher, initialState);
    this._actions = new SwiftPMTaskRunnerActions(dispatcher);
    this._outputMessages = new Subject();
    this._autocompletionProvier = new SwiftPMAutocompletionProvider(this._store);

    this._disposables = new CompositeDisposable();
    this._disposables.add(this._store);
    this._disposables.add(this._outputMessages);
  }

  dispose(): void {
    this._disposables.dispose();
  }

  serialize(): SwiftPMTaskRunnerStoreState {
    return this._store.serialize();
  }

  getExtraUi(): ReactClass<any> {
    const store = this._store;
    const actions = this._actions;
    return class ExtraUi extends React.Component {
      props: {
        activeTaskType: ?string,
      };

      render(): React.Element<any> {
        return (
          <SwiftPMTaskRunnerToolbar
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
      this._tasks = Observable.of(SwiftPMTaskRunnerTasks);
    }
    return new DisposableSubscription(
      this._tasks.subscribe({next: cb}),
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
      case SwiftPMTaskRunnerBuildTask.type:
        command = buildCommand(
          chdir,
          configuration,
          this._store.getXcc(),
          this._store.getXlinker(),
          this._store.getXswiftc(),
          buildPath,
        );
        break;
      case SwiftPMTaskRunnerTestTask.type:
        command = testCommand(chdir, buildPath);
        break;
      default:
        // FIXME: Throw an error for unknown task types.
        command = testCommand(chdir, buildPath);
        break;
    }

    atom.commands.dispatch(atom.views.getView(atom.workspace), 'nuclide-console:show');
    this._logOutput(`${command.command} ${command.args.join(' ')}`, 'log');

    const observable = observeProcess(
      () => safeSpawn(command.command, command.args),
    ).do(message => {
      switch (message.kind) {
        case 'stderr':
        case 'stdout':
          this._logOutput(message.data, 'log');
          break;
        case 'exit':
          this._logOutput(`Exited with exit code ${message.exitCode}`, 'log');
          if (message.exitCode === 0 && taskType === SwiftPMTaskRunnerBuildTask.type) {
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

    const taskInfo = observableToTaskInfo(observable);
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
}
