'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {AtomInput} from '../../../../nuclide-ui/lib/AtomInput';
import {Dropdown} from '../../../../nuclide-ui/lib/Dropdown';
import {React} from 'react-for-atom';

export default class FlagsDropdownInput extends React.Component {
  static propTypes = {
    flag: React.PropTypes.string.isRequired,
    Xcc: React.PropTypes.string.isRequired,
    Xlinker: React.PropTypes.string.isRequired,
    Xswiftc: React.PropTypes.string.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    onFlagChange: React.PropTypes.func.isRequired,
    onXccChange: React.PropTypes.func.isRequired,
    onXlinkerChange: React.PropTypes.func.isRequired,
    onXswiftcChange: React.PropTypes.func.isRequired,
  };

  state: {
    flags: Array<{label: string; value: string}>;
    flag: string;
    Xcc: string;
    Xlinker: string;
    Xswiftc: string;
  };

  constructor(props: Object) {
    super(props);
    this.state = {
      flags: [
        {label: 'Xcc', value: 'xcc'},
        {label: 'Xlinker', value: 'xlinker'},
        {label: 'Xswiftc', value: 'xswiftc'},
      ],
      flag: this.props.flag,
      Xcc: this.props.Xcc,
      Xlinker: this.props.Xlinker,
      Xswiftc: this.props.Xswiftc,
    };
    (this: any)._onFlagChange = this._onFlagChange.bind(this);
    (this: any)._onXccDidChange = this._onXccDidChange.bind(this);
    (this: any)._onXlinkerDidChange = this._onXlinkerDidChange.bind(this);
    (this: any)._onXswiftcDidChange = this._onXswiftcDidChange.bind(this);
  }

  render(): React.Element<any> {
    // FIXME: The AtomInput next to the dropdown should be different depending
    //        on the value of the dropdown. I don't know how to make this so.
    //        As a resut, even if the current flag is for Xlinker, the
    //        placeholder text for the input shows "C compiler flags", which
    //        means the wrong input is being displayed.
    if (this.state.flag === 'xcc') {
      return (
        <div className="inline-block">
          <Dropdown
            className="inline-block"
            disabled={this.props.disabled}
            value={this.state.flag}
            options={this.state.flags}
            onChange={this._onFlagChange}
            size="sm"
            title="Choose build configuration"
          />
          <AtomInput
            className="inline-block"
            ref="Xcc"
            size="sm"
            disabled={this.props.disabled}
            initialValue={this.state.Xcc}
            onDidChange={this._onXccDidChange}
            placeholderText="C flags"
            width={150}
          />
        </div>
      );
    } else if (this.state.flag === 'xlinker') {
      return (
        <div className="inline-block">
          <Dropdown
            className="inline-block"
            disabled={this.props.disabled}
            value={this.state.flag}
            options={this.state.flags}
            onChange={this._onFlagChange}
            size="sm"
            title="Choose build configuration"
          />
          <AtomInput
            className="inline-block"
            ref="Xlinker"
            size="sm"
            disabled={this.props.disabled}
            initialValue={this.state.Xlinker}
            onDidChange={this._onXlinkerDidChange}
            placeholderText="Linker flags"
            width={150}
          />
        </div>
      );
    } else if (this.state.flag === 'xswiftc') {
      return (
        <div className="inline-block">
          <Dropdown
            className="inline-block"
            disabled={this.props.disabled}
            value={this.state.flag}
            options={this.state.flags}
            onChange={this._onFlagChange}
            size="sm"
            title="Choose build configuration"
          />
          <AtomInput
            className="inline-block"
            ref="Xswiftc"
            size="sm"
            disabled={this.props.disabled}
            initialValue={this.state.Xswiftc}
            onDidChange={this._onXswiftcDidChange}
            placeholderText="Swift flags"
            width={150}
          />
        </div>
      );
    } else {
      throw new Error(`Unknown flag type: ${this.state.flag}`);
    }
  }

  _onFlagChange(value: string) {
    this.props.onFlagChange(value);
    this.setState({flag: value});
  }

  _onXccDidChange(value: string) {
    this.props.onXccChange(value);
    this.setState({Xcc: value});
  }

  _onXlinkerDidChange(value: string) {
    this.props.onXlinkerChange(value);
    this.setState({Xlinker: value});
  }

  _onXswiftcDidChange(value: string) {
    this.props.onXswiftcChange(value);
    this.setState({Xswiftc: value});
  }
}
