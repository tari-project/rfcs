# I-TIP-RFC-O-0314: VNCSelection

| TIP             | [I-TIP-RFC-O-0314](#i-tip-rfc-o-0314-vncselection)                        |
|-----------------|---------------------------------------------------------------------------|
| Title           | Validator Node Committee Selection                                        |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2022-10-11                                                                |
| References      | [I-TIP-RFC-O-0313](RFC-0313_VNRegistration.md)                            |

## Validator Node Committee Selection

![status: stable](theme/images/status-stable.svg)

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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all
capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

The goal of this RFC is to describe how validator nodes are allocated to validator node committees (VNCs), and how the
leader for a consensus round is chosen.

## Related Requests for Comment

* [I-TIP-RFC-O-0305: The Ootle Consensus Layer](./RFC-0305_Consensus.md)
* [I-TIP-RFC-O-0313: Validator Node Registration](./RFC-0313_VNRegistration.md)
* [I-TIP-RFC-O-0325: Epochs and Time Management](./RFC-0325_DanTimeManagement.md)
* [I-TIP-RFC-O-0330: The Ootle HotStuff Consensus Algorithm](./RFC-0330_Cerberus.md)

## Intro

Validator nodes are organised into validator node committees, each of which is responsible for a contiguous region of
the substate address space. Membership must be determined pseudo-randomly, must be the same for every observer, and
must be stable enough for members to sync the state they are responsible for before they have to vote on it.

<div class="note">
<p>The design in earlier drafts of this RFC — a balanced Merkle tree of validator keys, with a committee formed from
the <code>COMMITTEE_SIZE / 2</code> keys either side of each substate address, so that a transaction touching $n$
substates was processed by up to $n$ overlapping committees — was not built. It has been replaced by the fixed
preshard partition described below.</p>
<p>The practical problem with per-substate committees is that a committee had to be assembled, and its members had to
hold the relevant state, for every substate a transaction touched. With a fixed partition, the set of committees is
small and known in advance, membership changes only at epoch boundaries, and a node knows exactly which slice of
state to hold.</p>
</div>

## Requirements

1. A minority of nodes must move to a new region of the address space periodically.
2. A validator must not be able to determine its own region ahead of time; it only learns its position once the block
   assigning its shard key is mined.
3. Calculating the committee for a given address must be cheap, and must not require replaying the history of past
   assignments.
4. A validator must have time to sync state for a new region before it is expected to participate in consensus there.
5. The rate at which validators join and leave must be bounded, so that no epoch transition replaces enough of a
   committee to threaten its safety or liveness.

Requirements 1 and 2 are met by shard key shuffling, and requirement 5 by the join and exit queues; both are described
in [I-TIP-RFC-O-0313](./RFC-0313_VNRegistration.md). Requirements 3 and 4 are met by the scheme below.

## Preshards and shard groups

The substate address space is divided into a fixed number of equal **preshards** — `NumPreshards::current()`,
currently 256. A substate address begins with a one-byte *entity id*, and the preshard is read directly from the top
bits of that byte (`SubstateAddress::to_shard`). Mapping an address to a preshard is therefore $\mathcal{O}(1)$ and
requires no network state at all.

Because substates created by the same entity share an entity id, a component and the vaults it owns fall in the same
preshard, and are therefore the responsibility of a single committee. Sharding is by entity, not by individual
substate; see [I-TIP-RFC-O-0330](./RFC-0330_Cerberus.md) for why.

Preshards are collected into **shard groups**. One committee covers each shard group, so the number of shard groups is
the number of committees:

$$
n_\text{committees} = \min\left( n_\text{preshards},\ \max\left(1, \left\lfloor \frac{N_\text{vn}}
{\texttt{committee\_size\_per\_shard\_group}} \right\rfloor \right) \right)
$$

where $N_\text{vn}$ is the number of validators registered for the epoch and `committee_size_per_shard_group` is a
consensus constant, currently 40 on mainnet, Esmeralda and the testnets. Preshards are distributed as evenly as
possible across the shard groups; when the division is not exact, the remainder is spread one preshard at a time over
the lowest-numbered groups, so group sizes differ by at most one.

Two consequences follow. First, while the network is small there is a single shard group covering the whole address
space, and every validator is in one committee — the network behaves as an unsharded HotStuff chain. Second, the
committee size stays near its target as the network grows, and it is the number of shard groups that increases. This
is what allows throughput to scale with the validator count.

## Assigning validators to committees

A validator's committee follows from its `VN_Shard_Key`:

1. The shard key is a 256-bit value in the substate address space, assigned by the base layer
   ([I-TIP-RFC-O-0313](./RFC-0313_VNRegistration.md)).
2. The shard key locates a preshard.
3. The preshard locates a shard group, given the number of committees for the epoch.

This is `SubstateAddress::to_shard_group`, and it is recomputed for every validator at each epoch transition by
`EpochManager::assign_validators_for_epoch`. Because it depends only on the validator set for the epoch — which every
base node has — any observer can compute any committee's membership for any epoch, without replaying history.

The same function maps a *substate* address to its shard group, and hence to the committee responsible for it. A
transaction's involved committees are therefore known as soon as its inputs and outputs are known.

An important edge case, implied but worth stating: if the whole network is smaller than
`committee_size_per_shard_group`, there is one committee and the whole network is in it.

Note that committee membership changes only at an epoch transition. A validator whose shard key is reshuffled learns
its new shard group at the boundary and, because activation is deferred and shuffles affect only a small fraction of
the set per epoch, has the remainder of the epoch to sync state for its new region before it is expected to vote on
it.

## Committee proofs

The base layer commits to the active validator set in each block header, as the `validator_node_mr` Jellyfish Merkle
root over $H(V_i \mathbin\Vert S_i)$, with `validator_node_size` alongside it. The root is rebuilt at each epoch
boundary and carried forward unchanged within an epoch.

A validator can therefore prove membership of the validator set for an epoch by producing an inclusion proof against
the `validator_node_mr` of any block in that epoch. Since committee assignment is a pure function of the shard key and
the set size, proving set membership proves committee membership.

The entropy for shard key generation is the hash of the block preceding the one in which the registration is mined.
Using the previous block's hash means the miner assembling the block containing a registration cannot influence the
resulting shard key.

## Leader selection

Within a committee, the leader for a block height is selected round-robin:

$$
\text{leader index} = h \bmod n
$$

where $h$ is the block height and $n$ the committee size. Committee ordering is deterministic — members are ordered by
shard key — so every member computes the same leader for every height, and successive heights rotate through the
committee.

This also provides the rollover order when a leader is faulty. If no valid proposal arrives within the pacemaker's
block time, replicas send a `NewView` to the leader at $h + 1$, which is the next member in the rotation. A node that
repeatedly fails to propose is first suspended — peers skip its turn immediately rather than waiting out the timeout —
and eventually evicted. See [I-TIP-RFC-O-0305](./RFC-0305_Consensus.md).

<div class="note">
Round-robin selection is public and predictable a round in advance, which is a deliberate trade: it lets replicas
pre-empt a known-bad leader and lets the next leader prepare its proposal. An unpredictable, per-transaction leader
draw was considered in earlier drafts of this RFC. It was not adopted, because it is incompatible with the
block-based pipeline the network actually runs — leaders propose blocks of commands, not individual transactions.
</div>

# Change Log

| Date        | Change                                                                            | Author     |
|:------------|:------------------------------------------------------------------------------------|:-----------|
| 07 Sep 2026 | Replace the Merkle-neighbour design with preshards and shard groups; leader rotation | Tari Labs |
| 11 Oct 2022 | First outline                                                                       | SWvHeerden |

[base node]: Glossary.md#base-node
