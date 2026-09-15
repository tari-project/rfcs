# I-TIP-RFC-O-0325: EpochManagement

| TIP             | [I-TIP-RFC-O-0325](#i-tip-rfc-o-0325-epochmanagement)                     |
|-----------------|---------------------------------------------------------------------------|
| Title           | Epochs and Time Management                                                |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2022-10-19                                                                |
| References      | [I-TIP-RFC-O-0313](RFC-0313_VNRegistration.md)                            |

## Epochs and Time Management

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [SW van Heerden](https://github.com/SWvheerden)

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

The aim of this Request for Comment (RFC) is to describe the role of epochs and time management on the Ootle: what an
epoch is, where the network gets its clock from, and how it transitions from one epoch to the next without breaking
liveness.

## Related Requests for Comment

* [I-TIP-RFC-O-0303: The Tari Ootle](./RFC-0303_DanOverview.md)
* [I-TIP-RFC-O-0305: The Ootle Consensus Layer](./RFC-0305_Consensus.md)
* [I-TIP-RFC-O-0313: Validator Node Registration](./RFC-0313_VNRegistration.md)
* [I-TIP-RFC-O-0314: Validator Node Committee Selection](./RFC-0314_VNCSelection.md)

## Motivation

For stability and security in the [VNC]s we have the following requirements:

* We need to know who the valid and active [VN]s are.
* [VNC]s need to be periodically shuffled to prevent shard targeting attacks.
* [VNC] membership cannot change on a whim; it must be stable enough for members to vote on and process transactions.
* Chain reorganisations on the Minotari chain must not affect [VNC] distribution.
* When a [VN] moves from one shard group to another, it must have enough time to sync the required state before the
  move takes effect.
* When a [VN] moves from one shard group to another, the [VNC] it leaves must retain enough members to keep
  functioning.

An **epoch** is the unit that satisfies all of these. Within an epoch, the validator set and every committee's
membership are fixed. All change — activations, exits, evictions, shard key shuffles, changes in the number of
committees — takes effect at an epoch boundary and nowhere else.

## Where the clock comes from

The Ootle takes its epoch clock from an **epoch oracle**. Three implementations exist, selected by configuration:

* **Base layer oracle.** Epochs are derived from Minotari block height: $\epsilon = \lfloor h / \texttt{
  vn\_epoch\_length} \rfloor$. Validator set changes are read from the base layer as they are scanned. This is the
  production oracle, and the rest of this RFC assumes it unless stated otherwise.
* **Configured oracle.** Epochs advance on a wall-clock interval from a configured base time, and the validator set is
  a static list in the configuration. This is what makes a local network or an integration test deterministic and
  independent of a running base node. The configuration is validated for the invariants the oracle relies on to emit
  the same event stream on every node — no validator may be listed twice, and a claim key rotation may not take effect
  before the validator activates.
* **Hybrid oracle.** Validator set changes come from the base layer, but epoch ticks come from the configured ticker,
  driven by base-layer epoch changes. This is used while bootstrapping a network against a base layer.

An oracle emits a stream of `EpochEvent`s: `EpochChanged`, `ActiveValidatorNodeSetChanged`, `NewValidatorRegistered`,
`NewValidatorNodeExit` and `DoneForNow`. The epoch manager consumes them and maintains the validator set, the
committee assignment and the epoch hash.

## Lag: insulating the Ootle from base-layer reorgs

Because the [Minotari] chain drives the Ootle clock, the Ootle needs a stable view of it. Minotari is built on
proof-of-work, so its recent history can be reorganised. A reorg must not cause a committee reshuffle.

The base layer oracle therefore does not read the tip. It scans at a configured `height_lag` behind the tip, and a
block is only treated as final once `base_layer_confirmations` blocks sit on top of it — 1000 on mainnet, 100 on
Esmeralda and the testnets, and 3 on a local devnet. Reorgs shallower than the lag are invisible to the Ootle: the data it extracted is still on the canonical
chain. The point of finality is therefore monotonic, and reorg "noise" at the tip is filtered out entirely.

This has a second, deliberate benefit. Because the Ootle's view of the base layer is deliberately behind, it knows
about registrations, exits and shuffles *before* the epoch in which they take effect. A validator moving to a new
shard group therefore learns about the move in advance and can sync the state it will be responsible for before it is
expected to vote on it.

<div class="note">
Earlier drafts of this RFC called this <em>DAN Lag</em>. The mechanism is the same; the name in the implementation is
<code>height_lag</code>, alongside <code>base_layer_confirmations</code>.
</div>

## Spread: tolerating disagreement about the boundary

Base nodes are decentralised, so there is no single view of the chain's height. The Ootle operates on millisecond
timescales while the Minotari chain runs at minutes, and blocks take seconds to propagate. Validators also poll their
base node only every `scanning_interval`.

This means that at any instant, one validator's scanner may have crossed an epoch boundary while another's has not. A
single strict changeover point would therefore cause a liveness failure at every epoch transition.

`epoch_end_spread_blocks` — 5 base-layer blocks — is the leeway. A validator whose own scan has not yet crossed the
boundary, but which is within that many blocks of it, will still accept and vote on an `EndEpoch` proposal from peers
whose oracle has crossed. Setting it to zero disables the leeway.

<div class="note">
Earlier drafts of this RFC called this <em>DAN Grace Time</em>, defined symmetrically as a number of blocks in the
past or future that a validator would accept. As implemented it is one-sided — a lagging validator accepts a peer that
is ahead, not the reverse — and it applies specifically to <code>EndEpoch</code> proposals rather than to instruction
acceptance generally.
</div>

## The epoch transition

An epoch does not end because each node independently notices that a height has passed. It ends because the committee
agrees that it has.

1. A leader whose oracle has crossed the boundary proposes an `EndEpoch` command, carrying the `next_epoch_hash` — the
   hash of the base-layer block at the next epoch's boundary.
2. Replicas ratify that hash against their own oracle, applying the `epoch_end_spread_blocks` leeway, and vote.
3. Once the end-of-epoch block commits with a quorum, the committed hash — not each node's locally derived one — is
   the epoch hash for the next epoch. A node that diverged on the boundary block, for instance because of a
   base-layer reorg deeper than the confirmation depth, adopts the committee's hash rather than wedging on its own.
4. The node locks the next epoch (`lock_epoch`), so that a later reorg surfacing a different view cannot rewrite the
   agreed hash.
5. The epoch manager recomputes the number of committees and reassigns every validator to a shard group. The node
   determines its own shard group for the next epoch, checkpoints state, and creates the genesis block for the new
   epoch.

If a node's own oracle has not yet observed the next epoch when the end-of-epoch block commits — rare, given the scan
lag — the transition is deferred and retried when the oracle catches up.

## Validator set changes

A [VN] must re-register before its registration's `max_epoch` passes, or it is dropped from the validator set. This is
a proof-of-liveness mechanism: it prevents a validator registering once and remaining in the registry forever. It is
therefore always possible to maintain a list of recently active validators.

Joins, exits and evictions are all rate-limited per epoch, and shard key shuffles affect only a small fraction of the
set in any epoch. Together these bound how much of any committee can turn over at a single boundary. See
[I-TIP-RFC-O-0313](./RFC-0313_VNRegistration.md).

## Tuning the values

### Lag and confirmations

The lag must be long enough that ordinary reorgs have no effect on the Ootle, and long enough to give a validator
ample time to download the state for a shard group it is about to join.

### Spread

This should be only a block or two — enough to cover a validator whose base node has not yet seen the boundary block,
or whose scan interval has not yet elapsed.

### Epoch length

An epoch must be long enough that validators do not flood the network with sync requests, and can spend most of their
time processing transactions. It must clearly be longer than the lag.

It must be short enough that validators cannot collude and carry out sharding attacks, and short enough that inactive
validators are removed from the registry promptly.

## Change Log

| Date        | Change                                                                             | Author     |
|:------------|:-------------------------------------------------------------------------------------|:-----------|
| 07 Sep 2026 | Epoch oracles, `EndEpoch` agreement; DAN Lag/Grace Time renamed to lag and spread    | Tari Labs  |
| 19 Oct 2022 | First outline                                                                        | SWvHeerden |

[VNC]: RFC-0314_VNCSelection.md#intro

[VN]: Glossary.md#validator-node

[base node]: Glossary.md#base-node

[Minotari]: Glossary.md#base-layer
