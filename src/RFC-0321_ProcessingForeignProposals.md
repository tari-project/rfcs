# I-TIP-RFC-O-0321: ForeignProposals

| TIP             | [I-TIP-RFC-O-0321](#i-tip-rfc-o-0321-foreignproposals)                    |
|-----------------|---------------------------------------------------------------------------|
| Title           | Processing Foreign Proposals                                              |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2023-11-17                                                                |
| References      | [I-TIP-RFC-O-0330](RFC-0330_Cerberus.md)                                  |

## Processing Foreign Proposals

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [stringhandler](https://github.com/stringhandler)

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

This RFC describes how a validator node committee learns what other committees have decided about a transaction they
share, and how it sequences that information into its own chain.

Across the network, transactions must be processed or time out. When a transaction is prepared on a shard group it
pledges substates, preventing other transactions from using them. A prepared transaction must therefore complete or be
aborted in a timely manner, so that those substates are released.

## Related Requests for Comment

* [I-TIP-RFC-O-0305: The Ootle Consensus Layer](./RFC-0305_Consensus.md)
* [I-TIP-RFC-O-0330: The Ootle HotStuff Consensus Algorithm](./RFC-0330_Cerberus.md)
* [I-TIP-RFC-O-0314: Validator Node Committee Selection](./RFC-0314_VNCSelection.md)

## Glossary

* **Block** — an Ootle block, consisting of an ordered set of commands.
* **Command** — one of `LocalOnly`, `LocalPrepare`, `LocalAccept`, `AllAccept`, `SomeAccept`, `ForeignProposal`,
  `EvictNode` or `EndEpoch`. The transaction commands move a transaction through its consensus stages.
* **Foreign proposal** — a block committed by another shard group's committee, which a local committee needs in order
  to make progress on a shared transaction.
* **Shard group** — the contiguous range of the address space covered by one committee. See
  [I-TIP-RFC-O-0314](./RFC-0314_VNCSelection.md).

## Description

Cross-shard progress uses a notify-then-pull reliable broadcast, with the foreign block sequenced into the local chain
as an explicit `ForeignProposal` command.

### Broadcasting

When a block commits locally, each validator inspects the transaction commands in it and determines which foreign
shard groups need to see it. A shard group is in the audience if it holds inputs for a transaction whose command in
this block is relevant to it — a `LocalPrepare` is only sent to shard groups that hold inputs, since a shard group
holding only outputs has nothing to pledge and nothing to conflict on.

If the audience is non-empty, the validator broadcasts a `ForeignProposalNotification` on a single network-wide gossip
topic. The notification carries only the block id, the epoch, and the sorted list of target shard groups; it does not
carry the block. Because the shard groups are sorted, every local validator produces byte-identical payloads for the
same block, so gossipsub's content-addressed message id collapses the copies into one.

<div class="note">
Every validator in the committee currently publishes the notification. Reducing this to $f+1$ publishers is a known
optimisation that has not been made.
</div>

### Fetching

A validator receiving a notification:

1. ignores it if it has already requested or already holds that block;
2. ignores it if its own shard group is not in the target list;
3. ignores it if the sender is in its own shard group;
4. otherwise, picks a random member of the sending committee and sends a `ForeignProposalRequest` for the block.

The response carries the block together with a commit proof — the chain of quorum certificates establishing that the
foreign committee committed it. The receiving node validates that proof against the foreign committee's membership for
the epoch, which it derives from the base layer. A node that has fallen behind and cannot validate a proposal can
request it explicitly rather than waiting for another notification.

Pulling rather than pushing means the network cost of a cross-shard transaction is one small gossip message plus one
request/response per interested committee, instead of a full block pushed by $f+1$ nodes to every interested
committee.

### Sequencing

A validated foreign proposal is recorded locally with status `New`. The next time this node is leader, it includes a
`ForeignProposal(block_id, shard_group)` command in its proposal; the record moves to `Proposed`, and to `Confirmed`
once the block containing the command is locked. A proposal that fails validation is recorded as `Invalid`.

Sequencing the foreign block as a command — rather than acting on it as soon as it arrives — is what makes the
outcome deterministic. Every committee member processes the foreign block at exactly the same point in the local
chain, so every member derives the same decision from it.

Foreign proposals are ordered first within a block, ahead of the transaction commands, so that the evidence they carry
is available to the commands that depend on it. The block's command ordering is fixed:
`EvictNode`, then `ForeignProposal` (ordered by shard group and block id), then transaction commands ordered by
transaction id, then `EndEpoch`.

### Processing

Processing a foreign proposal walks its transaction atoms and updates the local record for each shared transaction:

* If the foreign committee decided `ABORT`, the local decision becomes `ABORT` with reason
  `ForeignShardGroupDecidedToAbort`, and an abort execution is recorded even if this committee had previously decided
  to commit.
* If a foreign pledge conflicts with a substate this committee has already pledged to a different transaction, the
  local decision becomes `ABORT` with reason `ForeignPledgeInputConflict`. This is the cross-shard double-spend case:
  where two transactions pledge the same input in different shard groups, both abort, because there is no way to
  determine which was "first".
* Otherwise the foreign evidence is merged into the transaction's evidence. Once evidence has been received from every
  involved shard group, the transaction is ready to move to its next stage.

### Ordering: strict versus relaxed

Two orderings were considered.

**Strict ordering.** Before any transaction in the $N+1$th foreign proposal from a shard group is processed, every
transaction in the $N$th must have been sequenced locally as either `ABORT(reason = Timeout)` or `LocalPrepare`. A
transaction that is going to time out therefore holds up every transaction in later proposals. Timeouts are expected
to be rare — one honest node able to supply the transaction is enough — but this could lead to very long finalisation
times for all cross-shard transactions, and there is potential for deadlock while state stays locked waiting for
timeouts.

**Relaxed ordering.** Transactions from foreign proposals may be processed in any order, but a transaction must still
time out if it is not resolved within a certain number of blocks after the `ForeignProposal` command is sequenced.
This admits some odd-looking behaviour, where a transaction is aborted for a double-spend that happened much later on
one shard group — but that can happen under strict ordering too, if the proposals arrive at different times.

The network uses relaxed ordering.

<div class="note">
Earlier drafts of this RFC specified per-shard-group reliable broadcast counters carried in each block, with the rule
that <code>ForeignProposal</code> commands from a given shard group must appear in strict, gap-free ascending counter
order. That mechanism was not built. Ordering is instead established by the commit proof accompanying each foreign
proposal — a block that has not been committed by its own committee cannot be sequenced — and by evidence
accumulation on the transaction record, which will not let a transaction advance until every involved shard group has
been heard from. Gaps are therefore harmless: a missing intermediate block simply means the transactions it carried
are still awaiting evidence.
</div>

# Change Log

| Date        | Change                                                                     | Author        |
|:------------|:-----------------------------------------------------------------------------|:--------------|
| 07 Sep 2026 | Realign with the implementation: notify-then-pull, commit proofs, ordering  | Tari Labs     |
| 17 Nov 2023 | First draft                                                                | stringhandler |
