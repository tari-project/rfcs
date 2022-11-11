# RFC-313/VN Registration


![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [stringhandler](https://github.com/stringhandler), [SW van heerden](https://github.com/SWvheerden) and [sdbondi](https://github.com/sdbondi)

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

The goal of this RFC is to outline the [DAN] validator node registration requirements and define a set of procedures that allow permissionless participation
in the [DAN]. This includes defining the interaction between the validator and base node, new base layer validations, and validator shard key allocation.

## Overview

Building on the [RFC-0303](./RFC-0303_DanOverview.md), we define the mechanism that allows [DAN] validators to register on the [DAN] network.

Each validator requires a connection to a trusted [base-layer node](./Glossary.md#base-node) that provides a canonical view of the blockchain. The blockchain
serves as a shared logical clock for the [DAN]. 

In this RFC, we will show that the validators can leverage the strong _liveness_ guarantees of proof-of-work while providing a scheme that mitigates
the effects of weak _safety_ guarantees (namely, reorgs) on the [base layer].

## Requirements and Definitions

1. To participate in [DAN] BFT consensus, a validator node MUST be registered on the Layer 1 Tari blockchain.
2. Each registration expires after a number of epochs, at which point the validator may no longer participate in [DAN] consensus.
3. A validator MAY re-register before or after the expiration epoch is reached to allow continued participation in [DAN] consensus.
4. A validator registration MUST be submitted as a base layer `ValidatorNodeRegistration` [UTXO] signed by the `VN_Public_Key`
5. A validator MUST be assigned a deterministic but randomized `VN_Shard_Key` that can be verified at any epoch by other validators by inspecting the base layer.
6. The `VN_Shard_Key` MUST be periodically reassigned/shuffled to prevent prolonged control over a particular [shard space].
7. A validator MUST be able to generate a Merkle proof that it is registered for the epoch that it is currently participating.
8. The validator set for any given epoch MUST be unambiguous between validators or anyone observing the [base layer] chain.
9. Base layer reorgs MUST NOT negatively affect the [DAN] layer. 

We define the following validator variables:

| Symbol       | Name            | Description                                        |
|:-------------|:----------------|:---------------------------------------------------|
| $P_i$        | `VN_Public_Key` | The $i$th public validator node key                |
| $S_i$        | `VN_Shard_Key`  | The $i$th 256-bit VN shard key.                    |
| $\epsilon_i$ | `Epoch`         | The $i$th epoch. An epoch is `EpochLength` blocks. |

An epoch $\epsilon$ is defined by the [base layer] block height $h$, where $\epsilon_i = \lfloor \frac{h}{\text{EpochLength}} \rfloor$,
and spans all blocks from the start of the epoch up to but excluding the start of the next epoch.

*Base layer consensus constants* (all values TBD):

| Name                           | Value              | Description                                                                                |
|:-------------------------------|:-------------------|:-------------------------------------------------------------------------------------------|
| `EpochLength`                  | 60 Blocks (~2h)    | The number of blocks in an epoch                                                           |
| `VNRegistrationValidityPeriod` | 20 Epochs (~40hrs) | The number of epochs that a validator node registration is valid                           |
| `VNRegDepositAmount`           | TBD Tari           | The minimum amount that must be spent to create a valid `ValidatorNodeRegistration` [UTXO] |
| `VNRegLockHeight`              | 10 Epochs          | The lock height that must be set on every `ValidatorNodeRegistration` [UTXO]               |
| `VNShardShuffleInterval`       | 100 Epochs         | The interval that a validator node shard key is shuffled                                   |
| `VNRegActivationDelay`         | 2 Epochs           | The number of epochs to delay for before activating a new VN                               |

*Validator node consensus constants:*

| Name                    | Value       | Description |
|:------------------------|:------------|:------------|
| `VNConfirmationPeriod`  | 1000 Blocks |             |

## Validator Registration

A validator node operator wishing to participate in [DAN] consensus MUST generate a [Ristretto] keypair `<VN_Public_Key, VN_Secret_Key>` that serves as a stable [DAN] identity and a signing key for L2 consensus messages.
The `VN_Public_Key` MUST be registered on the base layer by submitting a `ValidatorNodeRegistration` [UTXO] which allows the validator to participate in [DAN] consensus for `VNRegistrationValidityPeriod`.

The published `ValidatorNodeRegistration` [UTXO] has these requirements:
1. MUST contain a valid [Schnorr signature] that simply proves knowledge of the `VN_Secret_Key` 
    * The signature challenge is defined as $e = H(P \mathbin\Vert R)$
    * $R$ is a public nonce, $P$ is the public `VN_Public_Key` 
1. the [UTXO]'s `minimum_value` must be at least `VNRegDepositAmount` to mitigate spam/[Sybil] attacks,
1. the [UTXO] lock-height must be set to `VNRegLockHeight`.
1. A script which burns the validator node registration funds if the validator does not reclaim it for a long period after the lock height expires.

```text
OP_PUSH_INT(N) OP_COMPARE_HEIGHT OP_LTE_ZERO OP_IF_THEN 
    NOP
OP_ELSE
    OP_RETURN
OP_END_IF
```

By submitting this [UTXO] the validator node operator is committing to providing a highly-available node for `VNRegistrationValidityPeriod` epochs.

A validator node operator MAY re-register their `VN_Public_Key` before the `VNRegistrationValidityPeriod` epoch is reached, OPTIONALLY 
spending the previous `ValidatorNodeRegistration` [UTXO]. If the previous `ValidatorNodeRegistration` [UTXO] has not expired and
a new `ValidatorNodeRegistration` [UTXO] is submitted, the new `ValidatorNodeRegistration` [UTXO] supersedes the previous one.

> The validator node may implement auto re-registration to ensure that the validator node continues 
> to be included in the current VN set without constant manual intervention.

A validator MAY deregister by spending their `ValidatorNodeRegistration` [UTXO]. This will remove the validator from the current VN set
in the next epoch.

### Base-layer consensus

The base layer performs the following additional validations for `ValidatorNodeRegistration` [UTXO]s:

1. The `VN_Registration_Signature` MUST be valid for the given `VN_Public_Key` and challenge
1. The `minimum_value` field MUST be at least `VNRegDepositAmount`. The existing `minumum_value` validation ensures the committed value is correct.

Additionally, we introduce a new [block header] field `validator_node_mr` that contains a [Merkle root] committing to all validator 
`Vn_Shard_Key`s in the current epoch.
The `validator_node_mr` needs to be recalculated at every `EpochSize` blocks to account for departing and arriving nodes.
The `validator_node_mr` MUST remain unchanged for blocks between epochs, that is, blocks that are not multiples of `EpochSize`.

> A validator generates a [Merkle proof] that proves its `VN_Shard_Key` is included in the validator set for any given epoch. This proof is provided in [Quorum Certificate]s.

The `validator_node_mr` is calculated for each block as follows:

```rust,ignore
if block_height % EpochSize == 0 {
    let vn_set = get_vn_set(chain_db, consensus_constants, current_epoch);
    calculate_validate_node_mr(vn_set)
} else {
    let previous_block_header = get_previous_block_header(chain_db, block_height);
    previous_block_header.validator_node_mr
}
```

## Epoch transitions

The [DAN] BFT consensus protocol relies on a shared and consistent "source of truth" from the [base layer] chain that defines
the current epoch and validator set as well as [templates](./RFCD-0306_DANTemplateRegistration.md).

As briefly mentioned in the [overview](#overview), any PoW [base layer] chain is prone to [reorg]s. The question arises, how do we 
achieve a shared, consistent view of the chain when the data can disappear from underneath you?

We define a `VNConfirmationPeriod` as is a network-wide constant that specifies the number confirmations (blocks) that a block must have 
before a validator will recognise it as final. The chosen value for `VNConfirmationPeriod` must be large enough to make reorgs beyond that 
point practically impossible. Validators simply ignore [base layer] [reorg]s with a depth _less than_ `VNConfirmationPeriod` deep as the 
data they have extracted is still valid. This means that the _point of finality_ is not always `VNConfirmationPeriod` blocks away from the
tip and is non-decreasing/monotonic which effectively negates [reorg] "noise" from the chain tip. 

However, this does not address [base layer] latency delays where a single huge block or multi-block reorgs may take seconds to be received 
and processed by all [base node]s. Moreover, the validators may poll the base layer only every few seconds, further increasing the latency for 
validators to become aware of the state. This means a single strict validator epoch change-over point will almost always cause liveness failures at 
and after the epoch transition.

To address this, we define a `VNEpochGracePeriod` where both the previous and current epoch are accepted. This value, in blocks, must allow enough
time for all validators to become aware of the [base layer] state for the epoch.

To illustrate, consider the following view of a [base layer] chain. We mark 3 views of the chain.

```text
                                      (a) (b) (c)                
                                       |   |   |                                         {noisy}
------ | --x------------ | --x------------ | --x------------ | --x------------ | --- .... ------> tip
  |  ϵ10       |   |    ϵ11       |      ϵ12       |       ϵ13               ϵ14
 V_1          V_2 V_3   V_4      V_5              V_6                      
Key:
x - Epoch transition point
ϵn - Epoch n
V_n - Validator registrations 
```

Point (a)
- the validator node set is incomplete for epoch 12.
- the active epoch is 11.
- the validator MUST reject instructions for epoch 12.

Point (b) - the start of epoch 12: 
- the validator nodeset is final for epoch 12.
- the active epoch remains at 11.
- the validator MUST accept instructions from epoch 11 and 12.

Point (c) - the transition point for epoch 12:
- the active epoch is now 12
- the validator MUST reject instructions from 11.
- it is assumed at this point that almost all (at least $2f + 1$) nodes are now on epoch 12

#### Validator Node Set Definition

The function $\text{get_vn_set}(\epsilon_n) \rightarrow \vec{S}$ that returns an ordered vector $\vec{S}$ of `VN_Shard_Key`s that are registered for the epoch $\epsilon_n$.
As all [UTXO]s are already ordered in the base layer, we can rely on deterministic ordering based on order the registration [UTXO]s are placed in the blockchain.

The function $\text{get_vn_set}$ is defined as follows:

```rust,ignore
fn get_vn_set(chain_db, current_epoch) -> Vec<VN_Shard_Key> {
   let cursor = chain_db.vn_reg_index.seek_gte(current_epoch - VNRegistrationValidityPeriod)
   while let Some((epoch, (_, vn_shard_key))) = cursor.next() {
      if epoch == current_epoch {
         break;
      }
      vn_set.push(vn_shard_key);
   }
   vn_set
}
```

The following additional indexes are recommended to allow efficient retrieval of the VN set and to produce a valid `validator_node_mr`:
- $I_\epsilon = \\{ \epsilon_i \rightarrow (V_i, S_i) \\}$
- $I_V = \\{ V_i \rightarrow (\epsilon_i, S_i) \\}$

Database index $I_\epsilon$ that maintains a mapping from the next epoch after the registration to all the 
`<VN_Public_Key, VN_Shard_Key>` tuples for all `ValidatorNodeRegistration` [UTXO]s.

The index entry is removed whenever the `ValidatorNodeRegistration` [UTXO] is spent or expires.
The index replaces the previous `ValidatorNodeRegistration` [UTXO] if the validator creates a new one.

For this example, we say that there have been no registrations prior to `V_1`; we define 
`VNRegistrationValidityPeriod = 2 epochs` and `VNRegActivationDelay = 0 epochs`.

```text
                                    (a)            (b)            (c)
                                     |              |              |                      {noisy}
------ | --x------------ | --x------------ | --x------------ | --x------------ | --- .... ------> tip
  |   ϵ10       |   |    ϵ11       |      ϵ12  |    |       ϵ13               ϵ14
 V_1           V_2 V_3  V_4       V_5         V_2  V_6         
 
Key:
x - Epoch transition point
ϵn - Epoch n
V_n - Validator Node Registration UTXO n
```

* Point (a) $\text{get_vn_set}(\epsilon_11) -> [V_1, V_2, V_3]$
* Point (b):
    * In: $[V_2, V_3, V_4, V_5]$, out: $[V_1]$
    * $\text{get_vn_set}(\epsilon_12) -> [V_2, V_3, V_4, V_5]$
* Point (c):
   * In: $[V_6]$, out: $[]$
   * $\text{get_vn_set}(\epsilon_13) -> [V_2, V_4, V_5, V_6]$


### Shard Key and Shuffling

The `VN_Shard_Key` is a deterministic 256-bit random number that is assigned to a validator node by the base layer for a given epoch, and
maps onto the 256-bit [shard space]. 

The [DAN] network needs to agree on and maintain a mapping between each participant's `VN_Public_Key` and the corresponding `VN_Shard_Key` for the 
current epoch. 

We define the function $\text{generate_shard_key}(P_n, \eta) \rightarrow S$ that generates the `VN_Shard_Key` from the inputs.
$S = H(P_n \mathbin\Vert \eta)$ where $H$ is a domain-separated [Blake256] hash function, $P_n$ is the public `VN_Public_Key` and $\eta$ is some entropy.

And we define the function $\text{derive_shard_key}(S_{n-1}, P_n, \epsilon_n, \hat{B}) \rightarrow S$ that deterministically derives the `VN_Shard_Key` for
epoch $\epsilon_n$ from the public `VN_Public_Key` $P_n$, $\hat{B}$ the block hash at height $\epsilon_n * \text{EpochSize} - 1$ (the block before the epoch block).

```rust,ignore
fn derive_shard_key(prev_shard_key: Option<ShardId>, vn_key: U256, epoch: u64, interval: u64, prev_block_hash: U256) -> ShardId {
    match prev_shard_key {
        Some(prev_shard_key) => {
           if (vn_key + epoch) % interval == 0 {
              generate_shard_key(vn_key, prev_block_hash)
           } else {
              prev_shard_key
           }
       },
       None => generate_shard_key(vn_key, prev_block_hash)
   }
}
```

Only a random fraction of validators will be re-assigned shard keys per epoch and that fraction will not be shuffled again
for `VNShardShuffleInterval` epochs. Although the exact number of validators that shuffle per epoch varies, on average 
the `VNShardShuffleInterval` should aim to shuffle around 5% or less of the network per epoch. 

The `prev_shard_key` is the last `VN_Shard_Key` that was assigned to the validator node within the `VNRegistrationValidityPeriod`.
Should `VNRegistrationValidityPeriod` elapse without a renewed registration, a new `VN_Shard_Key` is assigned. 
This means that a validator may be assigned a different `VN_Shard_Key` after each `VNRegistrationValidityPeriod`, 
sooner than `VNShardShuffleInterval`. The validator has nothing to gain from this, on the contrary, they will have 
to re-sync their state and spend time not participating in the network, losing out on fees.

# Change Log

| Date        | Change        | Author     |
|:------------|:--------------|:-----------|
| 12 Oct 2022 | First outline | SWvHeerden |
| 08 Nov 2022 | Updates       | sdbondi    |

[base node]: Glossary.md#base-node
[Base Layer]: Glossary.md#base-layer
[reorg]: Glossary.md#chain-reorganization
[DAN]: RFC-0303_DanOverview.md
[VNC]: RFC-0314-VNCSelection.md#Intro
[scnorr signature]: https://tlu.tarilabs.com/cryptography/introduction-schnorr-signatures
[utxo]: Glossary.md#unspent-transaction-outputs
[shard space]: RFC-0304-DanGlossarymd#Consensus-level
[delayed view]:RFC-0303_DanOverview.md#Network-view
