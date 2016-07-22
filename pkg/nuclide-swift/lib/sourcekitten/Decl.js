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
 * SourceKit classifies identifiers into one of these classifications.
 */
export type SourceKittenDeclKind =
  'source.lang.swift.keyword' |
  'source.lang.swift.decl.associatedtype' |
  'source.lang.swift.decl.class' |
  'source.lang.swift.decl.enum' |
  'source.lang.swift.decl.enumelement' |
  'source.lang.swift.decl.extension.class' |
  'source.lang.swift.decl.function.accessor.getter' |
  'source.lang.swift.decl.function.accessor.setter' |
  'source.lang.swift.decl.function.constructor' |
  'source.lang.swift.decl.function.free' |
  'source.lang.swift.decl.function.method.class' |
  'source.lang.swift.decl.function.method.instance' |
  'source.lang.swift.decl.function.method.static' |
  'source.lang.swift.decl.function.operator.infix' |
  'source.lang.swift.decl.function.subscript' |
  'source.lang.swift.decl.generic_type_param' |
  'source.lang.swift.decl.protocol' |
  'source.lang.swift.decl.struct' |
  'source.lang.swift.decl.typealias' |
  'source.lang.swift.decl.var.global' |
  'source.lang.swift.decl.var.instance' |
  'source.lang.swift.decl.var.local' |
  'source.lang.swift.ref.associatedtype' |
  'source.lang.swift.ref.class' |
  'source.lang.swift.ref.enum' |
  'source.lang.swift.ref.enumelement' |
  'source.lang.swift.ref.function.constructor' |
  'source.lang.swift.ref.function.free' |
  'source.lang.swift.ref.function.method.class' |
  'source.lang.swift.ref.function.method.instance' |
  'source.lang.swift.ref.function.operator.infix' |
  'source.lang.swift.ref.function.subscript' |
  'source.lang.swift.ref.generic_type_param' |
  'source.lang.swift.ref.protocol' |
  'source.lang.swift.ref.struct' |
  'source.lang.swift.ref.typealias' |
  'source.lang.swift.ref.var.global' |
  'source.lang.swift.ref.var.instance' |
  'source.lang.swift.ref.var.local' |
  'source.lang.swift.syntaxtype.argument' |
  'source.lang.swift.syntaxtype.attribute.builtin' |
  'source.lang.swift.syntaxtype.comment' |
  'source.lang.swift.syntaxtype.identifier' |
  'source.lang.swift.syntaxtype.keyword' |
  'source.lang.swift.syntaxtype.number' |
  'source.lang.swift.syntaxtype.parameter';
