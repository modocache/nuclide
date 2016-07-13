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
import ChdirInput from './ChdirInput';
import ConfigurationDropdown from './ConfigurationDropdown';
import FlagsDropdownInput from './FlagsDropdownInput';
import BuildPathInput from './BuildPathInput';
import TestBuildPathInput from './TestBuildPathInput';
import {SwiftPMBuildSystemBuildTask, SwiftPMBuildSystemTestTask} from '../SwiftPMBuildSystemTasks';

export default class SwiftPMBuildSystemToolbar extends React.Component {
  constructor(props: mixed) {
    super(props);
    (this: any)._handleChdirChange = this._handleChdirChange.bind(this);
    (this: any)._handleConfigurationChange = this._handleConfigurationChange.bind(this);
    (this: any)._handleBuildPathChange = this._handleBuildPathChange.bind(this);
    (this: any)._handleFlagChange = this._handleFlagChange.bind(this);
    (this: any)._handleXccChange = this._handleXccChange.bind(this);
    (this: any)._handleXlinkerChange = this._handleXlinkerChange.bind(this);
    (this: any)._handleXswiftcChange = this._handleXswiftcChange.bind(this);
    (this: any)._handleTestBuildPathChange = this._handleTestBuildPathChange.bind(this);
  }

  render(): React.Element<any> {
    if (this.props.activeTaskType === SwiftPMBuildSystemBuildTask.type) {
      return (
        <div>
          <ChdirInput
            chdir={this.props.store.getChdir()}
            disabled={false}
            onChdirChange={this._handleChdirChange}
          />
          <ConfigurationDropdown
            configuration={this.props.store.getConfiguration()}
            disabled={false}
            onConfigurationChange={this._handleConfigurationChange}
          />
          <FlagsDropdownInput
            flag={this.props.store.getFlag()}
            Xcc={this.props.store.getXcc()}
            Xlinker={this.props.store.getXlinker()}
            Xswiftc={this.props.store.getXswiftc()}
            disabled={false}
            onFlagChange={this._handleFlagChange}
            onXccChange={this._handleXccChange}
            onXlinkerChange={this._handleXlinkerChange}
            onXswiftcChange={this._handleXswiftcChange}
          />
          <BuildPathInput
            buildPath={this.props.store.getBuildPath()}
            disabled={false}
            onBuildPathChange={this._handleBuildPathChange}
          />
        </div>
      );
    } else {
      return (
        <div>
          <ChdirInput
            chdir={this.props.store.getChdir()}
            disabled={false}
            onChdirChange={this._handleChdirChange}
          />
          <TestBuildPathInput
            testBuildPath={this.props.store.getTestBuildPath()}
            disabled={false}
            onTestBuildPathChange={this._handleTestBuildPathChange}
          />
        </div>
      );
    }
  }

  _handleChdirChange(value: string) {
    this.props.actions.updateChdir(value);
  }

  _handleConfigurationChange(value: string) {
    this.props.actions.updateConfiguration(value);
  }

  _handleBuildPathChange(value: string) {
    this.props.actions.updateBuildPath(value);
  }

  _handleFlagChange(value: string) {
    this.props.actions.updateFlag(value);
  }

  _handleXccChange(value: string) {
    this.props.actions.updateXcc(value);
  }

  _handleXlinkerChange(value: string) {
    this.props.actions.updateXlinker(value);
  }

  _handleXswiftcChange(value: string) {
    this.props.actions.updateXswiftc(value);
  }

  _handleTestBuildPathChange(value: string) {
    this.props.actions.updateTestBuildPath(value);
  }
}
