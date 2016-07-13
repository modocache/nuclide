'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {asyncExecute} from '../../../../commons-node/process';

/**
 * A SourceKit USR looks something like this:
 * s:F13MyCoolPackages6raichuVS_7Pokemon. The Swift symbol equivalent is
 * _TF13MyCoolPackages6raichuVS_7Pokemon -- in other words, replace the "s:"
 * with a "_T". We can then feed the symbol to `xcrun swift-demangle` to
 * demangle it.
 * FIXME: This uses `xcrun swift-demangle`, but it should use SourceKit request
 *        type source.request.demangle instead. That request type needs to be
 *        added to SourceKitten.
 */
export async function swiftDemangleUSR(usr: string): Promise<string> {
  const symbol = usr.replace(/^s:/, '_T');
  const result = await asyncExecute('xcrun', ['swift-demangle', '-compact', symbol]);
  return result.stdout ? result.stdout : usr;
}
