'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import featureConfig from '../../../nuclide-feature-config';
import SwiftPMBuildSystemStore from './SwiftPMBuildSystemStore';

export function buildCommand(
  chdir: string,
  configuration: string,
  Xcc: string,
  Xlinker: string,
  Xswiftc: string,
  buildPath: string,
): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'build',
    '--chdir', chdir || atom.project.getPaths()[0],
    '--configuration', configuration,
  ];
  if (Xcc.length > 0) {
    commandArgs.push('-Xcc', Xcc);
  }
  if (Xlinker.length > 0) {
    commandArgs.push('-Xlinker', Xlinker);
  }
  if (Xswiftc.length > 0) {
    commandArgs.push('-Xswiftc', Xswiftc);
  }
  if (buildPath.length > 0) {
    commandArgs.push('--build-path', buildPath);
  }
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function testCommand(
  chdir: string,
  buildPath: string,
): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'test',
    '--chdir', chdir || atom.project.getPaths()[0],
  ];
  if (buildPath.length > 0) {
    commandArgs.push('--build-path', buildPath);
  }
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function createNewPackageCommand(store: SwiftPMBuildSystemStore): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'package',
    'init',
    '--chdir', store.getChdir(),
  ];
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function fetchPackageDependenciesCommand(store: SwiftPMBuildSystemStore): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'package',
    'fetch',
    '--chdir', store.getChdir(),
  ];
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function updatePackageDependenciesCommand(store: SwiftPMBuildSystemStore): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'package',
    'update',
    '--chdir', store.getChdir(),
  ];
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function generateXcodeProjectCommand(store: SwiftPMBuildSystemStore): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'package',
    'generate-xcodeproj',
    '--chdir', store.getChdir(),
  ];
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function visualizePackageDependenciesCommand(store: SwiftPMBuildSystemStore): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'package',
    'show-dependencies',
    '--chdir', store.getChdir(),
  ];
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

export function displayBufferDescriptionCommand(store: SwiftPMBuildSystemStore): {
  command: string;
  args: Array<string>
} {
  const commandArgs = [
    'package',
    'dump-package',
    '--chdir', store.getChdir(),
  ];
  return {
    command: _swiftPath(),
    args: commandArgs,
  };
}

function _swiftPath(): string {
  const path = (featureConfig.get('nuclide-swift.swiftToolchainPath'): any);
  if (path) {
    return `${path}/usr/bin/swift`;
  }

  if (process.platform === 'darwin') {
    return '/Library/Developer/Toolchains/swift-latest.xctoolchain/usr/bin/swift';
  }

  return 'swift';
}
