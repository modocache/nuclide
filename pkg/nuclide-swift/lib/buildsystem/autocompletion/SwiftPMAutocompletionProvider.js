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
    const sourceKittenPath = _getSourceKittenPath();
    const {bufferPosition, editor, prefix} = request;
    const offset = editor.getBuffer().characterIndexForPosition(bufferPosition) - prefix.length;
    const args = [
      'complete',
      '--text', request.editor.getText(),
      '--offset', String(offset),
      '--compilerargs', '--',
      // FIXME: These parameters are hardcoded, but they don't need to be.
      //        Using `this.getLlbuildYaml()`, it should be possible to get the
      //        path to this Swift package's {debug|release}.yaml, which looks
      //        like this:
      //
      //        commands:
      //          "<ModuleOne.module>":
      //            # ...
      //          "<ModuleTwo.module>":
      //            sources: ["/path/to/file.swift","/path/to/another/file.swift"]
      //            other-args: ["-Onone","-g","-enable-testing"]
      //
      //        These compiler arguments below are just the "other-args"
      //        arguments with the "sources" paths appended to the end. The
      //        tricky part is finding the current `editor.getPath()` in the
      //        "sources" field, then plucking the corresponding "other-args"
      //        out of the YAML. This could end up being expensive, but it's
      //        certainly doable.
      '-sdk /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.11.sdk -D SWIFT_PACKAGE -Onone -g -enable-testing -F /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/Library/Frameworks -target x86_64-apple-macosx10.10 -module-cache-path /Users/bgesiak/GitHub/tmp/MyCoolPackage/.build/debug/ModuleCache /Users/bgesiak/GitHub/tmp/MyCoolPackage/Sources/MyCoolPackage.swift /Users/bgesiak/GitHub/tmp/MyCoolPackage/Sources/AnotherSourceFile.swift',
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

  async getLlbuildYaml(): Promise<?string> {
    if (this._store.getBuildPath().length > 0) {
      const path = await this._getLlbuildYaml(
        this._store.getBuildPath(), this._store.getConfiguration());
      if (path) {
        return path;
      }
    }

    return await this._getLlbuildYaml(
      this._store.getChdir(), this._store.getConfiguration());
  }

  async _getLlbuildYaml(
    buildDirectoryPath: string,
    configuration: string,
  ): Promise<?string> {
    let alternativeConfiguration;
    if (configuration === 'debug') {
      alternativeConfiguration = 'release';
    } else {
      alternativeConfiguration = 'debug';
    }

    const path = `${buildDirectoryPath}/${configuration}.yaml`;
    if (await fsPromise.exists(path)) {
      return path;
    }

    const alternativePath = `${buildDirectoryPath}/${alternativeConfiguration}.yaml`;
    if (await fsPromise.exists(alternativePath)) {
      return alternativePath;
    }
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
    description: suggestion.docBrief,
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
