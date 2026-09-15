# I-TIP-RFC-O-0305: ConsensusLayer

| TIP             | [I-TIP-RFC-O-0305](#i-tip-rfc-o-0305-consensuslayer)                      |
|-----------------|---------------------------------------------------------------------------|
| Title           | The Ootle Consensus Layer                                                 |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2023-10-30                                                                |
| References      | [I-TIP-RFC-O-0330](RFC-0330_Cerberus.md)                                  |

## The Ootle Consensus Layer

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77),[stringhandler](https://github.com/stringhandler)

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

This Request for Comment (RFC) describes the responsibilities of the Ootle consensus layer, and how each of them is
discharged. It is the map; the algorithm itself is specified in
[I-TIP-RFC-O-0330](./RFC-0330_Cerberus.md).

## Related Requests for Comment

* [I-TIP-RFC-O-0303: The Tari Ootle](./RFC-0303_DanOverview.md)
* [I-TIP-RFC-O-0313: Validator Node Registration](./RFC-0313_VNRegistration.md)
* [I-TIP-RFC-O-0314: Validator Node Committee Selection](./RFC-0314_VNCSelection.md)
* [I-TIP-RFC-O-0321: Processing Foreign Proposals](./RFC-0321_ProcessingForeignProposals.md)
* [I-TIP-RFC-O-0325: Epochs and Time Management](./RFC-0325_DanTimeManagement.md)
* [I-TIP-RFC-O-0330: The Ootle HotStuff Consensus Algorithm](./RFC-0330_Cerberus.md)

## The consensus layer is logic agnostic

The first key point to make about the consensus layer is that it is _logic agnostic_. The consensus layer does not
know anything about digital assets or smart contracts. It has one job:

> Ensure that a super-majority of participating nodes agree on the state transition for every Ootle transaction.

Defining the consensus layer this way separates its concerns from those of the smart contract layer. That matters,
because it reduces the attack surface of the consensus layer, and lets it be developed in isolation from the
"business logic" layer.

To be clear, if a super-majority of a committee decides that $1 + 1 = 3$, then that is the truth as far as the
consensus layer is concerned.

The job subdivides into several co-ordinated tasks, each covered below:

1. Deterministic distribution of validator nodes across the state space, forming **validator node committees**.
2. Periodic redistribution of validator nodes, to reduce the opportunity for collusion.
3. Efficient transmission of consensus messages across the network.
4. Identifying and removing malicious or unresponsive nodes.
5. Correct identification of the nodes participating in a cross-shard transaction.
6. Requesting and responding to state requests from other nodes.
7. Reaching consensus on the state transition for a given transaction.
8. Effective leader rollover when a leader is faulty.
9. Guaranteeing liveness in the face of a Byzantine stoppage.

## Distribution of validator nodes

The substate address space is split into a fixed number of **preshards** — `NumPreshards::current()`, currently 256.
Contiguous runs of preshards are grouped into **shard groups**, and one validator node committee covers each shard
group. The number of committees is $\max(1, \lfloor N_\text{vn} / \texttt{committee\_size\_per\_shard\_group}
\rfloor)$, capped at the number of preshards, where `committee_size_per_shard_group` is 40 on mainnet, Esmeralda and
the testnets.

A validator node's shard group follows from its `VN_Shard_Key`: the key locates a preshard, and the preshard locates
the shard group. Assignment is therefore deterministic and verifiable by anyone with the validator set for the epoch.
Committee membership is recomputed at every epoch transition, in `EpochManager::assign_validators_for_epoch`.

Periodic redistribution happens by two mechanisms, both described in
[I-TIP-RFC-O-0313](./RFC-0313_VNRegistration.md): shard keys are reshuffled on a base-layer interval
(`vn_registration_shuffle_interval`), and the number of committees changes as validators join and leave, which moves
the shard group boundaries. Committee selection is described in detail in
[I-TIP-RFC-O-0314](./RFC-0314_VNCSelection.md).

## Efficient transmission of consensus messages

The Ootle runs its own libp2p-based networking stack (`tari_ootle_p2p`), separate from the base layer's. Consensus
messages take one of two paths:

* **Direct messages** to a specific peer — a leader's proposal to its committee, votes back to the leader, `NewView`
  messages, and the request/response exchanges for missing transactions and foreign proposals.
* **Gossip** on a topic, for messages whose audience is more than one committee: new transactions, and foreign
  proposal notifications. Foreign proposal notifications name their target shard groups in the payload, and are
  published on a single network-wide topic; receivers not in the audience ignore them. The payload is deterministic
  so that gossipsub's content-addressed message id deduplicates the copies published by each local validator.

Committee members find each other through the epoch manager: the validator set for an epoch is known from the base
layer, and each node's peer address is part of its registration.

Peers that send invalid messages are banned at the networking layer. Banning is a local decision and does not by
itself remove a node from the validator set; the consensus-level mechanism for that is eviction, below.

## Identifying and removing malicious nodes from the network

Unresponsive nodes are removed from consensus by their own committee, without base-layer involvement.

Each node tracks how many proposals every committee member has missed while it was leader:

* After `missed_proposal_suspend_threshold` missed proposals (5), the node is **suspended**: peers immediately send a
  `NewView` to the *next* leader when the suspended node's turn comes, rather than waiting out the pacemaker timeout.
  A suspended node still participates as a replica.
* After `missed_proposal_evict_threshold` missed proposals (10), an `EvictNode` command is proposed, carrying an
  `EvictionProof`. Once that command commits, the node is removed from the committee for the remainder of the epoch.
* A suspended node recovers by participating: each block it votes in decrements its missed-proposal count, up to
  `missed_proposal_recovery_threshold` (5). At zero it is no longer suspended.

Beyond eviction, the deterrent against malicious behaviour remains economic. A substantial deposit is required to
register as a validator node, and after de-registration that deposit is locked for a significant period. A serial
offender therefore incurs a real opportunity cost over time.

Many proof-of-stake systems use "slashing" instead. Slashing sounds good at first, but there are many edge cases in
which honest-but-poorly-configured nodes are punished. We are somewhat sceptical that slashing achieves its intended
goals.

Slashing introduces
[significant additional complexity](https://hedera.com/blog/why-is-there-no-slashing-in-hederas-proof-of-stake),
including the need for additional tuning parameters, the need for 'watchtowers' to police the validator set (a
centralising force), the need for trustless fraud proofs (a non-trivial problem), and the fact that software bugs
don't follow the rules of economic game theory — in other words, they're not rational.

Furthermore, slashing is less relevant in a BFT process where safety and liveness are _guaranteed_ as long as
two-thirds of the committee is honest. The motivation for punishing malicious nodes on the Ootle is two-fold:

* to reduce the chance that a critical mass of $1/3$ malicious nodes accumulates on the network, and
* to deter nodes from colluding to reach 33% (breaking liveness) or 67% (breaking safety).

One alternative to slashing is to make _all_ validator node deposits non-refundable, so that a malicious node has its
deposit implicitly slashed once it is evicted. Honest nodes would need to run for a period before becoming
profitable, akin to an apprenticeship. Validator fees would rise to compensate. This is very similar to slashing in
effect, but simpler to implement and police.

Another option is to make use of auditability and fraud proofs (see section
[V.B](https://arxiv.org/pdf/1708.03778.pdf) of the Chainspace paper), which would allow retroactive punitive action
against colluding nodes that act together to subvert an entire committee. This is worth exploring: it is quite clear
from the experience of incumbent proof-of-stake networks that essentially _all_ slashing events are due to
configuration errors rather than intentional attempts to bring the network down.

## Identification of nodes participating in cross-shard consensus

Every validator node is registered on the base layer, so anyone with a synchronised Minotari node is in possession of
the current validator set. The rules for mapping a validator to a shard group are deterministic
([I-TIP-RFC-O-0314](./RFC-0314_VNCSelection.md)).

It follows that a validator node must also have access to a Minotari node it trusts, unless the network is running a
configured epoch oracle ([I-TIP-RFC-O-0325](./RFC-0325_DanTimeManagement.md)). Either way, every node can determine
every committee's membership, and therefore which nodes to contact for a cross-shard transaction.

## Requesting and responding to state requests from other nodes

State requests come from three sources:

1. **Cross-shard consensus.** A committee does not fetch foreign input state on demand. Instead, when a foreign
   committee commits a block that prepared a shared transaction, it broadcasts a notification; interested committees
   pull the block and its commit proof and sequence it as a `ForeignProposal` command. See
   [I-TIP-RFC-O-0321](./RFC-0321_ProcessingForeignProposals.md).
2. **State sync.** A node joining a shard group, or catching up after downtime, syncs substates and blocks from peers
   in that shard group over the `rpc_state_sync` protocol. Because committee membership changes at epoch boundaries,
   a node learns its next shard group in advance and syncs before the transition takes effect.
3. **Clients.** Wallets and dApps read state from an Indexer that follows the components they care about. Indexers
   are a trusted party; users wanting a trustless view run their own. See
   [I-TIP-RFC-O-0331](./RFC-0331_Indexers.md).

## Reaching consensus on the state transition for a given transaction

The Ootle uses HotStuff BFT over sharded state. This process is described in detail in
[I-TIP-RFC-O-0330](./RFC-0330_Cerberus.md).

## Effective leader rollover in the case of a faulty leader

The leader for a block height is chosen round-robin: position $h \bmod n$ in the committee, where $h$ is the block
height and $n$ the committee size. Committee ordering is deterministic, so every member agrees on the leader for
every height.

A pacemaker drives the round. If no valid proposal arrives within `pacemaker_block_time` (10 seconds) plus a delta,
the node sends a `NewView` to the leader for the next height, carrying its highest quorum certificate. On collecting
a quorum of `NewView` messages, the new leader proposes at the next height. Repeated failure to propose leads to
suspension and eventually eviction, as described above.

Leader rollover is covered in more detail in [I-TIP-RFC-O-0330](./RFC-0330_Cerberus.md).

## Guaranteeing liveness in the face of a Byzantine stoppage

<div class="note">
Eviction handles the common case — nodes that are offline or unresponsive. The design for forcing liveness through a
<em>deliberate</em> Byzantine stoppage, where at least a third of a committee actively colludes to prevent progress,
is still under discussion. What follows is the current thinking, not an implemented mechanism.
</div>

A liveness break occurs when at least a third of the nodes in a single committee actively or passively collude to
prevent consensus. Successive leader rollovers fail to resolve the issue, and transactions touching that committee's
shard group become stuck.

Left alone, the whole network eventually stops functioning, even though it is sharded: probabilistically, most
components will eventually produce a state change that requires the Byzantine committee to take part.

It is therefore critical that liveness can be restored relatively quickly and efficiently.

The basic strategy is that enough nodes vote to force an epoch change. Nodes must provide proof of recent activity in
order to participate in the new epoch; nodes that cannot are evicted. The epoch change reshuffles committee
membership, and any remaining colluding nodes are dispersed across new shard groups.

# Change Log

| Date        | Change                                                                       | Author    |
|:------------|:-----------------------------------------------------------------------------|:----------|
| 07 Sep 2026 | Realign with the implementation: shard groups, eviction, gossip, state sync  | Tari Labs |
| 16 Dec 2023 | Second draft                                                                 | CjS77     |
| 30 Oct 2023 | First draft                                                                  | CjS77     |

[base layer]: Glossary.md#base-layer

[validator node]: Glossary.md#validator-node

[validator node comittee]: Glossary.md#validator-node-committee
