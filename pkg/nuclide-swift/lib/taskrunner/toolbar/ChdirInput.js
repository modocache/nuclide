'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {React} from 'react-for-atom';
import {AtomInput} from '../../../../nuclide-ui/lib/AtomInput';

export default class ChdirInput extends React.Component {
  static propTypes = {
    chdir: React.PropTypes.string.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    onChdirChange: React.PropTypes.func.isRequired,
  };

  state: {
    value: string,
  };

  constructor(props: Object) {
    super(props);
    this.state = {
      value: this.props.chdir,
    };
    (this: any)._onDidChange = this._onDidChange.bind(this);
  }

  render(): React.Element<any> {
    return (
      <AtomInput
        className="inline-block"
        ref="chdir"
        size="sm"
        disabled={this.props.disabled}
        initialValue={this.state.value}
        onDidChange={this._onDidChange}
        placeholderText="Path to Swift package"
        width={150}
      />
    );
  }

  _onDidChange(value: string) {
    this.props.onChdirChange(value);
    this.setState({value});
  }
}
