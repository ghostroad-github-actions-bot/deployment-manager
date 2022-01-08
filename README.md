<!--
 Copyright 2022 Ghost Road Studio

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# `deployment-manager` GitHub Action

Manage resources in Google Cloud Platform using [Deployment Manager][deployment-manager].

## Table of Contents

* [Prerequisites](#prerequisites)
* [Usage](#usage)
* [Inputs](#inputs)
* [Credentials](#credentials)
  * [Used with `setup-gcloud`](#with-setup-gcloud)
  * [Using credentials](#using-credentials)
  * [Via app default credentials](#via-app-default-credentials)
* [Example workflows](#examples)
* [Contributing](#contributing)
* [License](#license)

<br/>

## Prerequisites

Required to run this action are:

* Google Cloud credentials authorized to create/modify deployments and provision the desired resources. See [Credentials](#credentials) below for more.

* Enable the Deployment Manager API:
```bash
gcloud services enable deploymentmanager.googleapis.com
```
<br/>

## Usage

```yaml
- name: Provision Resources
  id: deployment
  uses: ghost-road-studio/deployment-manager@v0
  with:
    deployment: org-structure
    template: org_structure.jinja
    credentials: ${{ secrets.GCP_SA_KEY }}
    labels: environment=dev
    properties: org_id:${{ secrets.GCP_ORGANIZATIONID }}
```
<br/>

## Inputs

| Name | Required | Default | Description |
| ---- | -------- | ------- | ----------- |
| `deployment` | Required. | | Name of deployment to create or update. |
| `template` | Required if not using configuration. | | Path to template. |
| `config` | Required if not using template. | | Path to config. |
| `credentials` | Required if not using `setup-gcloud` with exported credentials. | | Service account key for authentication. JSON formatted private key can be raw or base64-encoded. |
| `project_id` | _optional_ | | ID of the Google Cloud project. Overrides project configured by `setup-gcloud`. |
| `labels` | _optional_ | | Labels to apply to the deployment. |
| `properties` | _optional_ | | Properties to provide to template. Cannot use properties with configurations. |
| `gcloud_version` | _optional_ | `latest` | Pin the version of Cloud SDK `gcloud` CLI. |

<br/>

## Credentials

A service account with the following roles:

- Deployment Manager Editor (`roles/deploymentmanager.editor`):
  - Read and write access to all Deployment Manager resources.

<br/>

Note: This service account must have iam permissions to create/manage the specified resources. Use `gcloud iam roles list` to determine appropriate roles to grant.

<br/>

### With `google-github-actions/auth`

Credentials from the [auth][auth] action can be used:

```yaml
- uses: google-github-actions/auth@v0
  with:
    create_credentials_file: true
    credentials_json: ${{ secrets.GCP_SA_KEY }}
- uses: google-github-actions/setup-gcloud@v0

- name: Deploy to Google Cloud
  uses: ghost-road-studio/deployment-manager@v0
  with:
    deployment: project-structure
    template: project_structure.jinja
    properties: name:test-project
```

### Using Credentials

[Google Cloud Service Account][sa] credentials can be passed directly to the action by specifying `credentials` input. To begin, create a [secret][github-secret] containing the raw or base64-encoded JSON key to be imported into the action.

```yaml
- name: Deploy to Google Cloud
  uses: ghost-road-studio/deployment-manager@v0
  with:
    credentials: ${{ secrets.GCP_SA_KEY_B64 }}
    template: test.jinja
```

### Via app default credentials

If you host your own runners on Google Cloud, the app default credentials of the instance may be used. The service account attached to the instance will be used. **This is only for custom runners hosted in GCP.**

```yaml
- name: Deploy to Google Cloud
  uses: ghost-road-studio/deployment-manager@v0
  with:
    template: test.jinja
```
<br/>

## Example Workflows

```yaml
name: example deployment
on:
  push:
    branches: [ main ]
env:
  DEPLOYMENTS_PATH: deployments
jobs:
  template-deployment:
    name: deployment with labels and properties
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/auth@v0
        with:
          create_credentials_file: true
          credentials_json: ${{secrets.DEPLOYMENTS_SA_KEY}}
      - uses: google-github-actions/setup-gcloud@v0
      
      - name: deployment with labels and properties
        id: deployment
        uses: ghost-road-studio/deployment-manager@v0
        with:
          deployment: ${{ steps.deployment.outputs.deployment }}
          template: ${{ env.DEPLOYMENTS_PATH }}/bucket.jinja
          properties: name:${{ steps.deployment.outputs.deployment }}
          labels: env=test,team=devs
```
<br/>

## Contributing

See [CONTRIBUTING](../../../.github/tree/main/docs/CONTRIBUTING.md).

<br/>

## License

See [LICENSE](LICENSE).

[deployment-manager]: https://cloud.google.com/deployment-manager/docs
[github-secret]: https://docs.github.com/en/actions/security-guides/encrypted-secrets
[sa]: https://cloud.google.com/iam/docs/creating-managing-service-accounts
[auth]: https://github.com/google-github-actions/auth