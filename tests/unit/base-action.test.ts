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
import * as setupGcloud from '@google-github-actions/setup-cloud-sdk';
import { BaseAction } from '../../src/entities/base-action';

class Base extends BaseAction {
  async run(): Promise<void> {
    await this.init();
  }
}

const fakeInputs: { [key: string]: string } = {
  gcloud_version: 'latest',
  project_id: 'test-project',
  credentials: 'creds',
}

let getInputMock = (name: string): string => fakeInputs[name];

describe('#base-action', () => {
  async function run(this: Mocha.Context): Promise<void> {
    try {
      const base = new Base();
      await base.run();
    } catch (e: any) {
      this.stubs.getInput.withArgs('setFailed').returns(e);
    }
  }

  beforeEach(async function() {
    this.stubs = {
      getInput: sinon.stub(core, 'getInput').callsFake(getInputMock),
      setFailed: sinon.stub(core, 'setFailed'),
      installGcloudSDK: sinon.stub(setupGcloud, 'installGcloudSDK'),
      authenticateGcloudSDK: sinon.stub(setupGcloud, 'authenticateGcloudSDK'),
      getLatestGcloudSDKVersion: sinon.stub(setupGcloud, 'getLatestGcloudSDKVersion').resolves('367.0.0'),
      isAuthenticated: sinon.stub(setupGcloud, 'isAuthenticated').resolves(true),
      isInstalled: sinon.stub(setupGcloud, 'isInstalled').resolves(true),
      setProject: sinon.stub(setupGcloud, 'setProject'),
      setProjectWithKey: sinon.stub(setupGcloud, 'setProjectWithKey'),
      isProjectIdSet: sinon.stub(setupGcloud, 'isProjectIdSet').resolves(true),
    };
  });

  afterEach(function() {
    Object.keys(this.stubs).forEach((key) => this.stubs[key].restore());
  });

  it('installs gcloud SDK if not already installed', async function() {
    this.stubs.isInstalled.returns(false);
    await run.call(this);
    expect(this.stubs.installGcloudSDK.callCount).to.eq(1);
  });

  it('uses cached gcloud SDK if already installed', async function() {
    await run.call(this);
    expect(this.stubs.installGcloudSDK.callCount).to.eq(0);
  });

  it('uses specified gcloud SDK version, if provided', async function() {
    this.stubs.getInput.withArgs('gcloud_version').returns('3.11.0');
    this.stubs.isInstalled.returns(false);
    await run.call(this);
    expect(this.stubs.installGcloudSDK.withArgs('3.11.0').callCount).to.eq(1);
  });

  it('sets the project id if project_id is provided', async function() {
    await run.call(this);
    expect(this.stubs.setProject.withArgs('test-project').callCount).to.eq(1);
  });
  
  it('sets the project id using credentials', async function() {
    this.stubs.getInput.withArgs('project_id').returns('');
    await run.call(this);
    expect(this.stubs.setProjectWithKey.withArgs('creds').callCount).to.eq(1);
  });

  it('authenticates if credentials are provided', async function() {
    await run.call(this);
    expect(this.stubs.authenticateGcloudSDK.withArgs('creds').callCount).to.eq(1);
  });

  it('sets the project id if GCLOUD_PROJECT is provided', async function() {
    this.stubs.getInput.withArgs('credentials').returns('');
    this.stubs.getInput.withArgs('project_id').returns('');
    process.env.GCLOUD_PROJECT = 'test-project';
    await run.call(this);
    expect(this.stubs.setProject.withArgs('test-project').callCount).to.eq(1);
  });
});