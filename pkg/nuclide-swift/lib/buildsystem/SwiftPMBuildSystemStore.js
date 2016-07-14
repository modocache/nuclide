'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {Emitter} from 'atom';
import {Dispatcher} from 'flux';
import SwiftPMBuildSystemActions from './SwiftPMBuildSystemActions';
import {llbuildYamlPath, readCompileCommands} from './LlbuildYamlParser';

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
  _compileCommands: Promise<Map<string, string>>;

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
    this._compileCommands = new Map();

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
        case SwiftPMBuildSystemActions.ActionType.UPDATE_COMPILE_COMMANDS:
          this._compileCommands = readCompileCommands(llbuildYamlPath(
            action.chdir,
            action.configuration,
            action.buildPath
          ));
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

  getCompileCommands(): Promise<Map<string, string>> {
    return this._compileCommands;
  }
}
