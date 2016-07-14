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
import fsPromise from '../../../../commons-node/fsPromise';
import featureConfig from '../../../../nuclide-feature-config';
import SwiftPMBuildSystemStore from '../SwiftPMBuildSystemStore';

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
      compilerArgs = this._store.getCompileCommands().get(filePath)
    }

    const sourceKittenPath = _getSourceKittenPath();
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
      .map(rawCompletionToSuggestion);
  }
}

function _getSourceKittenPath(): string {
  return (featureConfig.get('nuclide-swift.sourceKittenPath'): any);
}

function rawCompletionToSuggestion(
  suggestion: SourceKittenCompletion,
): atom$AutocompleteSuggestion {
  const snippet = formatSuggestionForSnippet(suggestion);
  return {
    text: suggestion.name,
    snippet: snippet ? snippet : '',
    rightLabel: suggestion.kind,
    description: suggestion.docBrief ? suggestion.docBrief : '',
  };
}

function formatSuggestionForSnippet(suggestion: SourceKittenCompletion): ?string {
  // TODO(mbolin): Format suggestion.sourcetext, which is something like:
  //
  // zip(<#T##sequence1: Sequence1##Sequence1#>, <#T##sequence2: Sequence2##Sequence2#>)
  //
  // to match the format of an Atom snippet:
  //
  // zip(${1:sequence1}, ${2:sequence2})
  //
  // For now, we match on the name rather than the sourcetext even though it has less information.

  // Suggestion names look something like "functionWithOneArgument(:)".
  // The first match here is for the first whole word ("functionWithOneArgument").
  // The second match is for the remainder.
  const match = suggestion.name.match(/^(\w+)\(([^\)]+)\)$/);
  if (match) {
    const identifier = match[1];
    const args = match[2].split(':');
    args.pop();
    return identifier + '(' +
      args.map((arg, index) => `\${${index + 1}:${arg}}`).join(', ') +
      ')';
  } else {
    return null;
  }
}
