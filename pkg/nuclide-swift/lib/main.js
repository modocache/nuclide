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
import type {OutputService} from '../../nuclide-console/lib/types';
import type {CwdApi} from '../../nuclide-current-working-directory/lib/CwdApi';
import type {NuclideSideBarService} from '../../nuclide-side-bar';
import type {SwiftPMBuildSystem as SwiftPMBuildSystemType} from './buildsystem/SwiftPMBuildSystem';

import invariant from 'assert';
import {CompositeDisposable, Disposable} from 'atom';
import {SwiftPMBuildSystem} from './buildsystem/SwiftPMBuildSystem';

// Another name for these would be `subscriptions`. This package subscribes to
// one or more Atom events. These subscriptions are collected in this object
// and disposed of when this package is deactivated. For details, see:
// http://flight-manual.atom.io/hacking-atom/sections/package-word-count/.
let _disposables: ?CompositeDisposable = null;
let _buildSystem: ?SwiftPMBuildSystemType = null;

export function activate(rawState: ?Object): void {
  invariant(_disposables == null);
  _disposables = new CompositeDisposable(
    new Disposable(),
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

function _getBuildSystem(): SwiftPMBuildSystem {
  if (_buildSystem == null) {
    invariant(_disposables != null);
    _buildSystem = new SwiftPMBuildSystem();
    _disposables.add(_buildSystem);
  }
  return _buildSystem;
}

export function createAutocompleteProvider(): mixed {
  return {
    selector: '.source.swift',
    inclusionPriority: 1,
    disableForSelector: '.source.swift .comment',
    getSuggestions(request) {
      _getBuildSystem().getAutocompletionProvider().getAutocompleteSuggestions(request);
    },
  };
}
