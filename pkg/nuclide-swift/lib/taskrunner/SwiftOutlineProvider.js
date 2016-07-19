'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Outline, OutlineTree} from '../../../nuclide-outline-view';

import {Point} from 'atom';
import {asyncExecute} from '../../../commons-node/process';
import {arrayCompact} from '../../../commons-node/collection';

export async function getOutline(editor: atom$TextEditor): Promise<?Outline> {
  const contents = editor.getText();
  const result = await asyncExecute(
    // TODO use the setting for sourcekitten path
    'sourcekitten',
    [
      'structure',
      '--text', contents,
      // TODO add compiler args?
    ],
  );

  // TODO handle errors
  return outputToOutline(result.stdout);
}

function outputToOutline(output: string): Outline {
  const json = JSON.parse(output);

  const outlineTrees: Array<?OutlineTree> = json['key.substructure'].map(itemToOutline);
  return {
    outlineTrees: arrayCompact(outlineTrees),
  };
}

function itemToOutline(item: Object): ?OutlineTree {
  // TODO support more things
  switch (item['key.kind']) {
    case 'source.lang.swift.decl.var.global':
      return {
        plainText: item['key.name'],
        // TODO get the actual start position
        startPosition: new Point(0, 0),
        children: [],
      };
    default:
      return null;
  }
}
