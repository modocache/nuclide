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

export default function sourceKittenCompletionToAtomSuggestion(
  completion: SourceKittenCompletion,
): atom$AutocompleteSuggestion {
  return {
    text: completion.descriptionKey,
    snippet: sourceKittenSourcetextToAtomSnippet(completion.sourcetext),
    type: sourceKittenKindToAtomType(completion.kind),
    // FIXME: Prefix the type name with the module? So, for example,
    //        we could display `Swift.StaticString`, or `MyModule.MyClass`.
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
 *
 * FIXME: Doesn't work well with sourcetext for instance methods, which
 *        includes a snippet to tab to the body of the method.
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
  // FIXME: Insert an amount of whitespace, appropriate for the current
  //        indentation level, prior to the snippet location.
  return replacedParameters.replace('<#code#>', `\${${index++}}`);
}

export function sourceKittenKindToAtomType(kind: string): string {
  // FIXME: Make this list comprehensive.
  // FIXME: Some of the kinds don't have predefined Atom styles to match. These
  //        should use custom HTML.
  switch (kind) {
    case 'source.lang.swift.keyword':
      return 'keyword';
    case 'source.lang.swift.decl.function.free':
      return 'function';
    case 'source.lang.swift.decl.function.method.instance':
      return 'method';
    case 'source.lang.swift.decl.generic_type_param':
    case 'source.lang.swift.decl.typealias':
    case 'source.lang.swift.decl.protocol':
      return 'type';
    case 'source.lang.swift.decl.var.global':
    case 'source.lang.swift.decl.var.local':
      return 'variable';
    case 'source.lang.swift.decl.var.instance':
      return 'property';
    case 'source.lang.swift.decl.class':
    case 'source.lang.swift.decl.struct':
      return 'class';
    case 'source.lang.swift.decl.module':
      return 'import';
  }
  return '';
}

export function sourceKittenKindToAtomRightLabel(kind: string): string {
  // FIXME: Make this list comprehensive.
  switch (kind) {
    case 'source.lang.swift.keyword':
      return 'Keyword';
    case 'source.lang.swift.decl.function.free':
      return 'Function';
    case 'source.lang.swift.decl.function.method.instance':
      return 'Instance method';
    case 'source.lang.swift.decl.generic_type_param':
      return 'Generic type parameter';
    case 'source.lang.swift.decl.typealias':
      return 'Typealias';
    case 'source.lang.swift.decl.var.global':
      return 'Global variable';
    case 'source.lang.swift.decl.var.local':
      return 'Local variable';
    case 'source.lang.swift.decl.var.instance':
      return 'Instance variable';
    case 'source.lang.swift.decl.protocol':
      return 'Protocol';
    case 'source.lang.swift.decl.class':
      return 'Class';
    case 'source.lang.swift.decl.struct':
      return 'Struct';
    case 'source.lang.swift.decl.module':
      return 'Module';
  }
  return '';
}
