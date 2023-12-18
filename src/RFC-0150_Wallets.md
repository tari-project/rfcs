# RFC-0150/Wallets

## Base Layer Wallet Module

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77)


<!-- TOC -->
* [RFC-0150/Wallets](#rfc-0150wallets)
    * [Base Layer Wallet Module](#base-layer-wallet-module)
* [Licence](#licence)
    * [Language](#language)
    * [Disclaimer](#disclaimer)
    * [Goals](#goals)
    * [Related Requests for Comment](#related-requests-for-comment)
    * [Description](#description)
        * [Key Responsibilities](#key-responsibilities)
        * [Functional Details](#functional-details)
            * [Basic Transaction Functionality](#basic-transaction-functionality)
            * [Key Management Features](#key-management-features)
            * [State Recovery](#state-recovery)
            * [State Recovery: Process Overview](#state-recovery-process-overview)
        * [Change Log](#change-log)
<!-- TOC -->



# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2019 The Tari Development Community

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
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

The aim of this Request for Comment (RFC) is to propose the functionality and techniques required by the [Base Layer]
Tari [wallet] module. The module exposes the core wallet functionality on which user-facing wallet applications may be built.

## Related Requests for Comment

* [RFC-0111: Base Node Architecture](./RFC-0111_BaseNodeArchitecture.md)

This RFC is derived from a proposal first made in [this issue](https://github.com/tari-project/tari/issues/17).

## Description

### Key Responsibilities

The wallet software is responsible for constructing and negotiating [transactions][transaction] for transferring and receiving
[Tari coins][Tari coin] on the [base layer][Base Layer]. It should also provide functionality to generate, store and recover a master seed key
and derived cryptographic keypairs that can be used for Base Layer addresses and signing of transactions.

### Functional Details

A detailed description of the required functionality of the Tari software wallet is provided in three parts:
* basic transaction functionality,
* key management features, and
* the different methods for recovering the wallet state of the Tari software wallet.

#### Basic Transaction Functionality

- Wallet **MUST** be able to send and receive Tari coins using [Mimblewimble] transactions.
- Wallet **SHOULD** be able to establish a connection with other user wallets to interactively negotiate:
    - construction of the transaction,
    - signing of multi-signature transactions.
- Wallet **SHOULD** be implemented as a library or Application Programming Interface (API) so that Graphical
  User Interface (GUI) or Command Line Interface (CLI) applications can be developed on top of it.
- Wallet **MUST** be able to establish connection to the [base node][Base Node], submit transactions and monitor the Tari [blockchain].
- Wallet **SHOULD** maintain an internal ledger to keep track of the Tari coin balance.
- Wallet **MAY** offer transaction fee estimation, taking into account:
    - transaction byte size
    - network congestion
    - desired transaction priority
- Wallet **SHOULD** be able to monitor and present states (`Spent`, `Unspent` or `Unconfirmed`) of previously submitted transactions,
  by querying information from the connected base node.
- Wallet **SHOULD** present the total `Spent`, `Unspent` or `Unconfirmed` transactions in a summarized form.
- Wallet **SHOULD** be able to update its software to patch potential security vulnerabilities.
  Automatic updating **SHOULD** be enabled by default, but users can decide to opt out.
- Wallet **SHOULD** feature a caching mechanism for querying operations to reduce bandwidth consumption.

#### Key Management Features

- Wallet **MUST** be able to generate a master seed key for the wallet by using at least one of the following methods:
    - input from the user (e.g. when restoring a wallet or in testing),
    - user-defined set of mnemonic word sequences using known word lists,
    - cryptographically secure random number generator.
- Wallet **SHOULD** be able to generate derived, transactional, cryptographic keypairs from the master seed key using deterministic
  keypair generation.
- Wallet **SHOULD** store wallet state using a password or passphrase encrypted persistent key-value database.
- Wallet **SHOULD** provide the ability to store backup of the wallet state to a single encrypted file to simplify wallet recovery and
  reconstruction at a later stage.
- Wallet **MAY** provide the ability to export the master seed key or the wallet state as a printable paper wallet, using coded markers.

#### State Recovery

- Wallet **MUST** be able to reconstruct the wallet state from a manually entered master seed key.
- Wallet **MUST** have a mechanism to systematically scan through the Tari blockchain and [mempool](RFC-0190_Mempool.md) for `Unspent` and `Unconfirmed`
  transactions, using keys derived from the master key.
- The master seed key **SHOULD** be derivable from a set of mnemonic word sequences using known word lists.
- Wallet **MAY** enable the reconstruction of the master seed key by scanning a coded marker of a paper wallet.

#### State Recovery: Process Overview
If the wallet database has been lost, corrupted or otherwise damaged, the outputs contained within ([UTXOs](Glossary.md#unspent-transaction-outputs))
can still be recovered from the Tari [blockchain], given you provide the valid recovery keys. When the wallet is first initialized in recovery mode,
it attempts to synchronize with available base nodes, pulling blocks, attempting to recognize outputs attributed to that particular wallet.

If one can successfully decrypt the encrypted value, then the UTXO is successfully recognized. The next step is to attempt the mask (blinding factor)
recovery by rewinding the range proof. All recognized and verified outputs are stored in the newly initialized, local wallet database,
available for further spending.

The recovery of simple and stealth one-sided outputs is a bit more complex as we first have to recognize the output by its script pattern, before we can try
to decrypt the encrypted value.

An output is recognized if it matches either of the following input script patterns:

- The standard output is the simplest, having a single `Nop` instruction.
- The simple one-sided is matched by the `[Opcode::PushPubKey(scanned_pk)]` so if the `scanned_pk` matches the key derived from the recovery phrase - it's recognized,
- The [stealth one-sided](RFC-0203_StealthAddresses.md) is similar to its simple counterpart with only the script pattern being different `[Opcode::PushPubKey(nonce), Opcode::Drop, Opcode::PushPubKey(scanned_pk)]`, matching by the last provided `Opcode::PushPubKey(scanned_pk)` instruction.



[wallet]: Glossary.md#wallet
[Base Layer]: Glossary.md#base-layer
[tari coin]: Glossary.md#tari-coin
[transaction]: Glossary.md#transaction
[mimblewimble]: Glossary.md#mimblewimble
[blockchain]: Glossary.md#blockchain
[base node]: Glossary.md#base-node

### Change Log

| Date        | Change                                                                         | Author                    |
|:------------|:-------------------------------------------------------------------------------|:--------------------------|
| 26 Oct 2022 | Stabilized RFC                                                                 | CjS77                     |
| 14 Nov 2022 | Added table of contents, recovery process overview and a few minor adjustments | agubarev & hansieodendaal |
