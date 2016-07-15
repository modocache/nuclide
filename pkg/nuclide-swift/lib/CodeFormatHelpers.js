'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {asyncExecute} from '../../commons-node/process';
import {trackTiming} from '../../nuclide-analytics';
import {getLogger} from '../../nuclide-logging';
import fsPromise from '../../commons-node/fsPromise';


export default class CodeFormatHelpers {
  @trackTiming('nuclide-swift.formatCode')
  static async formatEntireFile(editor: atom$TextEditor, range: atom$Range): Promise<{
    newCursor?: number;
    formatted: string;
  }> {
    const tempFile = await fsPromise.tempfile();
    try {
      const beforeFile = editor.getBuffer().getText();
      await fsPromise.writeFile(tempFile, beforeFile);

      const result = await asyncExecute(
        'sourcekitten',
        ['format', '--file', tempFile],
        {}
      );
      const afterFile = await fsPromise.readFile(tempFile, 'utf8');

      return {
        newCursor: null,
        formatted: afterFile,
      };
    } catch (e) {
      getLogger().error('Could not run `sourcekitten format`', e);
      throw new Error('Could not run `sourcekitten format`.<br>Ensure it is installed and in your $PATH.');
    } finally {
      await fsPromise.unlink(tempFile);
    }
  }
}
