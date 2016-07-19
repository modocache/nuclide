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

import featureConfig from '../../../../nuclide-feature-config';
import {asyncExecuteSourceKitten} from '../../sourcekitten/SourceKitten';
import SwiftPMTaskRunnerStore from '../SwiftPMTaskRunnerStore';
import {swiftDemangleUSR} from './SwiftDemangle';

export default class SwiftPMTypeHintProvider {
  _store: SwiftPMTaskRunnerStore;

  constructor(store: SwiftPMTaskRunnerStore) {
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
    const result = await asyncExecuteSourceKitten('index', [
      '--file', editor.getBuffer().getPath(),
      // FIXME: A SourceKitten release that includes
      //        https://github.com/jpsim/SourceKitten/pull/225 needs to be
      //        merged for this to work. In the meantime, pull down the changes
      //        in that pull request and build from source in order to display
      //        typehints.
      '--compilerargs', '--',
      compilerArgs ? compilerArgs : '',
    ]);

    if (!result) {
      return null;
    }

    // FIXME: This code needs to be cleaned up.
    const index = JSON.parse(result);
    for (let i = 0; i < index['key.entities'].length; i++) {
      const entity = index['key.entities'][i];
      const range = new Range(
        [entity['key.line'] - 1, entity['key.column']],
        [entity['key.line'] - 1, entity['key.column'] + entity['key.name'].length],
      );
      if (range.containsPoint(position)) {
        const hint = await swiftDemangleUSR(entity['key.usr']);
        return {
          range,
          hint,
        };
      }
    }

    return null;
  }
}
