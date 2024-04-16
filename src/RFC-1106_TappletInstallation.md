# RFC-1106/TappletInstallation

## Tari Universe: tapplet installation

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

The aim of this Request for Comment (RFC) is to describe the process of tapplet installation in the Tari Universe.

## Related Requests for Comment

- [RFC-1100: Tari Universe Overview](https://github.com/tari-project/rfcs/pull/134)
- [RFC-1101: Tapplet](https://github.com/tari-project/rfcs/pull/137)
- [RFC-1102: Tapplet Registry](https://github.com/tari-project/rfcs/pull/138)

## Description

Tablet installation process is important and crucial in two cases:

### 1. Adding to the Tapplets Registry

As it was described in the RFC-1102 Tapplet Registry, to add a new tapplet to the registry it needs to be verified first. To achieve that a given npm package with compressed tapplet is downloaded, extracted and checked if the provided checksum, data and files structure are valid. The process must be performed automatically, therefore GitHub Actions are needed to run the script responsible for a tapplet validation.

#### Verification Script

The script should be written in Rust to be consistent with the chosen project’s technical stack. In particular the script should:

- download the npm package using http (not npm install, because it is not desirable to install dependencies)
- extract compressed file
- check files structure and required files presence (like index.html or tapplet.manifest.json)
- given checksum equals to the calculated one from the installed package

### 2. Installing and running a tapplet in the Tari Universe

As it was described in the RFC-1100 Tari Universe is a marketplace, so its inherent feature is to download and run any registered tapplet. In this case the process should be similar to the one described above as the Verification Script. However some extra actions are required to successfully install and run a tapplet:

- defining the download folder path
- defining the cache folder path

Tauri provides well documented modules for working with file and directory paths. This package is simply called [path](https://tauri.app/v1/api/js/path).

#### Download directory path

Platform-specific download directory:

- Linux: Resolves to **_xdg-user-dirs'_** `XDG_DOWNLOAD_DIR`.
- macOS: Resolves to `$HOME/Downloads`.
- Windows: Resolves to `{FOLDERID_Downloads}`.

To get the user's download directory path in Tauri, the `downloadDir` function can be used from the `path` module. Here's an example of how to use it:

```
import { downloadDir } from '@tauri-apps/api/path';

const downloadDirPath = await downloadDir();
```

#### Cache directory path

Tauri provides also a built-in API for managing the application cache, which allows to store and retrieve data in a secure and efficient manner. The API is based on the IndexedDB standard, which is a low-level API for client-side storage of significant amounts of structured data, including files/blobs.

Platform-specific cache directory:

- Linux: Resolves to `$XDG_CACHE_HOME` or `$HOME/.cache`.
- macOS: Resolves to `$HOME/Library/Caches`.
- Windows: Resolves to `{FOLDERID_LocalAppData}`.

To get the user's cache directory path in Tauri, the `cacheDir` function can be used from the `path` module. Here's an example of how to use it:

```
import { cacheDir } from '@tauri-apps/api/path';

const cacheDirPath = await cacheDir();
```


#### Tauri configuration 

Thanks to the [Tauri configuration object](https://tauri.app/v1/api/config/#file-formats) it is possible to customize the Tari Universe application and adjust directories paths. Therefore it is recommended to extract downloaded tapplet and keeps its data within separate folders. 

# Change Log

| Date        | Change      | Author |
| :---------- | :---------- | :----- |
| 11 Apr 2024 | First draft | karczu |
