# RFC-1100/TariUniverseOverview

## Tari Universe overview

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Maciej Kożuszek](https://github.com/MCozhusheck)

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

This RFC gives the most top-level description of Tari Universe - a marketplace for all the tapplets.

# Why Tari Universe ?

Present day dapps in ethereum are self-hosted web-apps that require an external wallet. This creates many opportunities for hostile actors to perform supply-chain attacks. This covers a wide range of attacks like: injecting malware code, XSS, stealing domains, social engineering attacks, etc.

The common mode of these attacks is that an attacker convinces the user that he or she is interacting with different smart contracts than the user thinks. The attacker steals funds by causing the user to sign a transaction that calls to a different, fraudulent smart contract.
Wallet available on the ethereum ecosystem only present to the user raw data of transaction without any validation if committing the transaction drains user's assets.

Creating a curated marketplace for tapplets (equivalent of ethereum dapps) will significantly increase security and also create a standard for all tapplet developers to follow.

# Differences from current solutions

What separates Tari Universe from other other apps like [dappRadar](https://dappradar.com/blog/what-is-dappradar) is stronger emphasis on decentralization and security which are achieved by:

- Template registry where each template must be registered
- Lack of central authority

Unlike any other marketplace (let's say Steam of Google Play) anyone can register their tapplet by making a PR to the registry if the tapplet meets requirements. More on this in the [RFC-1102](https://github.com/tari-project/rfcs/pull/138)

# Technical stack

Tari universe is a desktop application built upon [Tauri](https://tauri.app/) which in many ways is similar to more popular [Electron](https://www.electronjs.org/). The advantages of Tauri over Electron are:

- Native Rust backend, providing improved performance,
- A greater focus on [security](https://tauri.app/v1/references/architecture/security), and most importantly,
- trivial interoperability with Tari DAN through existing Rust crates.

### Presentation Layer

Tauri doesn’t specify what framework should be used for frontend development. Our first choice is React with Material UI.
This last bit we may want to revisit when design work is
done and use Tailwind instead.

## Screens of the app

### Settings

Settings panel should allow for:

- switching between different accounts
- providing URL for validator nodes that the app uses

### Dashboard

Main screen with all the tapplets that are registered. Shows most trending tapplets and allows to search by name.

### Applet screen

Description of a tapplet with various statistics eg. size, date of publish

### Error screens

The most relevant errors could be:

- fail to verify the applet
- fail to unpack the applet

These 2 cases are crucial to handle as they are stopping the user from using the entire app.

### Modal window for signing transaction

This is shown on top of the applet.
Should present relevant details of the transaction it’s going to execute.

# Change Log

| Date        | Change  | Author      |
| :---------- | :------ | :---------- |
| 21 Mar 2024 | Draft   | MCozhusheck |
| 26 Mar 2024 | Updates | MCozhusheck |
