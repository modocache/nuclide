'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {
  FileDiagnosticMessage,
} from '../../nuclide-diagnostics-base';

import {goToLocation} from '../../commons-atom/go-to-location';
import {React} from 'react-for-atom';
import {DiagnosticsMessage} from '../../nuclide-ui/lib/DiagnosticsMessage';

type DiagnosticsDatatipComponentProps = {
  message: FileDiagnosticMessage,
};

const NOOP = () => {};

export class DiagnosticsDatatipComponent extends React.Component {
  props: DiagnosticsDatatipComponentProps;

  render(): React.Element<any> {
    // Remove the `fix` property to prevent the fix button from showing up (for now).
    const message = {...this.props.message, fix: undefined};
    return (
      <div className="nuclide-diagnostics-datatip">
        <DiagnosticsMessage
          message={message}
          goToLocation={goToLocation}
          fixer={NOOP}
        />
      </div>
    );
  }
}

export function makeDiagnosticsDatatipComponent(message: FileDiagnosticMessage): ReactClass<any> {
  return () => <DiagnosticsDatatipComponent message={message} />;
}
