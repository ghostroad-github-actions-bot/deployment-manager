/*
 * Copyright 2022 Ghost Road Studio
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as core from '@actions/core';
import { exec, ExecOptions } from '@actions/exec';
import { deploymentmanager_v2beta as deploymentmanager } from 'googleapis';
import { getToolCommand } from '@google-github-actions/setup-cloud-sdk';
import yaml = require('js-yaml');
import _ = require('lodash');
import { BaseAction } from './base-action';

export class DeployAction extends BaseAction {
  private static toolCommand: string = getToolCommand();
  private cmd: string[];

  private deployment: deploymentmanager.Schema$Deployment | undefined =
    undefined;

  private static list: string[] = [
    'deployment-manager',
    'deployments',
    'list',
    '--format',
    'yaml',
  ];

  constructor(
    private config: string = core.getInput('config'),
    private labels: string = core.getInput('labels'),
    private name: string = core.getInput('deployment'),
    private properties: string = core.getInput('properties'),
  ) {
    super();
    const template: string = core.getInput('template');

    if (template && config)
      throw new Error('Both `template` and `config` specified.');

    this.cmd = [
      'deployment-manager',
      'deployments',
      'create',
      this.name,
      template ? `--template=${template}` : `--config=${config}`,
    ];
  }

  run = async (): Promise<void> => {
    await this.init();
    // #region command options
    let output = '',
      err = '';
    const stdout = (data: Buffer): void => {
      output += data.toString();
    };
    const stderr = (data: Buffer): void => {
      err += data.toString();
    };
    const options: ExecOptions = {
      listeners: {
        stderr,
        stdout,
      },
      silent: true,
    };
    // #endregion

    // #region Update if deployment exists.
    await exec(DeployAction.toolCommand, DeployAction.list, options).then(
      () => {
        const isUpdate = this.isUpdate(output);
        if (isUpdate) {
          core.info(`Updating deployment ${this.name}`);
          this.cmd[2] = 'update';
          this.cmd.pop();
        }

        if (this.properties) {
          if (this.config)
            throw new Error('Cannot use properties with config.');
          this.cmd.push('--properties', this.properties);
        }

        if (this.labels) {
          const flag = isUpdate ? '--update-labels' : '--labels';
          this.cmd.push(flag, this.labels);
        }
      },
    );
    // #endregion

    try {
      await exec(DeployAction.toolCommand, this.cmd, options);
    } catch (e: any) {
      if (err) throw new Error(err);
      else throw new Error(convert(e));
    }
  };

  private isUpdate = (output: string): boolean => {
    const deployments = yaml.loadAll(
      output,
    ) as deploymentmanager.Schema$Deployment[];
    this.deployment = deployments.find((x) => _.isEqual(this.name, x.name));
    return this.deployment != undefined;
  };
}

export const convert = (unknown: any): string =>
  unknown instanceof Error ? unknown.message : (unknown as string);
