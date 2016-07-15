'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {SourceKittenCompletion} from './SourceKittenCompletion';

import {asyncExecute} from '../../../../commons-node/process';
import SwiftPMBuildSystemStore from '../SwiftPMBuildSystemStore';
import getSourceKittenPath from './SourceKitten';
import sourceKittenCompletionToAtomSuggestion from './SourceKittenCompletion';

/**
 * An autocompletion provider that uses the compile commands in a built Swift
 * package's debug.yaml or release.yaml.
 */
export default class SwiftPMAutocompletionProvider {
  _store: SwiftPMBuildSystemStore;

  constructor(store: SwiftPMBuildSystemStore) {
    this._store = store;
  }

  async getAutocompleteSuggestions(
    request: {
      editor: atom$TextEditor;
      bufferPosition: atom$Point;
      scopeDescriptor: any;
      prefix: string;
    },
  ): Promise<?Array<atom$AutocompleteSuggestion>> {
    const filePath = request.editor.getPath();
    let compilerArgs;
    if (filePath) {
      const commands = await this._store.getCompileCommands();
      compilerArgs = commands.get(filePath);
    }

    const sourceKittenPath = getSourceKittenPath();
    const {bufferPosition, editor, prefix} = request;
    const offset = editor.getBuffer().characterIndexForPosition(bufferPosition) - prefix.length;
    const args = [
      'complete',
      '--text', request.editor.getText(),
      '--offset', String(offset),
      '--compilerargs', '--',
      compilerArgs ? compilerArgs : '',
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
      return new Promise((resolve, reject) => {
        resolve(null);
      });
    }

    return JSON.parse(result.stdout)
      .filter((completion: SourceKittenCompletion) => completion.name.startsWith(prefix))
      .map(sourceKittenCompletionToAtomSuggestion);
  }
}
