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

import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as core from '@actions/core';
import { DeployAction } from '../../src/entities/deploy-action';

const fakeInputs: { [key: string]: string } = {
  config: 'test.yml',
  template: 'test.jinja',
  properties: 'name:testing',
};

let getInputMock = (name: string): string => fakeInputs[name];

describe('#deploy-action', () => {
  async function run(this: Mocha.Context): Promise<void> {
    try {
      const deploy = new DeployAction();
      await deploy.run();
    } catch (e: any) {
      this.stubs.getInput.withArgs('setFailed').returns(e);
    }
  }

  beforeEach(async function() {
    this.stubs = {
      getInput: sinon.stub(core, 'getInput').callsFake(getInputMock),
      setFailed: sinon.stub(core, 'setFailed'),
    };
  });

  afterEach( function() {
    Object.keys(this.stubs).forEach((key) => this.stubs[key].restore());
  });

  it('fails if template and config are specified', async function() {
    await run.call(this);
    expect(Error);
  });

  it('fails if properties are passed with config', async function() {
    this.stubs.getInput.withArgs('template').returns('');
    await run.call(this);
    expect(Error);
  });
});