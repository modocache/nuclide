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

    const buffer = editor.getBuffer();
    const cursorOffset = buffer.characterIndexForPosition(position);

    // FIXME: `sourcekitten syntax` and `sourcekitten strcuture` don't take
    //        --compilerArgs arguments, but they should. Add support for one,
    //        then pipe these compile commands through to it. Use some sort of
    //        error handling here, to handle the case in which a user is using
    //        a version of SourceKitten that doesn't take a --compilerargs
    //        argument.
    const filePath = editor.getPath();
    let compilerArgs;
    if (filePath) {
      const commands = await this._store.getCompileCommands();
      compilerArgs = commands.get(filePath);
    }

    const sourceKittenPath = getSourceKittenPath();
    const args = [
      // FIXME: This should use `sourcekitten structure` instead.
      'syntax',
      '--text', editor.getText(),
      // FIXME: `sourcekitten syntax` doesn't take a --compilerArgs argument,
      //        but it should. Add support for one, then pipe these compile
      //        commands through to it.
      // '--compilerargs', '--',
      // compilerArgs ? compilerArgs : '',
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

    const syntaxes: Array<SourceKittenSyntax> = JSON.parse(result.stdout);
    for (let i = 0; i < syntaxes.length; i++) {
      const syntax = syntaxes[i];
      const range = new Range(
        buffer.positionForCharacterIndex(syntax.offset),
        buffer.positionForCharacterIndex(syntax.offset + syntax.length),
      );
      if (range.containsPoint(position)) {
        return {
          range,
          // FIXME: Use `sourcekitten structure` instead to display better
          //        typehints.
          hint: syntax.type,
        }
      }
    }

    return null;
  }
}
