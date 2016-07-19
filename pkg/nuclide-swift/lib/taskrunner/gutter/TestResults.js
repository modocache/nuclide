'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

export function addTestResultGutterIcon(
  editor: TextEditor,
  line: number,
  className: string,
): void {
  const gutter = editor.gutterWithName('nuclide-swift-test-result');
  if (!gutter) {
    return;
  }
  gutter.show();

  const marker = editor.markBufferPosition([line, 0], {
    persistent: false,
    invalidate: 'touch',
  });
  const elem = document.createElement('a');
  elem.className = className;
  gutter.decorateMarker(marker, {item: elem});
}

export function highlightLine(editor: TextEditor, line: number): void {
  const marker = editor.markBufferRange(
    [[line, 0], [line, Infinity]],
    {persistent: false, invalidate: 'never'});
  editor.decorateMarker(marker, {
    type: 'line',
    class: 'nuclide-swift-test-failed-line-highlight',
  });
}
