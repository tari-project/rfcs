# RFC-314/VNC Selection


![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [stringhandler](https://github.com/stringhandler) and [SW van heerden](https://github.com/SWvheerden)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

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
The goal of this RFC is to describe the process for allocating Validator Nodes (VNs) to Validator Node Committees (VNCs)

## Intro
Validator nodes will have to group themselves into Validator Node Committees (VNC) for transactions/shard processing. Committees will be formed for each new transaction/shard processing. This committee needs to be determined pseudorandomly, and we use the VN_Key as this changes periodically and is pseudorandom. Each VN will be allocated a unique and individual shard space to serve in as a VNC member. 

## Requirements
In order to ensure that VNCs are selected securely and can operate successfully, we pin down the following requirements:
1. A percentage of the nodes must change to a new shard space every epoch (e.g.  exactly 25%)
2. A VN must not be able to determine its own shard space location ahead of time.
 - the VN only knows it's new location once the block with the new epoch is mined.
3. It must be easy (e.g. order log_n) to calculate the VN set. (You should have to replay all shuffles to calculate the current VN set).
4. A VN must be able to run inside of a committee for a certain amount of time before syncing to avoid syncing.
5. Open Question: Should there be a limit (e.g. 10%) in the number of nodes that can join per epoch

## VN-key expiry
Each new VN will get a [VN-key] on registration. This key will expire on some pseudorandom height. This is calculated as follows:
$$
\begin{aligned}
\text{Expire height} = \text{(Current block height)} +  \text{(min expire height)} + \text{new VN-pubkey } MOD \text{ (max expire height)}
\end{aligned}
$$

Every time a new VN-Key is assigned a new expiry date is calculated. Because the [miner]s calculate the VN-key, they also calculate the new VN-key every time
it expires.

## Committee Creation
Because we have the base layer where each VN needs to publish a registration transaction, we can get base_node and miners to keep track of all active VNs. We represent all VNs in a (balanced) Merkle tree with the VN_keys as leaves. We declare a constant `COMMITTEE_SIZE` which can be changed in the consensus constants.
For the sake of simplicity, `COMMITTEE_SIZE` MUST be an even positive integer.

As per the Cerberus algorithm, validator nodes are responsible for managing _sub-states_, rather than contract semantics. 
A given instruction may involve dozens of sub-states, meaning that there are potentially dozens of non-overlapping committees that are required to reach a braided consensus.
Each committee is determined independently. For each sub-state, a committee is formed by taking the first  `COMMITTEE_SIZE / 2` VN_keys to the left and `COMMITTEE_SIZE / 2` VN_Keys to the right of the sub-state's shard address in the merkle tree.

This makes it very easy to determine what shard space a VN needs to serve, which states the VN needs to sync from peers, and who has them. Because the
second layer has a delayed view of the network. VNs can also know beforehand and prep to ensure they are ready when new block heights appear. 

An important edge case here that is implied but not listed, is that if the whole network is less or equal to the `COMMITTEE_SIZE`, then the whole network participates in the VNC.

## Committee proofs
We construct the balanced Merkle tree from all active VN registration transactions and prune away all inactive ones. Because the [base node]s have to keep track
of the entire unspent UTXO set, it becomes easy for them to track and validate all active VN registration UTXOs. This means we can keep [base node]s 
responsible for validating and constructing the Merkle tree. We commit this Merkle tree per block as a Merkle root inside the block's header as the `validator_node_set_root`. 

This Merkle root in the header always lags by one block, meaning that the Merkle root is for the state of the VN's before the start of the block it's mined in. 
When a VN registers, that new VN key will only appear inside the Merkle tree in the next block. The reason for this is that header_hash is used in the
the calculation process of the VN_key. 

### Option 2 for Committee proofs
The VN_key needs some random entropy that's not minable to ensure that a VN cannot choose its VN_key. This random entropy is currently the block hash of the
block the VN registration was mined in. Hence the reason for the Merkle root lagging by one block. If we change this entropy value be another source of 
randomness, such as the `utxo_merkle_root`, then we don't have to do the lag by 1, and it can all be calculated in the single block.

## Leader selection
The VNC leader should not be decided beforehand and must be chosen pseudorandomly only when a tx is published. We also need to select an order of leaders
in the case, the first leader is offline/and or not responsive.

$$
\begin{aligned}
vn\_position\_hash(vn, tx) = Hash(vn.signing_key || hash(tx))
\end{aligned}
$$

This will give a sortable list we use to order the VNs for leader selection.

# Change Log

| Date        | Change              | Author    |
|:------------|:--------------------|:----------|
| 11 Oct 2022 | First outline       | SWvHeerden|


[base node]: Glossary.md#base-node
[VN-key]: RFC-0313_VNRegistration.md#XXXX