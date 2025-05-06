# RFC-1102/TappletsRegistry

## Tapplets Registry

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [karczuRF](https://github.com/karczuRF)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2024 The Tari Development Community

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of this document must retain the above copyright notice, this list of conditions and the following
   disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
   disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS DOCUMENT IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS", AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",
"NOT RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community regarding the
technological merits of the potential system outlined herein.

## Goals

The aim of this Request for Comment (RFC) is to describe how the Tapplets Registry works and what kind of data about verified and listed Tapplets should be included in it.

## Related Requests for Comment

- [RFC-1100](https://github.com/tari-project/rfcs/pull/134)
- [RFC-1101](https://github.com/tari-project/rfcs/pull/137)

## Description

The Tapplets Registry is the fundamental part of the Tari Universe described in [RFC-1100](https://github.com/tari-project/rfcs/pull/134). This RFC propose the registry structure as well as manifest file as list of registered and verified Tapplets.

In this document three options are considered:

- Github repository
- Tari Network - contract to store data onchain
- Npm package registry (based on MetaMask Snaps)

In next sections different scenarios are discussed as usage examples. Pros and cons of each solution can be found and summarized.

## Github Repository

Github repository is the solution which assumes that every tapplet's metadata is stored in a separate folder, each version in a subfolder. Tapplets themself are distributed as zip bundles, so the code is not stored in the folder. Tapplet Registry manifest file, named `tapplets-registry.manifest.json`, keeps metadata about verified and listed tapplets.

```
tapplets/
|- example-tapplet/
|- example-othet-tapplet/
|  |- v2.0.0
|     ├─ dist/
|     │  ├─ logo.svg
|     │  ├─ background.svg
|     ├─ README.md
|     ├─ tapplet.manifest.json
|  |- v1.0.1
|  |- v1.0.0
tapplets-registry.manifest.json
```

## Tari Network

Tari Network's Smart Contract (Template) as TappletRegistry. It contains mapping with hashed tapplet data, like shasum.
Tapplets themselfs are packages kept in any registry, like npm.

## npm registry

Let [MetaMask Snaps](https://docs.metamask.io/snaps/learn/about-snaps/) serve as an example.
Github repository is the place where docs, examples, manifest files and so on are stored. Let's assume that every tapplet is an npm package published for specified workspace as e.g. “tari-universe”.

During the discussion about this RFC, it was correctly pointed out that one possible drawback of npm registry is the risk that dependencies will introduce vulnerabilities, which is known as _supply chain attack_. However, by design, tapplets must not have any dependencies required for installation (which should be checked in the add/update process) and must be prepared as production-ready bundles.

To sum up:

- npm stores tapplets
- GitHub repository is the Tapplet Registry and stores tapplets list

## Scenarios

### Adding a new tapplet

Creating PR to the Github Repo by the tapplet author.
Approval should be done only if the tapplet is checked and verified

- Github flow

  1. Fork Tapplets Registry repo and create new branch with a new tapplet files. Add required `tapplet.manifest.json` file and readme.
  2. Sign with GPG key
  3. Register the tapplet:

  - create pull request
  - CLI provides the tapplet data (taken from the package)
  - Github Actions verify - redo previous step to verify if provided data is valid
  - Add GitHub CODEOWNERS:
    - Allows the Tapplet’s contributor for future updates
    - Restrict Tapplet Registry repo from being modified by tapplets contributors

- Tari Network flow

  1. Compress a tapplet project to zip file.
  2. Generate checksum and and sign the Network transaction.
  3. Call contract's function, like registerTapplet() which verifies signature and add the checksum to the verified tapplets mapping.

- npm package registry flow
  1. Create the tapplet package with required files
  2. Publish to npm
  3. Register the tapplet
  - Github PR (GPG key used mandatory)
  - CLI provides the tapplet data (taken from the package)
  - Github Actions verify - redo previous step to verify if provided data is valid
  - Add GitHub CODEOWNERS:
    - Allows the Tapplet’s contributor for future updates
    - Restrict Tapplet Registry repo from being modified by tapplets contributors

### Updating a tapplet version

The upgrade process is almost the same as creating a new one, but with PR only changes need to be checked.

### Deprecating/removing a tapplet

It may (and pretty sure will) happen that a specific version is not recommended for use because of a bug or a business decision. In that case following options are considered:

1. Mark the version as “deprecated” - special optional tag like “status” can be used
2. Update the Tapplet Registry and remove the tapplet from the list available ones

### Testing (demo) version

Before adding a new tapplet to the Registry it should be recommended to check a demo version e.g. for bug bounty hunting. Therefore every tapplet should provide a zip file “plug&play” to download by anyone interested in checking it out.

Using the Tapplet Playground (inspired by [MM Snaps Simulator](https://metamask.github.io/snaps/snaps-simulator/staging/#/manifest)) for the Tari Universe may be used as a required step before tapplet approving. At this point the demo and manifest file with checksum could be checked.

### Summary

|              | Pros                                                                                                                                                   | Cons                                                  |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| GitHub       | Great clarity and simplicity as repo is public and anyone can quickly verify checksum. Using GPG key. Easy to compare changes and approve new version. | Approving thousands of new PRs can be the bottleneck. |
| Tari Network | Registry immutability.                                                                                                                                 | Expensive and in some cases cumbersome.               |
| npm registry | Easy as npm package publishing. Proven and dedicated versioning tool. Clarity and simplicity.                                                          |                                                       |

#### Suggested solution

Based on the analysis of available solutions, particularly the three presented in this document, it is proposed to utilize the **npm registry for tapplets** and **GitHub as the Tapplet Registry**.

### Tapplet version management

This section describes in detail version management in the suggested solution, which is the GitHub and npm registry.

#### Tapplet Registration

Tapplet is the npm package, so first of all the package needs to be created and published to the npm registry. Every package must contain
`tapplet.manifest.json` file with tapplet’s data required for registration to Tari Universe

Following steps are required to register a tapplet:

1. Publisher creates a pull request to the Tapplet Registry repository.
2. GitHub Actions runs CI workflow to:

- install the tapplet without an error,
- check if no dependencies are required to install (for security reasons tapplets must not install any npm dependencies),
- check if required files are included in the package
- checksum created from the tapplet code equals checksum given in the tapplet.manifest.json file by the publisher

3. CI generates `tappletRegistry.manifest.json` file with extracted data from `tapplet.manifest.json` file
4. Tapplet’s [CODEOWNER](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners#about-code-owners) is registered and from now changes for this specific tapplet can be done only with commits signed by the codeowner.

#### Tapplet Upgrade

Each version of a tapplet needs to be registered separately. Once registered and listed in Tapplets Registry, this tapplet version must not be changed and upgrade must be done as a new pull request to the Tapplet Registry repository. Only codeowner of a specific tapplet can add a new version. Upgraded tapplet data is added to the `tappletRegistry.manifest.json` file by the CI which does the same things as for tapplet registration workflow.

#### Tapplet removing/deprecating

It may (and pretty sure will) happen that a specific version is not recommended for use because of a bug or a business decision. In that case following options are considered:

1. Mark the version as “deprecated” - special optional tag like “status” can be used
2. Update the Tapplet Registry and remove the tapplet from the list available ones

In both cases the workflow is similar to adding and upgrading tapplets. A new pull request must be created with CI checking if this was done by the codeowner. If so, `tappletRegistry.manifest.json` file is again auto-generated. In this way tapplets can be deleted/deprecated only by its owners and the tapplet registry file can not be changed “by hand” by the repo maintainers without tapplet’s publisher knowledge.

## Tapplets Registry manifest

Example of `tappletsRegistry.manifest.json` file

```
{
  "verifiedTapplets": {
    "@company-name/tapplet-name": {
      "id": "@company-name/tapplet-name",
      "metadata": {
        "displayName": "Tapplet human readable name",
        "author": {
          "name": "Author Name",
          "website": "https://company-name.io/"
        },
        "about": {
          "summary": "Short (a few words) summary.",
          "description": "Longer (a few sentences) project description."
        },
        "audits": [
          {
            "auditor": "Auditor",
            "report": "https://auditor-company.io/audits/tapplet-name"
          }
        ],
        "category": "tapplet category",
        "source": {
          "location": {
            "npm": {
              "packageName": "@company-name/tapplet-name",
              "registry": "https://registry.npmjs.org/"
            }
          }
        }
      },
      "versions": {
        "1.2.2": {
          "checksum": "checksumv122"
        },
        "1.2.0": {
          "checksum": "checksumv120"
        }
      }
    },
    "@company-another-name/tapplet-another-name": {
      "id": "@company-another-name/tapplet-another-name",
      "metadata": {
        "displayName": "Tapplet human readable name",
        "author": {
          "name": "Author Name",
          "website": "https://company-another-name.io/"
        },
        "about": {
          "summary": "Short (a few words) summary.",
          "description": "Longer (a few sentences) project description."
        },
        "audits": [
          {
            "auditor": "Auditor",
            "report": "https://auditor-company.io/audits/tapplet-another-name"
          }
        ],
        "category": "tapplet category",
        "source": {
          "location": {
            "npm": {
              "packageName": "@company-name/tapplet-another-name",
              "registry": "https://registry.npmjs.org/"
            }
          }
        }
      },
      "versions": {
        "1.2.2": {
          "checksum": "checksumv122"
        },
        "1.2.0": {
          "checksum": "checksumv120"
        }
      }
    }
  }
}

```

# Change Log

| Date        | Change             | Author |
| :---------- | :----------------- | :----- |
| 26 Mar 2024 | version management | karczu |
| 25 Mar 2024 | npm deps info      | karczu |
| 21 Mar 2024 | First draft        | karczu |
