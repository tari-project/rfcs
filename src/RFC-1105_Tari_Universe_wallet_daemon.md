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

This goal of this RFC is to describe details of the wallet daemon running in the background of Tari Universe. Its stores and handles transaction made by a user.

## Current wallet implementation

The standalone wallet daemon right now connects using webRTC protocol which requires signaling server to connect peers. It ensures secure and private communication but as downside it also requires interactive connection establishment.

## Adapting for Tari Universe

In our case the webRTC is redundant as both wallet daemon and tapplet runs on the same host machine. The best option is to utilize [tauri inter process communication (IPC)](https://beta.tauri.app/concepts/inter-process-communication/) which is made of commands and events.
It's a big simplification both from developer perspective as for user as he no longer cares whether the connection was established or not.

## Architecture overview

The wallet daemon is made of IPC commands handler that is also a main thread that spawns 2 processes running in the background:

- Transaction service
- Account monitor

Communication will be handled by MPSC channels, each process will have a channel for inputs and outputs to send and receive events from the main thread.

![wallet daemon architecture overview](assets/wallet_daemon_architecture.svg)

Both the TransactionService and AccountMonitor are created and spawned as background tasks in the `spawn_services` function. The `spawn_services` function takes in various parameters, including a Notify object for wallet events, and the wallet SDK. It returns a `Services` struct that contains the handles to the spawned tasks (transaction_service_handle and account_monitor_handle) as well as a future (services_fut) that represents the combined execution of both tasks.

### Transaction service

The TransactionService is responsible for managing and processing transactions. It interacts with the wallet SDK (DanWalletSdk) to perform operations such as creating transactions, signing them, and submitting them to the network. It also relies on a Notify object to receive notifications about wallet events. The TransactionService runs in its own background task using tokio::spawn and has a handle (transaction_service_handle) that can be used to interact with it.

### Account monitor

On the other hand, the AccountMonitor is responsible for monitoring changes in the accounts associated with the wallet. It also relies on the Notify object to receive notifications about account-related events. The AccountMonitor runs in its own background task using tokio::spawn and has a handle (account_monitor_handle) that can be used to interact with it.

## Key storage security

All data stored by wallet daemon (transactions, resources, etc.) should be encrypted with password to prevent any hostile actor from obtaining confidential data from user's wallet.
According to [RFC-0153](RFC-0153_StagedWalletSecurity.md) users should be able to play around as fast as possible without any sacrifices to the security. Bare minimum setup should require creating a password for encryption and any other actions like writing down recovery phrase and making backups could be done after users decides to do so.

Users will be able to recover and reset their password using their secret recovery phrase in similar way that [metamask allows to recover wallet](https://support.metamask.io/hc/en-us/articles/360039616872-How-can-I-reset-my-password).

# References

[Example Tauri app architecture with process running in the background](https://rfdonnelly.github.io/posts/tauri-async-rust-process/)

# Change Log

| Date        | Change | Author      |
| :---------- | :----- | :---------- |
| 09 Apr 2024 | Draft  | MCozhusheck |
