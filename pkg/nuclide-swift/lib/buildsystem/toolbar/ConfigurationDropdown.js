'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {Dropdown} from '../../../../nuclide-ui/lib/Dropdown';
import {React} from 'react-for-atom';

export default class ConfigurationDropdown extends React.Component {
  static propTypes = {
    configuration: React.PropTypes.string.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    onConfigurationChange: React.PropTypes.func.isRequired,
  };

  state: {
    options: Array<{label: string; value: string}>;
    value: string;
  };

  constructor(props: Object) {
    super(props);
    this.state = {
      options: [
        {label: 'Debug', value: 'debug'},
        {label: 'Release', value: 'release'},
      ],
      value: this.props.configuration,
    };
    (this: any)._onChange = this._onChange.bind(this);
  }

  render(): React.Element<any> {
    return (
      <Dropdown
        className="inline-block"
        disabled={this.props.disabled}
        value={this.state.value}
        options={this.state.options}
        onChange={this._onChange}
        size="sm"
        title="Choose build configuration"
      />
    );
  }

  _onChange(value: string) {
    this.props.onConfigurationChange(value);
    this.setState({value});
  }
}
