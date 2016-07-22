'use babel';
/* @flow */

import type {SourceKittenDeclKind} from './Decl';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * `sourcekitten complete` returns an array of these structs as JSON.
 */
export type SourceKittenCompletion = {
  name: string,
  descriptionKey: string,
  sourcetext: string,
  kind: SourceKittenDeclKind,
  typeName: string,
  moduleName: string,
  associatedUSRs: string,
  context: string,
  docBrief: string,
};

/**
 * Transforms a `sourcekitten complete` struct into a suggestion that can be
 * consumed by Atom's autocomplete suggestion API.
 */
export default function sourceKittenCompletionToAtomSuggestion(
  completion: SourceKittenCompletion,
): atom$AutocompleteSuggestion {
  return {
    text: completion.descriptionKey,
    snippet: sourceKittenSourcetextToAtomSnippet(completion.sourcetext),
    type: sourceKittenKindToAtomType(completion.kind),
    leftLabel: completion.typeName,
    rightLabel: sourceKittenKindToAtomRightLabel(completion.kind),
    description: completion.docBrief,
  };
}

/**
 * Transforms SourceKitten sourcetext into a snippet that Atom can consume.
 * SourceKitten sourcetext looks something like this:
 *
 *   foobar(<#T##x: Int##Int#>, y: <#T##String#>, baz: <#T##[String]#>)
 *
 * Here, <#T##...#> represents the snippet location to highlight when the tab
 * key is pressed. I don't know why the first snippet in the above example is
 * "x: Int##Int" -- it seems to me it should be simply "x: Int" -- but we must
 * handle this case as well. This function transforms this into the format
 * Atom expects:
 *
 *   foobar(${1:x: Int}, y: ${2:String}, baz: ${3:[String]})
 */
export function sourceKittenSourcetextToAtomSnippet(
  sourcetext: string,
): string {
  // Atom expects numbered snippet location, beginning with 1.
  let index = 1;
  // Match on each instance of <#T##...#>, capturing the text in between.
  // We then specify replacement text via a function.
  const replacedParameters = sourcetext.replace(/<#T##(.+?)#>/g, (_, groupOne) => {
    // The index is incremented after each match. We split the match group
    // on ##, to handle the strange case mentioned in this function's docblock.
    return `\${${index++}:${groupOne.split('##')[0]}}`;
  });

  // When overriding instance methods, SourceKitten uses the string <#code#>
  // as a marker for the body of the method. Replace this with an empty Atom
  // snippet location.
  return replacedParameters.replace('<#code#>', `\${${index++}}`);
}

export function sourceKittenKindToAtomType(
  kind: SourceKittenDeclKind,
): AtomSnippetType {
  // FIXME: Some of the kinds don't have predefined Atom styles that suit them.
  //        These should use custom HTML.
  switch (kind) {
    case 'source.lang.swift.keyword':
      return 'keyword';
    case 'source.lang.swift.decl.associatedtype':
      return 'type';
    case 'source.lang.swift.decl.class':
      return 'class';
    case 'source.lang.swift.decl.enum':
      return 'class';
    case 'source.lang.swift.decl.enumelement':
      return 'property';
    case 'source.lang.swift.decl.extension.class':
      return 'class';
    case 'source.lang.swift.decl.function.accessor.getter':
      return 'method';
    case 'source.lang.swift.decl.function.accessor.setter':
      return 'method';
    case 'source.lang.swift.decl.function.constructor':
      return 'method';
    case 'source.lang.swift.decl.function.free':
      return 'function';
    case 'source.lang.swift.decl.function.method.class':
      return 'method';
    case 'source.lang.swift.decl.function.method.instance':
      return 'method';
    case 'source.lang.swift.decl.function.method.static':
      return 'method';
    case 'source.lang.swift.decl.function.operator.infix':
      return 'function';
    case 'source.lang.swift.decl.function.subscript':
      return 'method';
    case 'source.lang.swift.decl.generic_type_param':
      return 'variable';
    case 'source.lang.swift.decl.protocol':
      return 'type';
    case 'source.lang.swift.decl.struct':
      return 'class';
    case 'source.lang.swift.decl.typealias':
      return 'type';
    case 'source.lang.swift.decl.var.global':
      return 'variable';
    case 'source.lang.swift.decl.var.instance':
      return 'variable';
    case 'source.lang.swift.decl.var.local':
      return 'variable';
    case 'source.lang.swift.ref.associatedtype':
      return 'type';
    case 'source.lang.swift.ref.class':
      return 'class';
    case 'source.lang.swift.ref.enum':
      return 'class';
    case 'source.lang.swift.ref.enumelement':
      return 'property';
    case 'source.lang.swift.ref.function.constructor':
      return 'method';
    case 'source.lang.swift.ref.function.free':
      return 'function';
    case 'source.lang.swift.ref.function.method.class':
      return 'method';
    case 'source.lang.swift.ref.function.method.instance':
      return 'method';
    case 'source.lang.swift.ref.function.operator.infix':
      return 'function';
    case 'source.lang.swift.ref.function.subscript':
      return 'method';
    case 'source.lang.swift.ref.generic_type_param':
      return 'type';
    case 'source.lang.swift.ref.protocol':
      return 'type';
    case 'source.lang.swift.ref.struct':
      return 'class';
    case 'source.lang.swift.ref.typealias':
      return 'type';
    case 'source.lang.swift.ref.var.global':
      return 'variable';
    case 'source.lang.swift.ref.var.instance':
      return 'variable';
    case 'source.lang.swift.ref.var.local':
      return 'variable';
    case 'source.lang.swift.syntaxtype.argument':
      return 'variable';
    case 'source.lang.swift.syntaxtype.attribute.builtin':
      return 'type';
    case 'source.lang.swift.syntaxtype.comment':
      return 'snippet';
    case 'source.lang.swift.syntaxtype.identifier':
      return 'type';
    case 'source.lang.swift.syntaxtype.keyword':
      return 'keyword';
    case 'source.lang.swift.syntaxtype.number':
      return 'constant';
    case 'source.lang.swift.syntaxtype.parameter':
      return 'variable';
  }

  return 'variable';
}

export function sourceKittenKindToAtomRightLabel(
  kind: SourceKittenDeclKind,
): string {
  switch (kind) {
    case 'source.lang.swift.keyword':
      return 'Keyword';
    case 'source.lang.swift.decl.associatedtype':
      return 'Associated type';
    case 'source.lang.swift.decl.class':
      return 'Class';
    case 'source.lang.swift.decl.enum':
      return 'Enum';
    case 'source.lang.swift.decl.enumelement':
      return 'Enum element';
    case 'source.lang.swift.decl.extension.class':
      return 'Class extension';
    case 'source.lang.swift.decl.function.accessor.getter':
      return 'Getter';
    case 'source.lang.swift.decl.function.accessor.setter':
      return 'Setter';
    case 'source.lang.swift.decl.function.constructor':
      return 'Constructor';
    case 'source.lang.swift.decl.function.free':
      return 'Free function';
    case 'source.lang.swift.decl.function.method.class':
      return 'Class method';
    case 'source.lang.swift.decl.function.method.instance':
      return 'Instance method';
    case 'source.lang.swift.decl.function.method.static':
      return 'Static method';
    case 'source.lang.swift.decl.function.operator.infix':
      return 'Infix operator';
    case 'source.lang.swift.decl.function.subscript':
      return 'Subscript';
    case 'source.lang.swift.decl.generic_type_param':
      return 'Generic type parameter';
    case 'source.lang.swift.decl.protocol':
      return 'Protocol';
    case 'source.lang.swift.decl.struct':
      return 'Struct';
    case 'source.lang.swift.decl.typealias':
      return 'Typealias';
    case 'source.lang.swift.decl.var.global':
      return 'Global variable';
    case 'source.lang.swift.decl.var.instance':
      return 'Instance variable';
    case 'source.lang.swift.decl.var.local':
      return 'Local variable';
    case 'source.lang.swift.ref.associatedtype':
      return 'Associated type reference';
    case 'source.lang.swift.ref.class':
      return 'Class reference';
    case 'source.lang.swift.ref.enum':
      return 'Enum reference';
    case 'source.lang.swift.ref.enumelement':
      return 'Enum element reference';
    case 'source.lang.swift.ref.function.constructor':
      return 'Constructor reference';
    case 'source.lang.swift.ref.function.free':
      return 'Free function reference';
    case 'source.lang.swift.ref.function.method.class':
      return 'Class method reference';
    case 'source.lang.swift.ref.function.method.instance':
      return 'Instance method reference';
    case 'source.lang.swift.ref.function.operator.infix':
      return 'Infix operator reference';
    case 'source.lang.swift.ref.function.subscript':
      return 'Subscript reference';
    case 'source.lang.swift.ref.generic_type_param':
      return 'Generic type parameter';
    case 'source.lang.swift.ref.protocol':
      return 'Protocol reference';
    case 'source.lang.swift.ref.struct':
      return 'Struct reference';
    case 'source.lang.swift.ref.typealias':
      return 'Typealias reference';
    case 'source.lang.swift.ref.var.global':
      return 'Global variable reference';
    case 'source.lang.swift.ref.var.instance':
      return 'Instance variable reference';
    case 'source.lang.swift.ref.var.local':
      return 'Local variable reference';
    case 'source.lang.swift.syntaxtype.argument':
      return 'Argument';
    case 'source.lang.swift.syntaxtype.attribute.builtin':
      return 'Builtin';
    case 'source.lang.swift.syntaxtype.comment':
      return 'Comment';
    case 'source.lang.swift.syntaxtype.identifier':
      return 'Identifier';
    case 'source.lang.swift.syntaxtype.keyword':
      return 'Keyword';
    case 'source.lang.swift.syntaxtype.number':
      return 'Number';
    case 'source.lang.swift.syntaxtype.parameter':
      return 'Parameter';
  }

  return '';
}

/**
 * Atom's autocomplete suggestions can display an icon matching one of these
 * set of types (which are very limited when compared to the range of decl
 * types in Swift).
 */
type AtomSnippetType =
  'variable' |
  'constant' |
  'property' |
  'value' |
  'method' |
  'function' |
  'class' |
  'type' |
  'keyword' |
  'tag' |
  'snippet' |
  'import' |
  'require';
