# RFC-0190/Mempool
![status: updated](theme/images/status-stable.svg)
**Maintainer(s)**: [Stanley Bondi](https://github.com/sdbondi), [SW van Heerden](https://github.com/SWvheerden) and [Yuko Roodt](https://github.com/neonknight64)

## The Mempool for Unconfirmed Transactions on the Tari Base Layer

<!-- TOC -->
* [RFC-0190/Mempool](#rfc-0190mempool)
  * [The Mempool for Unconfirmed Transactions on the Tari Base Layer](#the-mempool-for-unconfirmed-transactions-on-the-tari-base-layer)
* [License](#license)
  * [Language](#language)
  * [Disclaimer](#disclaimer)
  * [Goals](#goals)
  * [Related RFCs](#related-rfcs)
  * [Description](#description)
    * [Assumptions](#assumptions)
    * [Abstract](#abstract)
    * [Overview](#overview)
    * [Prioritizing Unconfirmed Transactions](#prioritizing-unconfirmed-transactions)
    * [Memory Pool State: Syncing and Updating](#memory-pool-state--syncing-and-updating)
    * [Unconfirmed Pool](#unconfirmed-pool)
    * [Reorg Pool](#reorg-pool)
    * [Mempool](#mempool)
<!-- TOC -->

# License

[ The 3-Clause BSD License](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2018 The Tari Development Community

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of this document must retain the above copyright notice, this list of conditions and the following
   disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
   disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS DOCUMENT IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",
"NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as
shown here.

## Disclaimer

The purpose of this document and its content is for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community regarding the
technological merits of the potential system outlined herein.

## Goals

This document will introduce the Tari [base layer] [Mempool] that consists of an [Unconfirmed Pool] and [Reorg Pool].
The Mempool is used for storing and managing unconfirmed [transactions][transaction].

## Related RFCs

* [RFC-0100: The Tari Base Layer](RFC-0100_BaseLayer.md)

## Description

### Assumptions

- Each [base node] is connected to a number of peers that maintain their own copies of the Mempool.

### Abstract

The Mempool is responsible for managing, verifying and maintaining all unconfirmed transactions that have not yet
been included in a [block] and added to the Tari [blockchain]. It is also responsible for propagating valid transactions and
sharing the Mempool state with connected peers. An overview of the required functionality for the Mempool and each
of its component pools will be provided.

### Overview

Every base node maintains a transaction pool called `Mempool` that consists of two separate pools: the Unconfirmed Pool and Reorg Pool.
These two pools have different tasks and work together to form the Mempool used for maintaining unconfirmed transactions.

This is the role descriptions for each component pool:
- `Unconfirmed Pool`: contains all unconfirmed transactions that have been verified, have passed all checks, that
  only spend valid [UTXO]s and don't have any time-lock restrictions.
- `Reorg Pool`: stores a backup of all transactions that have recently been included into blocks, in case a blockchain
  reorganization occurs and these transactions have to be restored back to the Unconfirmed Pool, so that they can be included
  in future blocks.

### Prioritizing Unconfirmed Transactions

The maximum storage capacity used for storing unconfirmed transactions by the Mempool and each of its component pools
can be configured. When a new transaction is received and the storage capacity limit is reached, then
transactions are prioritized by ordering their total `fee per gram` of all UTXOs used and transaction age, in that order.
The transactions of the least priority are discarded to make room for higher priority transactions.

The transaction priority metric has the following behavior:
- transactions with higher fee per gram **SHOULD** be prioritized over lower fee per gram transactions.
- older transactions in the mempool **SHOULD** be prioritized over newer ones.


### Memory Pool State: Syncing and Updating

On the initial startup, the complete state of the unconfirmed pool is pulled from the connected peers. Typically, Mempool
doesn't persist its state, but can be configured to do so. If the state is locally present, then only the missing, unconfirmed transactions
are synced from the peers, otherwise, the full state is requested. The validity and priority of transactions are computed
as they are being downloaded from the connected peers. If the base node undergoes a re-org, then the missing state is again 
pulled from the peers.

The functional bahavior required for the Mempool's synchronization are the following:

- All verified transactions **MUST** be propagated to neighboring peers.
- Unverified or invalid transactions **MUST NOT** be propagated to peers.
- Verified transactions that were discarded due to low priority levels **MUST** be propagated to peers.
- Duplicate transactions **MUST NOT** be propagated to peers.
- Mempool **MUST** have an interface, allowing peers to query and download its state, partially and in full.
- Mempool **MUST** accept all transactions received from peers but **MAY** decide to discard low-priority transactions.
- Mempool **MUST** allow wallets to track payments by monitoring that a particular transaction has been added to the Mempool.
- Mempool **MAY** choose:
    - to discard its state on restart and then download the full state from its peers or
    - to store its state using persistent storage to reduce communication bandwidth required when
      reinitializing the pool after a restart.

### Unconfirmed Pool

This Mempool component consists of transactions that have been received, verified and have passed
all the checks, but not yet included in the blocks. These transactions are ready to be used to construct 
new blocks for the Tari blockchain.

Functional behavior required of the Unconfirmed Pool:

- It **MUST** verify that incoming transactions spend only existing UTXOs.
- It **MUST** ensure that incoming transactions don't have a processing time-lock or has a time-lock that has
  expired.
- It **MUST** ensure that all time-locks of the UTXOs that will be spent by the transaction have expired.
- Transactions that have been used to construct new blocks **MUST** be removed from the Unconfirmed Pool and added to the Reorg Pool.

### Reorg Pool

The Reorg Pool consists of transactions that have recently been added to blocks, resulting in
their removal from the Unconfirmed Pool. When a potential blockchain reorganization occurs that invalidates previously
assembled blocks, the transactions used to construct these discarded blocks can be moved back into the Unconfirmed Pool. 
This ensures that high-priority transactions are not lost during reorganization and can be included in future blocks. 
The Reorg Pool is an internal, isolated Mempool component and cannot be accessed or queried from outside.

Functional behavior required of the Reorg Pool:
- Copies of the transactions used recently in blocks **MUST** be stored in the Reorg Pool.
- Transactions in the Reorg Pool **MAY** be discarded after a set expiration threshold has been reached.
- When reorganization is detected, all affected transactions found in the Reorg Pool **MUST** be moved back to the
  Unconfirmed Pool and removed from the Reorg Pool.

### Mempool

The Mempool is responsible for the internal transaction management and synchronization with the peers. New transactions
must pass all verification steps to make it into the Unconfirmed Pool and further be propagated to peers.

Functional behavior required of the Mempool:
- If the received transaction already exists in the Mempool, then it **MUST** be discarded.
- If multiple transactions contain the same UTXO, then only the highest priority transaction **MUST** be kept and the
  rest (having the said UTXO included) **MUST** be discarded.
- If the storage capacity limit is reached, then new incoming transactions **SHOULD** be prioritized according
  to a set number of [rules](#prioritizing-unconfirmed-transactions).
- Transactions of the least priority **MUST** be discarded to make room for higher priority incoming transactions.
- Transactions with its computed priority being lower than the minimum set threshold **MUST** be discarded.
- The Mempool **MUST** verify that incoming transactions do not have duplicate outputs.
- The Mempool **MUST** verify that only matured coinbase outputs can be spent.
- Each component pool **MAY** have the storage capacity configured and adjusted.
- The memory pool **SHOULD** have a mechanism to estimate fee categories from the current Mempool state. For example, 
  the transaction fee can be estimated, ensuring that new transactions will be properly prioritized, to be added
  into new blocks in a timely manner.

Functional behavior required for the allocation of incoming transactions in the component pools:
- Verified transactions that have passed all checks such as spending of valid UTXOs and expired time-locks **MUST** be
  placed in the Unconfirmed Pool.
- Incoming transactions with time-locks, prohibiting them from being included in new blocks **SHOULD** be discarded.
- Newly received, verified transactions attempting to spend a UTXO that does not yet exist **MUST** be discarded.
- Transactions that have been added to blocks and were removed from the Unconfirmed Pool **SHOULD** be added to the Reorg Pool.

[base layer]: Glossary.md#base-layer
[mempool]: Glossary.md#mempool
[unconfirmed pool]: Glossary.md#transaction-pool
[reorg pool]: Glossary.md#reorg-pool
[transaction]: Glossary.md#transaction
[base node]: Glossary.md#base-node
[block]: Glossary.md#block
[blockchain]: Glossary.md#blockchain
[utxo]: Glossary.md#unspent-transaction-outputs
