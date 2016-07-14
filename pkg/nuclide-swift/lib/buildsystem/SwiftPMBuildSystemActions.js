'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {keyMirror} from '../../../commons-node/collection';
import {Dispatcher} from 'flux';

export default class SwiftPMBuildSystemActions {
  _dispatcher: Dispatcher;

  static ActionType = Object.freeze(keyMirror({
    UPDATE_CHDIR: null,
    UPDATE_CONFIGURATION: null,
    UPDATE_BUILD_PATH: null,
    UPDATE_FLAG: null,
    UPDATE_XCC: null,
    UPDATE_XLINKER: null,
    UPDATE_XSWIFTC: null,
    UPDATE_TEST_BUILD_PATH: null,
    UPDATE_MOST_RECENTLY_GENERATED_LLBUILD_YAML_PATH: null,
  }));

  constructor(dispatcher: Dispatcher) {
    this._dispatcher = dispatcher;
  }

  updateChdir(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_CHDIR,
      value,
    });
  }

  updateConfiguration(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_CONFIGURATION,
      value,
    });
  }

  updateBuildPath(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_BUILD_PATH,
      value,
    });
  }

  updateFlag(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_FLAG,
      value,
    });
  }

  updateXcc(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_XCC,
      value,
    });
  }

  updateXlinker(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_XLINKER,
      value,
    });
  }

  updateXswiftc(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_XSWIFTC,
      value,
    });
  }

  updateTestBuildPath(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_TEST_BUILD_PATH,
      value,
    });
  }

  updateMostRecentlyGeneratedLlbuildYamlPath(value: string): void {
    this._dispatcher.dispatch({
      actionType: SwiftPMBuildSystemActions.ActionType.UPDATE_MOST_RECENTLY_GENERATED_LLBUILD_YAML_PATH,
      value,
    });
  }
}
