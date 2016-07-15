'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {TypeHint} from '../../../../nuclide-type-hint/lib/types';

import {asyncExecute} from '../../../../commons-node/process';
import featureConfig from '../../../../nuclide-feature-config';
import SwiftPMBuildSystemStore from '../SwiftPMBuildSystemStore';
// FIXME: SourceKitten utilities should live outside of autocompletion.
import getSourceKittenPath from '../autocompletion/SourceKitten';

export default class SwiftPMTypeHintProvider {
  _store: SwiftPMBuildSystemStore;

  constructor(store: SwiftPMBuildSystemStore) {
    this._store = store;
  }

  async typeHint(editor: TextEditor, position: atom$Point): Promise<?TypeHint> {
    console.log('FIXME: Why is this console.log never printed...?');

    const enabled = featureConfig.get('nuclide-swift.enableTypeHints');
    if (!enabled) {
      return null;
    }

    // FIXME: `sourcekitten syntax` doesn't take a --compilerArgs argument,
    //        but it should. Add support for one, then pipe these compile
    //        commands through to it.
    const filePath = editor.getPath();
    let compilerArgs;
    if (filePath) {
      const commands = await this._store.getCompileCommands();
      compilerArgs = commands.get(filePath);
    }

    const sourceKittenPath = getSourceKittenPath();
    const args = [
      'syntax',
      '--text', editor.getText(),
      // FIXME: `sourcekitten syntax` doesn't take a --compilerArgs argument,
      //        but it should. Add support for one, then pipe these compile
      //        commands through to it.
      // '--compilerargs', '--',
      // compilerArgs ? compilerArgs : '',
    ];

    const result = await asyncExecute(sourceKittenPath, args);
    if (result.exitCode === null) {
      // FIXME: Display this error to the user via an error modal or something.
      const errorCode = result.errorCode ? result.errorCode : '';
      const errorMessage = result.errorMessage ? result.errorMessage : '';
      throw new Error(
        `Could not invoke SourceKitten at path '${sourceKittenPath}'. ` +
        'Please double-check that the path you have set for the ' +
        'nuclide-swift.sourceKittenPath config setting is correct. ' +
        `Error code "${errorCode}", "${errorMessage}"`
      );
    } else if (result.exitCode !== 0 || result.stdout.length === 0) {
      // We probably parsed the llbuild YAML incorrectly, resulting in
      // bad parameters being passed to SourceKitten. Return an empty set of
      // autocompletion suggestions.
      // FIXME: It would be great to track this error case somehow, perhaps by
      //        sending up some anonymized logs.
      return null;
    }

    return null;
  }
}
