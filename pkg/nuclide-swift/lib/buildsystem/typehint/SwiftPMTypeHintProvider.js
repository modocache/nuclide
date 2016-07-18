'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {Range} from 'atom';
import type {TypeHint} from '../../../../nuclide-type-hint/lib/types';
import type {SourceKittenSyntax} from './SourceKittenSyntax';

import {asyncExecute} from '../../../../commons-node/process';
import featureConfig from '../../../../nuclide-feature-config';
import SwiftPMBuildSystemStore from '../SwiftPMBuildSystemStore';
// FIXME: SourceKitten utilities should live outside of autocompletion.
import getSourceKittenPath from '../autocompletion/SourceKitten';
import {swiftDemangleUSR} from './SwiftDemangle';

export default class SwiftPMTypeHintProvider {
  _store: SwiftPMBuildSystemStore;

  constructor(store: SwiftPMBuildSystemStore) {
    this._store = store;
  }

  async typeHint(editor: TextEditor, position: atom$Point): Promise<?TypeHint> {
    const enabled = featureConfig.get('nuclide-swift.enableTypeHints');
    if (!enabled) {
      return null;
    }

    const filePath = editor.getPath();
    let compilerArgs;
    if (filePath) {
      const commands = await this._store.getCompileCommands();
      compilerArgs = commands.get(filePath);
    }

    const sourceKittenPath = getSourceKittenPath();
    const args = [
      'index',
      '--file', editor.getBuffer().getPath(),
      // FIXME: https://github.com/jpsim/SourceKitten/pull/225 needs to be
      //        merged for this to work. In the meantime, pull down the changes
      //        in that pull request and build from source in order to display
      //        typehints.
      '--compilerargs', '--',
      compilerArgs ? compilerArgs : '',
    ];

    // FIXME: SourceKitten.js should provide a reusable function to launch
    //        SourceKitten and grab its stdout. This code is duplicated in
    //        SwiftPMAutocompletionProvider.
    const result = await asyncExecute(sourceKittenPath, args);
    if (result.exitCode === null) {
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
      return null;
    }

    // FIXME: This code needs to be cleaned up.
    const index = JSON.parse(result.stdout);
    for (let i = 0; i < index['key.entities'].length; i++) {
      const entity = index['key.entities'][i];
      const range = new Range(
        [entity['key.line'] - 1, entity['key.column']],
        [entity['key.line'] - 1, entity['key.column'] + entity['key.name'].length],
      );
      if (range.containsPoint(position)) {
        const hint = await swiftDemangleUSR(entity['key.usr']);
        return { range, hint };
      }
    }

    return null;
  }
}
