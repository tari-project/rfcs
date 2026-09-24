# I-TIP-RFC-O-0313: VNRegistration

| TIP             | [I-TIP-RFC-O-0313](#i-tip-rfc-o-0313-vnregistration)                      |
|-----------------|---------------------------------------------------------------------------|
| Title           | Validator Node Registration                                               |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2022-10-12                                                                |
| References      | [I-TIP-RFC-O-0314](RFC-0314_VNCSelection.md)                              |

## Validator Node Registration

![status: stable](theme/images/status-stable.svg)

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

The goal of this RFC is to define the validator node registration requirements for the Ootle, and the procedures that
allow permissionless participation in it. This covers the interaction between the validator node and the base layer,
the base-layer validations that back it, and validator shard key allocation.

## Related Requests for Comment

* [I-TIP-RFC-O-0303: The Tari Ootle](./RFC-0303_DanOverview.md)
* [I-TIP-RFC-O-0305: The Ootle Consensus Layer](./RFC-0305_Consensus.md)
* [I-TIP-RFC-O-0314: Validator Node Committee Selection](./RFC-0314_VNCSelection.md)
* [I-TIP-RFC-O-0325: Epochs and Time Management](./RFC-0325_DanTimeManagement.md)

## Overview

Each validator requires a connection to a trusted [base-layer node](./Glossary.md#base-node) that provides a canonical
view of the blockchain. The blockchain serves as the shared logical clock and as the registrar for the Ootle.

In this RFC we show that validators can leverage the strong _liveness_ guarantees of proof-of-work while mitigating
the effects of its weak _safety_ guarantees — namely, reorgs — on the Ootle.

## Requirements and Definitions

1. To participate in Ootle BFT consensus, a validator node MUST be registered on the Minotari base layer.
2. Each registration carries a maximum epoch, past which the validator may no longer participate in consensus.
3. A validator MAY re-register before or after that epoch is reached, to allow continued participation.
4. A validator registration MUST be submitted as a base layer `ValidatorNodeRegistration` [UTXO] signed by the
   `VN_Public_Key`.
5. A validator MUST be assigned a deterministic but randomised `VN_Shard_Key` that anyone can verify for any epoch by
   inspecting the base layer.
6. The `VN_Shard_Key` MUST be periodically reassigned to prevent prolonged control over a particular [shard space].
7. A validator MUST be able to prove that it is registered for the epoch it is currently participating in.
8. The validator set for any given epoch MUST be unambiguous between validators and to anyone observing the
   [base layer] chain.
9. Base layer reorgs MUST NOT negatively affect the Ootle.
10. The rate at which validators join and leave the network MUST be bounded, so that no single epoch transition
    replaces enough of a committee to threaten its safety or liveness.

We define the following validator variables:

| Symbol       | Name              | Description                                                            |
|:-------------|:------------------|:-----------------------------------------------------------------------|
| $V_i$        | `VN_Public_Key`   | The $i$th validator node identity key                                  |
| $S_i$        | `VN_Shard_Key`    | The $i$th 256-bit VN shard key                                         |
| $K_i$        | `VN_Claim_Key`    | The $i$th validator's fee claim key                                    |
| $\epsilon_i$ | `Epoch`           | The $i$th epoch. An epoch is `EpochLength` blocks.                     |

An epoch $\epsilon$ is defined by the [base layer] block height $h$, where $\epsilon = \lfloor h /
\text{EpochLength} \rfloor$, and spans all blocks from the start of the epoch up to but excluding the start of the
next epoch.

### Base layer consensus constants

These are defined in `ConsensusConstants` in the `tari` repository. Mainnet values are provisional: the Ootle runs on
the Igor testnet at time of writing, and the mainnet join/exit limits are still placeholders.

| Name (code)                        | Igor        | Description                                                                       |
|:-----------------------------------|:------------|:----------------------------------------------------------------------------------|
| `vn_epoch_length`                  | 10 blocks   | The number of base-layer blocks in an epoch                                       |
| `vn_registration_min_deposit_amount` | 1000 µXTM | Minimum `minimum_value_promise` on a `ValidatorNodeRegistration` [UTXO]            |
| `vn_registration_lock_height`       | 0          | Lock height that must be set on a `ValidatorNodeRegistration` [UTXO]               |
| `vn_registration_shuffle_interval`  | 100 epochs | Mean interval at which a validator's shard key is reshuffled                       |
| `vn_registration_max_vns_initial_epoch` | 50     | Registrations activated in one epoch while the set is still below this size        |
| `vn_registration_max_vns_per_epoch` | 10         | Registrations activated per epoch once the set has grown past the initial size     |
| `vn_registration_max_exits_per_epoch` | 5        | Exits processed per epoch                                                          |

### Ootle consensus constants

These are defined in `ConsensusConstants` in the `tari-ootle` repository.

| Name (code)                  | Value      | Description                                                                        |
|:-----------------------------|:-----------|:------------------------------------------------------------------------------------|
| `base_layer_confirmations`   | 1000 (mainnet), 100 (Esmeralda and testnets), 3 (devnet) | Base-layer confirmations before a block is treated as final |
| `epoch_end_spread_blocks`    | 5          | Base-layer blocks of leeway when voting on `EndEpoch` proposals                     |

## Validator Registration

A validator node operator wishing to participate in Ootle consensus MUST generate a [Ristretto] keypair
`<VN_Public_Key, VN_Secret_Key>` that serves as a stable Ootle identity and a signing key for consensus messages.
The `VN_Public_Key` is registered on the base layer by submitting a `ValidatorNodeRegistration` [UTXO].

The registration carries three fields:

* `signature` — a [Schnorr signature] proving knowledge of the `VN_Secret_Key`, committing to the sidechain id, the
  claim public key and the maximum epoch.
* `claim_public_key` — the `VN_Claim_Key`. Leader fees earned by this validator accrue to a `ValidatorFeePool`
  substate derived from this key, and are withdrawn with the `ClaimValidatorFees` instruction. Separating it from the
  identity key means the key that signs consensus messages (and lives on an always-online node) is not the key that
  controls the fees.
* `max_epoch` — the last epoch for which this registration is valid. The operator chooses it, subject to base-layer
  validation.

The published `ValidatorNodeRegistration` [UTXO] has these requirements:

1. It MUST contain a valid [Schnorr signature] over the registration challenge.
   * The signature challenge is defined as $e = H(P \mathbin\Vert R \mathbin\Vert m)$.
   * $R$ is a public nonce and $P$ is the `VN_Public_Key`.
   * $m$ commits to the sidechain id, the `claim_public_key` and `max_epoch`.
2. The [UTXO]'s `minimum_value` MUST be at least `vn_registration_min_deposit_amount`, to mitigate spam and Sybil
   attacks.
3. The [UTXO] lock height MUST be set to `vn_registration_lock_height`.
4. It MAY carry a script that burns the registration funds if the validator does not reclaim them for a long period
   after the lock height expires.

```text
OP_PUSH_INT(N) OP_COMPARE_HEIGHT OP_LTE_ZERO OP_IF_THEN
    NOP
OP_ELSE
    OP_RETURN
OP_END_IF
```

### Sidechain identity

A registration MAY carry an optional `sidechain_id`. The Minotari base layer acts as registrar for more than one
sidechain, and the validator set is partitioned by this field: the activation queue, the exit queue and the epoch's
validator set are all keyed by it. A registration with no `sidechain_id` belongs to the default Ootle sidechain.

### Activation and the join queue

A registration does not take effect in the epoch it is mined in. The base layer assigns it an **activation epoch**,
which is the earliest epoch at or after the next one in which there is room for it:

* If the registered set is smaller than `vn_registration_max_vns_initial_epoch`, the validator activates in the next
  epoch. This lets a network bootstrap quickly.
* Otherwise, at most `vn_registration_max_vns_per_epoch` validators activate in any one epoch. Registrations beyond
  that are queued into the following epoch, and so on.

This bounds committee churn. Without it, a large enough batch of simultaneous registrations could replace a
committee's membership faster than the incoming nodes could sync the state they are now responsible for, breaking
liveness for that shard group.

By submitting this [UTXO] the operator commits to running a highly-available node from its activation epoch until
`max_epoch`.

An operator MAY re-register the same `VN_Public_Key` before `max_epoch` is reached, OPTIONALLY spending the previous
`ValidatorNodeRegistration` [UTXO]. If the previous registration has not expired and a new one is submitted, the new
one supersedes it.

> A validator node may implement auto re-registration so that it stays in the validator set without constant manual
> intervention.

### Exit and eviction

A validator leaves the set in one of three ways:

1. **Expiry.** The registration's `max_epoch` passes without re-registration.
2. **Voluntary exit.** The operator publishes a `ValidatorNodeExit` side-chain feature. The exit is queued the same
   way joins are: at most `vn_registration_max_exits_per_epoch` exits are processed per epoch, so a coordinated mass
   departure cannot drain a committee below its safety threshold in a single transition.
3. **Eviction.** A committee that agrees a validator has missed too many proposals commits an `EvictNode` command
   (see [I-TIP-RFC-O-0305](./RFC-0305_Consensus.md)). The resulting `EvictionProof` is published to the base layer as
   a side-chain feature, and the base layer removes the validator from the set at the next epoch. This is the one
   path by which layer-two consensus writes back to the layer-one registry.

### Base-layer consensus

The base layer performs the following additional validations for `ValidatorNodeRegistration` [UTXO]s:

1. The registration signature MUST be valid for the given `VN_Public_Key` and challenge.
2. The `minimum_value` field MUST be at least `vn_registration_min_deposit_amount`. The existing `minimum_value`
   validation ensures the committed value is correct.

The [block header] carries two fields committing to the validator set: `validator_node_mr`, a Jellyfish Merkle tree
root over the active validator set, and `validator_node_size`, the size of that set. Each leaf is keyed by
$H_\text{validator\_node}(V_i \mathbin\Vert S_i)$.

The `validator_node_mr` is recalculated at each epoch boundary to account for departing and arriving nodes, and is
unchanged for blocks within an epoch:

1. If the block height is the start of an epoch, fetch the active validator set for the epoch and build the tree over
   it.
2. Otherwise, carry the previous block's `validator_node_mr` forward.

> A validator can therefore produce an inclusion proof that its `VN_Shard_Key` is part of the validator set for a
> given epoch, anchored in a base-layer block header.

## Epoch transitions

Ootle consensus relies on a shared and consistent "source of truth" from the [base layer] chain that defines the
current epoch and validator set.

As mentioned in the [overview](#overview), any proof-of-work chain is prone to [reorg]s. How do we achieve a shared,
consistent view of a chain whose recent history can change?

Validators do not read the tip. The base-layer epoch oracle scans at a configured `height_lag` behind the tip, and
`base_layer_confirmations` blocks must have accumulated before a block is treated as final. The lag is chosen so that
reorgs deeper than it are practically impossible. Reorgs shallower than the lag are invisible to the Ootle, since the
data it has extracted is still valid. The point of finality is therefore monotonic, which removes reorg "noise" at
the chain tip entirely.

That does not address latency. Base nodes receive and process blocks at slightly different times, and validators poll
their base node only every `scanning_interval`. A single strict changeover point would therefore cause liveness
failures at every epoch transition, as some nodes crossed the boundary before others.

To address this, `epoch_end_spread_blocks` defines a window in which a validator whose own scan has not yet crossed
the boundary will still accept an `EndEpoch` proposal from peers whose oracle has crossed. Setting it to zero
disables the leeway.

To illustrate, consider the following view of a [base layer] chain, with three points of interest marked.

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
- the validator MUST reject transactions for epoch 12.

Point (b) — the start of epoch 12:
- the validator node set is final for epoch 12.
- the active epoch remains 11, because other validators may not have reached point (b) yet.
- a validator MUST accept transactions from epoch 11 and 12.
- a validator may receive a leader proposal for epoch 11 and 12; a well-behaved validator MUST vote for only one.

Point (c) — the transition point for epoch 12:
- the active epoch is now 12.
- the validator MUST reject transactions from epoch 11.
- at this point it is assumed that at least $2f + 1$ nodes will accept epoch 12.

### Validator Node Set Definition

The function $\text{get\_vn\_set}(\epsilon) \rightarrow \vec{S}$ returns the ordered vector $\vec{S}$ of
`VN_Shard_Key`s active for epoch $\epsilon$, ordered by `VN_Shard_Key`. A validator is active for $\epsilon$ if its
activation epoch is at or before $\epsilon$, its `max_epoch` is at or after $\epsilon$, and it has not exited or been
evicted before $\epsilon$.

Registrations, activations and exits are held in separate indexes keyed by sidechain id, so that a query is scoped to
one sidechain. Index entries are _not_ removed when a registration is spent or expires, so that state can be rewound
for reorgs.

If a validator publishes two or more registrations in the same block, the index orders them by commitment — the same
canonical ordering as the Minotari block body — and only the last is used.

## Shard Key and Shuffling

The `VN_Shard_Key` is a deterministic 256-bit number assigned to a validator node by the base layer, which maps onto
the 256-bit [shard space]. Its position in the shard space determines the validator's shard group, and therefore its
committee, for the epoch ([I-TIP-RFC-O-0314](./RFC-0314_VNCSelection.md)).

The network needs to agree on the mapping between each participant's `VN_Public_Key` and its `VN_Shard_Key` for the
current epoch. Because the key is derived from base-layer data, every base node computes the same mapping.

Over time, an adversary might gain excessive control over part of the shard space. To mitigate this, shard keys are
periodically and deterministically reassigned.

Shard key generation is:

$$
S = H_\text{validator\_node\_shard\_key}(V \mathbin\Vert \eta)
$$

where $H$ is a domain-separated [Blake2b] hash, $V$ is the `VN_Public_Key` and $\eta$ is entropy taken from the hash
of the block preceding the one the registration is mined in. Because a miner cannot choose that hash and the operator
cannot choose the miner, neither party can steer a validator into a chosen shard group.

Derivation for a subsequent epoch takes the previous shard key $S_{n-1}$, the public key $V$, the epoch $\epsilon_n$
and the shuffle interval $I$:

1. If $S_{n-1}$ is null, generate a new shard key.
2. Otherwise, if $(V + \epsilon_n) \bmod I = 0$, generate a new shard key from the current block hash.
3. Otherwise, return $S_{n-1}$ unchanged.

Because the test depends on the validator's own public key, the set of validators reshuffled in any given epoch is
effectively random, and each validator reshuffles roughly once every $I$ epochs. Only a small fraction of validators
move per epoch, and the interval should be tuned so that this fraction stays well below $\frac{1}{3}$ of any
committee — a larger simultaneous movement could break liveness and safety guarantees for the committees involved.

The `prev_shard_key` is the last `VN_Shard_Key` assigned to the validator while its registration was valid. If the
registration lapses, a new shard key is assigned on re-registration, possibly sooner than the shuffle interval would
have required. A validator gains nothing from this: it must re-sync state for its new shard group and loses fee income
while it does.

# Change Log

| Date        | Change                                                                                | Author     |
|:------------|:---------------------------------------------------------------------------------------|:-----------|
| 07 Sep 2026 | Claim keys, sidechain ids, join/exit queues, eviction, epoch oracle; DAN -> Ootle      | Tari Labs  |
| 18 Nov 2022 | Implementation updates                                                                 | sdbondi    |
| 08 Nov 2022 | Updates                                                                                | sdbondi    |
| 12 Oct 2022 | First outline                                                                          | SWvHeerden |

[base node]: Glossary.md#base-node
[Base Layer]: Glossary.md#base-layer
[reorg]: Glossary.md#chain-reorganization
[Schnorr signature]: https://tlu.tarilabs.com/cryptography/introduction-schnorr-signatures
[utxo]: Glossary.md#unspent-transaction-outputs
[shard space]: #shard-key-and-shuffling
[Blake2b]: https://github.com/tari-project/tari-crypto/blob/main/src/hash/blake2.rs
[Ristretto]: https://ristretto.group/
[Block header]: Glossary.md#block-header
