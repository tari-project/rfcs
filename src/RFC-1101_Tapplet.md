# RFC-1101/Tapplet

## Tapplet

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

The aim of this Request for Comment (RFC) is to propose the Tapplet concept. Tapplets are dedicated Tari's applets registered on the L1 to ensure a superior level of security for network users.

## Related Requests for Comment

[RFC-1100](https://github.com/tari-project/rfcs/pull/134)

## Description

### Motivation

The **Tapplet** is dedicated type of applet for the Tari blockchain and the fundamental part of the Tari Universe described in [RFC-1100](https://github.com/tari-project/rfcs/pull/134). The idea behind registered tapplets is to solve the class of vulnerabilities of the Dapp model known as supply chain attacks. This covers a wide range of attacks like: injecting malware code, XSS, stealing domains, social engineering attacks, etc.
The solution proposed by Tari uses the tapplets Registry (another RFC will describe it) to register hashes of zip bundles of applications and sign them using the private key associated with Yat. The actual zip bundle can be hosted by https, but thanks to the registry commitment, the client can verify that the bundle hasn’t been tampered with.
Additionally the idea is to create an on-chain and association between smart contracts and their front end tapplets. This way, when a smart contract gets reused for a different purpose, it already comes with a ready tapplet that can be nested into other tapplets.

### Tapplets

At first, it is proposed that tapplets are npm packages published to the public npm registry, but in the future it may be extended also to other package managers. Npm is the first choice because it is widely used, so publishing a new Tapplet is as simple as publishing an npm package.

#### Security

Safety considerations are worth mentioning, because as it was rightly pointed out during the discussion, the _npm has such a dismal security record that it might hurt the perceived integrity of the product_.

One of the options is to implement an additional security layer alongside npm, such as [The Update Framework](https://theupdateframework.com/).

An alternative of the npm registry may be IPFS, however from the security point of view both options are similar, because they based on checking the checksum of each version. Only the codeowner of the tapplet can register the new version with given checksum and each version is stored separately in the registry. For more details see _Tapplet version management_ section.

#### Tapplet package structure

Tapplets are separate packages and the file structure depends on its authors, however every package must contain:

- `package.json` file
- `tapplet.manifest.json` file with tapplet’s data required for registration to Tari Universe
- entrypoint file: `/dist/index.html`
- (optionally) helpful `README.md`.

The `package.json` file must adhere to [the requirements of npm](https://docs.npmjs.com/cli/v7/configuring-npm/package-json).

The following details are specific to tapplets:

- The _packageName_ field in `package.json` and `tapplet.manifest.json` must match.
- The _version_ string field in `package.json` and `tapplet.manifest.json` must match. _version_ must be a valid [SemVer](https://semver.org/) version string.
- The _repository.url_ field in `package.json` must match the correct repository for the Tapplet.
- The _source.location.npm.packageName_ in `tapplet.manifest.json` must match the name in `package.json`.
- The _displayName_ in `tapplet.manifest.json` should be a human-readable string less than or equal to 214 characters to be consistent with the [npm package naming rules](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#name)
- The image specified in _design.logoPath_ in the manifest file is used as the logo displayed in tapplets market. This logo should be a valid SVG.
- The image specified in _design.backgroundPath_ in the manifest file is used as the background image displayed in tapplets market. This logo should be a valid SVG.
- The `publisher` filed is a public key of the tapplet publisher. Publisher may be the author of the tapplet package.

After publishing the Tapplet, it is possible to connect to the Tapplet by using the Tapplet ID `npm:[packageName]`.

_Sample package structure. This diagram is non-normative._

```
- example-tapplet/
  ├─ dist/
  │  ├─ index.html
  ├─ package.json
  ├─ README.md
  ├─ tapplet.manifest.json
```

### Manifest

The Tapplet Manifest file specifies the most significant Tapplet’s data, which includes: package name, version, source and content hash. In the future manifest files may also contain references to other applets that get nested within.
Before displaying the tapplet, its integrity will be verified against the hash stored in the Tapplet Registry.

Proposed `tapplet.manifest.json` file:

```
{
  "packageName": "@company-name/tapplet-name",
  "version": "1.2.3",
  "displayName": "Tapplet human readable name",
  "status": "latest / verified / deprecated / vulnerable - anything like this",
  "about": {
    "summary": "Short (a few words) summary.",
    "description": "Longer (a few sentences) project description."
  },
  "design": {
    "logoPath": "./assets/logo.svg",
    "backgroundPath": "./assets/background.svg"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/CompanyName/example-tapplet.git"
  },
  "source": {
    "shasum": "shasumexample",
    "location": {
      "npm": {
        "packageName": "@company-name/tapplet-name",
        "registry": "https://registry.npmjs.org/"
      }
    }
  },
  "publisher": "publisher-public-key"
  "manifestVersion": "1.2.3"
}

```

### Tapplet version management

Step-by-step instructions on how to add, upgrade and remove/deprecate tapplets are precisely described in the [RFC-1102 Tapplets registry](https://github.com/tari-project/rfcs/pull/138) in the “Tapplet version management” section.

# Change Log

| Date        | Change       | Author |
| :---------- | :----------- | :----- |
| 26 Mar 2024 | Second draft | karczu |
| 21 Mar 2024 | First draft  | karczu |
