'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import yaml from 'js-yaml';
import nuclideUri from '../../../nuclide-remote-uri';
import fsPromise from '../../../commons-node/fsPromise';

/**
 * Reads an llbuild YAML file and returns a mapping, with source files as keys,
 * and the Swift compiler arguments used to compile those files as values.
 * If an error occurs when reading the file or parsing its YAML, return an
 * empty mapping.
 */
export async function readCompileCommands(
  path: string,
): Promise<Map<string, string>> {
  // Read the YAML file into memory.
  let data;
  try {
    data = await fsPromise.readFile(path, 'utf8');
  } catch (e) {
    return new Map();
  }

  // Attempt to parse the YAML, or bail if a parsing error occurs.
  let llbuildYaml;
  try {
    llbuildYaml = yaml.safeLoad(data);
  } catch (e) {
    return new Map();
  }

  const compileCommands = new Map();
  for (const llbuildCommandKey in llbuildYaml.commands) {
    const llbuildCommand = llbuildYaml.commands[llbuildCommandKey];
    // Not all commands contain source files -- some just link a bunch of
    // prebuilt object files, for example. If there are no source files to
    // gather compile commands for, skip this llbuild command.
    if (!llbuildCommand.sources) {
      continue;
    }

    // If we find source files, map each to a string used to compile it.
    // This string is composed of the compiler arguments ("other-args"),
    // plus all of the Swift source files that need to be compiled together.
    for (let i = 0; i < llbuildCommand.sources.length; i++) {
      const otherArgs = llbuildCommand['other-args'] ? llbuildCommand['other-args'] : [];
      compileCommands.set(
        llbuildCommand.sources[i],
        otherArgs.concat(llbuildCommand.sources).join(' '),
      );
    }
  }

  return compileCommands;
}

/**
 * SwiftPM generates YAML, which is then consumed by llbuild. However, it
 * can generate that YAML at one of several paths:
 *
 *   - If the build configuration is 'debug', it generates a 'debug.yaml'.
 *   - If the build configuration is 'release', it generates a 'release.yaml'.
 *   - If no --build-path is specified, it generates
 *     '.build/{debug|release}.yaml'.
 *   - If a --build-path is specified, it generates
 *     '/path/to/build/path/{debug|release.yaml}'.
 *
 * This function returns the path to YAML file that will be generated if a
 * build task is begun with the current store's settings.
 */
export function llbuildYamlPath(
  chdir: string,
  configuration: string,
  buildPath: string,
): string {
  const yamlFileName = `${configuration}.yaml`;
  if (buildPath.length > 0) {
    return nuclideUri.join(buildPath, yamlFileName);
  } else {
    return nuclideUri.join(chdir, '.build', yamlFileName);
  }
}
