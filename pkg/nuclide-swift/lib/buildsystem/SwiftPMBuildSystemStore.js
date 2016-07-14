'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {join} from 'path';
import {Emitter} from 'atom';
import {Dispatcher} from 'flux';
import SwiftPMBuildSystemActions from './SwiftPMBuildSystemActions';

export default class SwiftPMBuildSystemStore {
  _dispatcher: Dispatcher;
  _emitter: Emitter;
  _chdir: string;
  _configuration: string;
  _buildPath: string;
  _flag: string;
  _Xcc: string;
  _Xlinker: string;
  _Xswiftc: string;
  _testBuildPath: string;
  _mostRecentlyGeneratedLlbuildYAMLPath: string;

  constructor(dispatcher: Dispatcher) {
    this._dispatcher = dispatcher;
    this._emitter = new Emitter();
    this._chdir = '';
    this._configuration = 'debug';
    this._buildPath = '';
    this._flag = 'xcc';
    this._Xcc = '';
    this._Xlinker = '';
    this._Xswiftc = '';
    this._testBuildPath = '';
    this._mostRecentlyGeneratedLlbuildYAMLPath = '';

    this._dispatcher.register(action => {
      switch (action.actionType) {
        case SwiftPMBuildSystemActions.ActionType.UPDATE_CHDIR:
          this._chdir = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_CONFIGURATION:
          this._configuration = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_BUILD_PATH:
          this._buildPath = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_FLAG:
          this._flag = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_XCC:
          this._Xcc = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_XLINKER:
          this._Xlinker = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_XSWIFTC:
          this._Xswiftc = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_TEST_BUILD_PATH:
          this._testBuildPath = action.value;
          break;
        case SwiftPMBuildSystemActions.ActionType.UPDATE_MOST_RECENTLY_GENERATED_LLBUILD_YAML_PATH:
          this._mostRecentlyGeneratedLlbuildYAMLPath = action.value;
          break;
      }
    });
  }

  dispose() {
    this._emitter.dispose();
  }

  subscribe(callback: () => void): IDisposable {
    return this._emitter.on('change', callback);
  }

  emitChange(): void {
    this._emitter.emit('change');
  }

  getChdir(): string {
    return this._chdir;
  }

  getConfiguration(): string {
    return this._configuration;
  }

  getBuildPath(): string {
    return this._buildPath;
  }

  getFlag(): string {
    return this._flag;
  }

  getXcc(): string {
    return this._Xcc;
  }

  getXlinker(): string {
    return this._Xlinker;
  }

  getXswiftc(): string {
    return this._Xswiftc;
  }

  getTestBuildPath(): string {
    return this._testBuildPath;
  }

  /**
   * SwiftPM generates YAML, which is then consumed by llbuild. However, it
   * can generate that YAML at one of several paths:
   *
   *   - If the build configuration is 'debug', it generates a 'debug.yaml'.
   *   - If the build configuration is 'release', it generates a 'release.yaml'.
   *   - If no --build-path is specified, it generates
   *     '.build/{debug|release}.yaml'.
   *   - If a --build-path is specified, it generates
   *     '/path/to/build/path/{debug|release.yaml}'.
   *
   * This function returns the path to YAML file that will be generated if a
   * build task is begun with the current store's settings.
   */
  getLlbuildYamlPath(): string {
    const yamlFileName = `${this.getConfiguration()}.yaml`;
    const buildPath = this.getBuildPath();
    if (buildPath.length > 0) {
      return join(buildPath, yamlFileName);
    } else {
      return join(this.getChdir(), '.build', yamlFileName);
    }
  }

  getMostRecentlyGeneratedLlbuildYamlPath() {
    return this._mostRecentlyGeneratedLlbuildYAMLPath;
  }
}