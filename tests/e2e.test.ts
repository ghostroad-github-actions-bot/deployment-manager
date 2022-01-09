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

import * as exec from '@actions/exec';
import _ from 'lodash';
import { expect } from 'chai';
import { deploymentmanager_v2beta as deploymentmanager } from 'googleapis';
import yaml = require('js-yaml');

describe('E2E Tests', function() {
  const {
    LABELS
  } = process.env;

  let NAME: string;
  let deployment: deploymentmanager.Schema$Deployment | null;
  let toolCommand: string = 'gcloud';
  before(async function() {
    if (process.env.DEPLOYMENT) {
      NAME = process.env.DEPLOYMENT;
    } else {
      throw Error('No deployment specified.');
    }
    
    let output: string = '';
    const stdout = (data: Buffer): void => { 
      output += data.toString(); 
    };
    const options = {
      listeners: {
        stdout,
      },
      silent: true,
    };
    const list: string[] = [
      'deployment-manager',
      'deployments',
      'list',
      '--format',
      'yaml'
    ];
    
    await exec.exec(toolCommand, list, options);
    const response = yaml.loadAll(output) as deploymentmanager.Schema$Deployment[];
    if (response) {
      deployment = response.find(x =>
        _.isEqual(NAME, x.name),
      ) ?? null;
    } else {
      throw Error('No deployments found')
    }
  });

  it('has the correct labels', function() {
    if (LABELS && deployment) {
      if (!deployment.labels) {
        throw Error(`Deployment ${deployment.name} contains no labels`);
      }
      const actual = deployment.labels as deploymentmanager.Schema$DeploymentLabelEntry[];
      let expected: deploymentmanager.Schema$DeploymentLabelEntry[] = [];
      parseFlags(LABELS).map(x => x.split('=')).forEach(x => {
        expected.push({
          key: x[0],
          value: x[1]
        } as deploymentmanager.Schema$DeploymentLabelEntry);
      });
      
      Object.entries(expected).forEach((label: object) => {
        const found = Object.entries(actual).find((actualLabel: object) => 
          _.isEqual(label, actualLabel),
        );
        expect(found).to.not.equal(undefined);
      });
    }
  });
})

const parseFlags = (flags: string): RegExpMatchArray =>
  flags.match(/(".*?"|[^",]+)+(?=\s*|\s*$)/g)!; // Split on space or "=" if not in quotes)
