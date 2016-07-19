'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {asyncExecute} from '../../../commons-node/process';
import featureConfig from '../../../nuclide-feature-config';

/**
 * Commands that SourceKitten implements and nuclide-swift supports, such as
 * "complete" for autocompletion.
 */
export type SourceKittenCommand = 'complete';

/**
 * Returns the path to SourceKitten, based on the user's Nuclide config.
 */
export function getSourceKittenPath(): string {
  return (featureConfig.get('nuclide-swift.sourceKittenPath'): any);
}

/**
 * Executes a SourceKitten request asyncrhonously.
 * If an error occurs, displays an error and returns null.
 * Otherwise, returns the stdout from SourceKitten.
 */
export async function asyncExecuteSourceKitten(
  command: SourceKittenCommand,
  args: Array<string>,
): Promise<?string> {
  const sourceKittenPath = getSourceKittenPath();
  const result = await asyncExecute(sourceKittenPath, [command].concat(args));
  if (result.exitCode == null) {
    const errorCode = result.errorCode ? result.errorCode : '';
    const errorMessage = result.errorMessage ? result.errorMessage : '';
    atom.notifications.addError('Error', {
      detail: `Could not invoke SourceKitten at path '${sourceKittenPath}'. ` +
              'Please double-check that the path you have set for the ' +
              'nuclide-swift.sourceKittenPath config setting is correct.\n' +
              `Error code: "${errorCode}"\n` +
              `Error message: "${errorMessage}"`,
      dismissable: true,
    });
    return null;
  } else if (result.exitCode !== 0 || result.stdout.length === 0) {
    atom.notifications.addError('Error', {
      detail: 'An error occured when invoking SourceKitten. Please file a ' +
              'bug.\n' +
              `exit code: ${result.exitCode}\n` +
              `stdout: ${result.stdout}\n` +
              `stderr: ${result.stderr}\n` +
              `command: ${result.command ? result.command : ''}\n`,
      dismissable: true,
    });
    return null;
  }

  return result.stdout;
}
