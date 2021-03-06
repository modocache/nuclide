'use strict';
/* @noflow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/* NON-TRANSPILED FILE */
/* eslint-disable babel/func-params-comma-dangle, prefer-object-spread/prefer-object-spread */

/**
 * This rule forbids the import of a native 'path' module.
 *
 * Why:
 *   Path module is platform dependent and does not support Nuclide's remote URIs
 *   Using it leads to all kinds of path related errors on Windows.
 *   nuclideUri, on the other hand can handle both platform dependent local paths and remote
 *   URIs correctly.
 */

module.exports = function(context) {
  return {
    ImportDeclaration(node) {
      if (node.source.value === 'path' &&
        node.importKind !== 'type' &&
        node.importKind !== 'typeof'
      ) {
        context.report({
          node,
          message: 'path module is not to be used. Use nuclide-remote-uri instead',
        });
      }
    },
  };
};
