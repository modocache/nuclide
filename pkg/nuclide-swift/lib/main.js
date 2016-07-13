'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {CodeFormatProvider} from '../../nuclide-code-format/lib/types';
import type {OutputService} from '../../nuclide-console/lib/types';
import type {CwdApi} from '../../nuclide-current-working-directory/lib/CwdApi';
import type {TaskRunnerServiceApi} from '../../nuclide-task-runner/lib/types';
import type {NuclideSideBarService} from '../../nuclide-side-bar';
import type {OutlineProvider} from '../../nuclide-outline-view';
import type {TypeHint, TypeHintProvider} from '../../nuclide-type-hint/lib/types';
import type {SwiftPMTaskRunner as SwiftPMTaskRunnerType} from './taskrunner/SwiftPMTaskRunner';
import type {SwiftPMTaskRunnerStoreState} from './taskrunner/SwiftPMTaskRunnerStoreState';

import invariant from 'assert';
import {CompositeDisposable, Disposable} from 'atom';
import {SwiftPMTaskRunner} from './taskrunner/SwiftPMTaskRunner';
import {getOutline} from './taskrunner/SwiftOutlineProvider';
import CodeFormatHelpers from './CodeFormatHelpers';

let _disposables: ?CompositeDisposable = null;
let _taskRunner: ?SwiftPMTaskRunnerType = null;
let _initialState: ?Object = null;

export function activate(rawState: ?Object): void {
  invariant(_disposables == null);
  _initialState = rawState;
  _disposables = new CompositeDisposable(
    new Disposable(() => { _taskRunner = null; }),
    new Disposable(() => { _initialState = null; }),
    atom.commands.add('atom-workspace', {
      'nuclide-swift:create-new-package': () =>
        _getTaskRunner().runTask('create-new-package'),
      'nuclide-swift:fetch-package-dependencies': () =>
        _getTaskRunner().runTask('fetch-package-dependencies'),
      'nuclide-swift:update-package-dependencies': () =>
        _getTaskRunner().runTask('update-package-dependencies'),
      'nuclide-swift:generate-xcode-project': () =>
        _getTaskRunner().runTask('generate-xcode-project'),
      'nuclide-swift:visualize-package-dependencies': () =>
        _getTaskRunner().runTask('visualize-package-dependencies'),
      'nuclide-swift:display-buffer-description': () =>
        _getTaskRunner().runTask('display-buffer-description'),
    }),
  );
}

export function deactivate(): void {
  invariant(_disposables != null);
  _disposables.dispose();
  _disposables = null;
}

export function consumeTaskRunnerServiceApi(
  serviceApi: TaskRunnerServiceApi,
): void {
  invariant(_disposables != null);
  _disposables.add(serviceApi.register(_getTaskRunner()));
}

export function consumeCurrentWorkingDirectory(service: CwdApi): void {
  invariant(_disposables != null);
  _disposables.add(service.observeCwd(cwd => {
    if (cwd != null) {
      _getTaskRunner().updateCwd(cwd.getPath());
    }
  }));
}

export function consumeOutputService(service: OutputService): void {
  invariant(_disposables != null);
  _disposables.add(service.registerOutputProvider({
    messages: _getTaskRunner().getOutputMessages(),
    id: 'swift',
  }));
}

export function consumeNuclideSideBar(sideBar: NuclideSideBarService): Disposable {
  // FIXME: Add a "Swift Package Tests" sidebar. See
  //        pkg/nuclide-source-control-side-bar for an example.
  return new Disposable(() => {});
}

export function serialize(): ?SwiftPMTaskRunnerStoreState {
  if (_taskRunner != null) {
    return _taskRunner.serialize();
  }
}

export function createAutocompleteProvider(): atom$AutocompleteProvider {
  return {
    selector: '.source.swift',
    inclusionPriority: 1,
    disableForSelector: '.source.swift .comment',
    getSuggestions(
      request: atom$AutocompleteRequest,
    ): Promise<?Array<atom$AutocompleteSuggestion>> {
      return _getTaskRunner().getAutocompletionProvider().getAutocompleteSuggestions(request);
    },
  };
}

export function getOutlineProvider(): OutlineProvider {
  return {
    grammarScopes: ['source.swift'],
    priority: 1,
    name: 'Swift',
    getOutline,
  };
}

export function provideCodeFormat(): CodeFormatProvider {
  return {
    selector: 'source.swift',
    inclusionPriority: 1,
    formatEntireFile(editor, range) {
      return CodeFormatHelpers.formatEntireFile(editor, range);
    },
  };
}

export function createTypeHintProvider(): TypeHintProvider {
  return {
    selector: 'source.swift',
    providerName: 'nuclide-swift',
    inclusionPriority: 1,
    typeHint(editor: TextEditor, position: atom$Point): Promise<?TypeHint> {
      return _getTaskRunner().getTypeHintProvider().typeHint(editor, position);
    },
  };
}

function _getTaskRunner(): SwiftPMTaskRunner {
  if (_taskRunner == null) {
    invariant(_disposables != null);
    _taskRunner = new SwiftPMTaskRunner(_initialState);
    _disposables.add(_taskRunner);
  }
  return _taskRunner;
}
