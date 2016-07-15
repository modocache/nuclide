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
 * https://github.com/jpsim/SourceKitten/tree/cbd9625970d968582a218461262a2d70cbb5fb90#syntax
 */
export type SourceKittenSyntax = {
  offset: number;
  length: number;
  type: string;
};
