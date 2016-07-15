'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {BuildSystemRegistry} from '../../nuclide-build/lib/types';
import type {CodeFormatProvider} from '../../nuclide-code-format/lib/types';
import type {OutputService} from '../../nuclide-console/lib/types';
import type {CwdApi} from '../../nuclide-current-working-directory/lib/CwdApi';
import type {NuclideSideBarService} from '../../nuclide-side-bar';
import type {SwiftPMBuildSystem as SwiftPMBuildSystemType} from './buildsystem/SwiftPMBuildSystem';
import type {SwiftPMBuildSystemStoreState} from './buildsystem/SwiftPMBuildSystemStoreState';

import invariant from 'assert';
import {CompositeDisposable, Disposable} from 'atom';
import {SwiftPMBuildSystem} from './buildsystem/SwiftPMBuildSystem';
import CodeFormatHelpers from './CodeFormatHelpers';

// Another name for these would be `subscriptions`. This package subscribes to
// one or more Atom events. These subscriptions are collected in this object
// and disposed of when this package is deactivated. For details, see:
// http://flight-manual.atom.io/hacking-atom/sections/package-word-count/.
let _disposables: ?CompositeDisposable = null;
let _buildSystem: ?SwiftPMBuildSystemType = null;
let _initialState: ?Object = null;

export function activate(rawState: ?Object): void {
  invariant(_disposables == null);
  _initialState = rawState;
  _disposables = new CompositeDisposable(
    new Disposable(() => { _buildSystem = null; }),
    new Disposable(() => { _initialState = null; }),
    atom.commands.add('atom-workspace', {
      'nuclide-swift:create-new-package': () => _getBuildSystem().runTask('create-new-package'),
      'nuclide-swift:fetch-packages-dependencies': () => _getBuildSystem().runTask('fetch-package-dependencies'),
      'nuclide-swift:update-package-dependencies': () => _getBuildSystem().runTask('update-package-dependencies'),
      'nuclide-swift:generate-xcode-project': () => _getBuildSystem().runTask('generate-xcode-project'),
      'nuclide-swift:visualize-package-dependencies': () => _getBuildSystem().runTask('visualize-package-dependencies'),
      'nuclide-swift:display-buffer-description': () => _getBuildSystem().runTask('display-buffer-description'),
    }),
  );
}

export function deactivate(): void {
  invariant(_disposables != null);
  _disposables.dispose();
  _disposables = null;
}

export function consumeBuildSystemRegistry(registry: BuildSystemRegistry): void {
  invariant(_disposables != null);
  _disposables.add(registry.register(_getBuildSystem()));
}

export function consumeCurrentWorkingDirectory(service: CwdApi): void {
  invariant(_disposables != null);
  _disposables.add(service.observeCwd(cwd => {
    if (cwd != null) {
      _getBuildSystem().updateCwd(cwd.getPath());
    }
  }));
}

export function consumeOutputService(service: OutputService): void {
  invariant(_disposables != null);
  _disposables.add(service.registerOutputProvider({
    messages: _getBuildSystem().getOutputMessages(),
    id: 'swift',
  }));
}

export function consumeNuclideSideBar(sideBar: NuclideSideBarService): Disposable {
  // FIXME: Add a "Swift Package Tests" sidebar. See
  //        pkg/nuclide-source-control-side-bar for an example.
  return new Disposable(() => {});
}

export function serialize(): ?SwiftPMBuildSystemStoreState {
  if (_buildSystem != null) {
    return _buildSystem.serialize();
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
      return _getBuildSystem().getAutocompletionProvider().getAutocompleteSuggestions(request);
    },
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

function _getBuildSystem(): SwiftPMBuildSystem {
  if (_buildSystem == null) {
    invariant(_disposables != null);
    _buildSystem = new SwiftPMBuildSystem(_initialState);
    _disposables.add(_buildSystem);
  }
  return _buildSystem;
}
