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
import * as setupGcloud from '@google-github-actions/setup-cloud-sdk';
import { find } from '@actions/tool-cache';
import { join } from 'path';

export abstract class BaseAction {
  private get projectId() {
    return this._projectId;
  }

  private get credentials() {
    return this._credentials;
  }

  private set gcloudVersion(version: string) {
    this._gcloudVersion = version;
  }
  get gcloudVersion() {
    return this._gcloudVersion;
  }

  constructor(
    private _credentials: string = core.getInput('credentials'),
    private _gcloudVersion: string = core.getInput('gcloud_version'),
    private _projectId: string = core.getInput('project_id'),
  ) {}

  protected init = async (): Promise<void> => {
    this.gcloudVersion =
      !this.gcloudVersion || this.gcloudVersion == 'latest'
        ? await setupGcloud.getLatestGcloudSDKVersion()
        : this.gcloudVersion;
    const version = this.gcloudVersion;
    if (!setupGcloud.isInstalled(version)) {
      await setupGcloud.installGcloudSDK(version);
    } else {
      const path: string = find('gcloud', version);
      core.addPath(join(path, 'bin'));
    }

    if (this.credentials)
      await setupGcloud.authenticateGcloudSDK(this.credentials);

    const isAuthenticated = await setupGcloud.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('Error authenticating gcloud.');
    }
    core.info(`Authenticated using gcloud version ${version}`);

    if (this.projectId) {
      await setupGcloud.setProject(this.projectId);
    } else if (this.credentials) {
      this._projectId = await setupGcloud.setProjectWithKey(this.credentials);
    } else if (process.env.GCLOUD_PROJECT) {
      await setupGcloud.setProject(process.env.GCLOUD_PROJECT);
    }

    const isProjectIdSet = await setupGcloud.isProjectIdSet();
    if (!isProjectIdSet) {
      throw new Error(
        'Project id not set. Ensure credentials for project have been provided.',
      );
    }
  };

  abstract run(): Promise<void>;
}
