# I-TIP-RFC-MT-0140: SyncAndSeeding

| TIP             | [I-TIP-RFC-MT-0140](#I-TIP-RFC-MT-0140-sync-and-seeding)     |
|-----------------|---------------------------------------------------------------------------|
| Title           | Synchronizing the Blockchain: Archival and Pruned Modes                   |
| Last Modified   | 2026-07-16                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2019-02-07                                                                |
| References      |                                                                           |

## Synchronizing the Blockchain: Archival and Pruned Modes

![status: stable](theme/images/status-stable.svg)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2022 The Tari Development Community

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

This Request for Comment (RFC) describes the syncing and pruning process.

## Related Requests for Comment

* [RFC-0110: Base Nodes](RFC-0110_BaseNodes.md)

## Descriptions

### Syncing

When a new node comes online, loses connection or encounters a chain reorganization that is longer than it can tolerate, 
it must enter syncing mode. This will allow it to recover its state to the newest up-to-date state. The base node runs 
as a finite state machine with the following states: `Starting`, `Listening`, `HeaderSync`, `DecideNextSync`, 
`HorizonStateSync`, `BlockSync`, `Waiting`, and `Shutdown`. Sync failures (header, horizon, or block) transition the 
node to a `Waiting` backoff state (default 5 s) before returning to `Listening`. Syncing can be divided into two 
[SynchronizationStrategy]s: complete sync and horizon sync. The strategy is not chosen up front; after header sync the 
`DecideNextSync` state selects it based on the local `pruning_horizon` and peer metadata. Complete sync means that the node 
communicates with an archive node (one whose `pruned_height == 0`) to get the complete history of every single block from 
genesis block. Horizon Sync is used by pruned nodes whose local tip is below the new horizon height; it fetches the kernel 
and UTXO state up to `chain_tip − pruning_horizon`, along with every block header from genesis to the current tip.

To determine if the node needs to synchronise, the node will monitor the broadcasted `chain_metadata` messages provided by its neighbours. The fields in the `chain_metadata` messages MUST be:

| Field | Description |
| --- | --- |
| best_block_height | 64-bit unsigned |
| best_block_hash | hash of the tip block (256-bit / 32 bytes) |
| pruning_horizon | 64-bit unsigned |
| pruned_height | 64-bit unsigned |
| accumulated_difficulty | 512-bit unsigned (split into 256-bit high/low halves on the wire) |
| timestamp | 64-bit unsigned |

#### Complete Sync

Complete sync is only available from archival nodes, as these will be the only nodes that will be able to supply the 
complete history required to sync every block with every transaction from genesis block up onto [current head]. 

#### Complete Sync Process

Once the base node has determined that it is lagging behind the network tip it will start to synchronise with the peer
it determines to have all the data required to synchronise.

The syncing process MUST be done in the following steps:

1. Set [SynchronizationState] to `header_sync`.
2. Sync all missing headers from the genesis block to the current chain tip. The initial header sync allows the node to
   confirm that the syncing peer does indeed have a fully intact chain from which to sync that adheres to this node's
   consensus rules and has a valid proof-of-work that is higher than any competing chains.
3. Set [SynchronizationState] to `decide_next_sync`. This state inspects the local and peer chain metadata and
   selects the appropriate follow-up strategy: it emits `ProceedToBlockSync`, `ProceedToHorizonSync`, or returns to
   `listening` (`Continue`) if no suitable peer is found.
4. Set [SynchronizationState] to `block_sync`.
5. Start downloading blocks from the sync peer, beginning at the local best (tip) block and streaming forward to the
   synced header tip. A fresh node (whose best block is the genesis block) will therefore start from the genesis block.
6. Download all blocks up to [current head], validating and adding the blocks to the local chain storage as we go.
7. Once all blocks have been downloaded up and including the current network tip set the [SynchronizationState] to 
   `listening`.

After this process, the node will be in sync, and will be able to process blocks and transactions normally as they 
arrive.  

#### Horizon Sync Process

The horizon sync process MUST be done in the following steps:

1. Set [SynchronizationState] to `header_sync`.
2. Sync all missing headers from the genesis block to the current chain tip. The initial header sync allows the node to
   confirm that the syncing peer does indeed have a fully intact chain from which to sync that adheres to this nodes
   consensus rules and has a valid proof-of-work that is higher than any competing chains.
3. Set [SynchronizationState] to `horizon_sync`.
4. Download all transaction kernels forwards from the local kernel MMR position up to this node's [pruning horizon]
   height (`chain_tip − pruning_horizon`).
5. Validate the kernel MMR root against each header as the sync progresses.
6. Download all [utxo]'s (and spent-output markers) forwards from genesis (or the last checkpoint) up to this node's
   [pruning horizon] height, in independently-verifiable tranches.
7. Validate outputs and the UTXO Jellyfish Merkle Tree (JMT / sparse Merkle tree) root against the horizon sync
   header's `output_mr`.
8. Validate the chain balances at the final sync height: the sum of UTXO commitments plus burned-output commitments
   must equal the expected total emission commitment plus the total kernel excess sum plus the accumulated kernel offset.
9. Once all kernels and [utxo]s have been downloaded up to this node's [pruning horizon] height, finalize the
   horizon state: set the local best block, set `pruned_height` to the horizon sync height, store the horizon data
   (kernel and UTXO commitment sums), and clear the output-sync checkpoint. Then set the [SynchronizationState] to
   `block_sync`. This hands over further syncing to the standard sync protocol which should return to the `listening`
   state if no further data has been received from peers.

After this process, the node will be in sync, and will be able to process blocks and transactions normally as they
arrive.

#### Keeping in Sync

The node that is in the `listening` state SHOULD periodically test a subset of its peers with ping messages to ensure 
that they are alive. When a node sends a ping message, it MUST include the all the `chain_metadata` fields. The 
receiving node MUST reply with a pong message, which should also include its version of the `chain_metadata` information.

When a node receives pong replies from the current ping round, or the timeout expires, the collected `chain_metadata`
replies will be examined to determine what the current best chain is, i.e. the chain with the most accumulated work
(highest accumulated difficulty, a 512-bit value). If a peer advertises a higher accumulated difficulty than the local
chain, the node first enters a `BehindButNotYetLagging` state to give block propagation a chance to deliver the block
inline; it only transitions to `header_sync` once it is more than `blocks_behind_before_considered_lagging` (default 1)
blocks behind, or once `time_before_considered_lagging` (default 10 s) has elapsed since the stronger chain was first
seen.

#### Chain Forks

Chain forks occur in all decentralized proof-of-work blockchains. When the local node is in the `listening` state it 
will detect that it has fallen behind other nodes in the network. It will then perform a header sync and during the 
header sync process will be able to detect that a chain fork has occurred. The header sync process will then determine
which chain is the correct chain with the highest accumulated work. If required this node will switch the best chain
and proceed to sync the new blocks required to catch up to the correct chain. This process is called a chain 
reorganization or [reorg]. Reorg depth is bounded by `max_reorg_depth_allowed` (default 10 000 blocks, searched in 
500-header chunks); if no chain split is found within that depth the sync peer is banned and no reorg is performed. 

### Pruning 

In Mimblewimble, the state can be completely verified using the current [UTXO] set (which contains the output 
commitments and range proofs), the set of excess signatures (contained in the transaction kernels) and the PoW. The full
block and transaction history is not required. This allows base layer nodes to remove old spent inputs from the 
[blockchain] storage. 

Pruning is only for the benefit of the local Base Node, as it reduces the local blockchain size. Pruning only happens 
after the block is older than the [pruning horizon] height. A Base Node will either run in archival mode or pruned mode.
Mode is determined by `pruning_horizon`: a value of `0` means archival (the shipped default), any non-zero value enables
pruned mode. If the Base Node is running in archive mode (`pruning_horizon == 0`), it MUST NOT prune. 

When running in pruning mode, [Base Node]s SHOULD remove the inputs and spent outputs of every block older than the
[pruning horizon] from their local storage when the chain is extended by a new block from another [Base Node]. Pruning
is gated by `pruning_interval` (default 50 blocks), so it only runs once the local `pruned_height` has fallen more than
`pruning_interval` blocks behind `best_block_height − pruning_horizon`. When a large backlog (more than 25 000 blocks)
must be pruned, the work is performed by a background task in 5 000-block chunks so that normal block processing is not
blocked. Headers and the pruned kernel MMR are always retained.

# Change Log

| Date | Change | Author |
| --- | --- | --- |
| 07 Feb 2019 | First draft | SWvheerden |
| 13 Jul 2021 | Update to better reflect the current implementation | philipr-za |
| 30 Sep 2022 | Rename title for clarity | stringhandler |
| 10 Nov 2022 | Minor update to reflect implementation | mrnaveira |
| 10 Oct 2023 | Minor update to reflect prune mode pruning interval | SWvheerden |

[archivenode]: Glossary.md#archive-node
[blockchainstate]: Glossary.md#blockchain-state
[pruning horizon]: Glossary.md#pruning-horizon
[tari coin]: Glossary.md#tari-coin
[blockchain]: Glossary.md#blockchain
[current head]: Glossary.md#current-head
[block]: Glossary.md#block
[transaction]: Glossary.md#transaction
[base node]: Glossary.md#base-node
[utxo]: Glossary.md#unspent-transaction-outputs
[mimblewimble]: Glossary.md#mimblewimble
[mempool]: Glossary.md#mempool
[BroadcastStrategy]: Glossary.md#broadcaststrategy
[range proof]: Glossary.md#range-proof
[reorg]: Glossary.md#chain-reorg
[SynchronizationStrategy]: Glossary.md#synchronisationstrategy
[SynchronizationState]: Glossary.md#synchronisationstate
[mining server]: Glossary.md#mining-server
