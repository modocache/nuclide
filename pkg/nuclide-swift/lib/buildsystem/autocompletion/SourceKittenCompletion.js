'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * The struct returned by `sourcekitten complete`.
 * For details, see:
 * https://github.com/jpsim/SourceKitten/tree/cbd9625970d968582a218461262a2d70cbb5fb90#complete
 */
export type SourceKittenCompletion = {
  descriptionKey: string;
  associatedUSRs: string;
  kind: string;
  sourcetext: string;
  context: string;
  typeName: string;
  moduleName: string;
  name: string;
  docBrief: string;
};
