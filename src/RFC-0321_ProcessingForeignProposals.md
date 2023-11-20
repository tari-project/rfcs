# RFC-0321/ProcessingForeignProposals

## Processing Foreign Proposals

![status: draft](theme/images/status-draft.svg)

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

This RFC describes the process of distributing and processing foreign proposals in the Tari DAN Cerberus Model

Across the entire network transactions must be processed or time out. When a transaction is started on a shard, it locks up substates, preventing other transactions from completing. Therefore if a transaction is started on a shard, it 
should complete or be aborted in a timely manner to release the resources.

Ordering of transactions is also important across all shards. While the different
shards form a Direct Acyclic Graph (DAG), there should be a consistent ordering 
across the whole network.



## Related Requests for Comment

<!-- * [RFC-0111: Base Node Architecture](./RFC-0111_BaseNodeArchitecture.md) -->

## Glossary

* Block - A second layer block, consisting of ordered commands
* Command - Command can either be Prepare, LocalPrepared, Accept, and moves a transaction into that state.

## Description

To solve the above problems, we'll use reliable broadcast and process foreign evidence in order.

In a local shard committee, the proposed block **must** include a counter per epoch and per shard. If the proposal includes transactions that involve other shards, this counter **must** be incremented.

When the proposed block becomes committed locally, the block **must** be broadcast to each involved shard that was incremented, along with evidence of being committeed (The chain of QCs must be included).

To ensure this, each node in the local committee will forward this committed block, along with a 3 chain of QC's proving it was committeed.

As a local committee member, when I receive a foreign proposal, if it is valid I will queue up a special command ForeignProposal(number, QC_Hash) that I must propose 
when I am next leader (if it has not been proposed already). I also **should** request all transaction hashes that I have not seen from involved_shards for each transaction in the proposal, and add them to my mempool for execution.

In the same order of transactions in the proposal, the transactions must be sequenced into the local chain as either a TIMEOUT or a LOCALPREPARE(TxId, ForeignShardId).

When a LOCALPREPARE command is found in a local proposal, there **must** be a 
Prepare(tx) command for that transaction in or before the current proposal.

In the [TIMEOUT_TIME] block  (e.g. 1000 blocks, but should probably be equal to committee_size * X rounds) after the ForeignProposal command has been proposed, 
all transactions in the proposal must be sequenced, either as LOCALPREPAREs or TIMEOUTs. This is to cater for the case where a transaction was prepared by a foreign committee, but was never found on the network. This is unlikely to happen 
in a non-malicious scenario.

For this reason, LOCAL_PREPARES and TIMEOUTs do not count to the block size.

NOTE: ForeignProposal commands can be proposed in between a previous ForeignProposal and LocalPrepare/Timeout commands, but commands from the ForeignProposal **must** only be proposed after all transactions in the first ForeignProposal have been sequenced. 
The TIMEOUT_TIME block is counted from the height where the ForeignProposal is sequenced.

ForeignProposal commands **must** appear in strict ascending order in the blockchain, but do not have to be in sequential blocks. In other words, for shard *s*, the block containing ForeignProposal(*s*, 1) must have a height lower than ForeignProposal(*s*, 2). Also, if a chain contains ForeignProposal(*s*, 1) and ForeignProposal(*s*, 3), then it **must** also contain ForeignProposal(*s*, 2).

If a node receives a foreign proposal (not the command), and it has not received
the previous foreign proposal, then it should ask the committee to provide it to them.

If the LOCAL_PREPARE command appears in a local proposal for a transaction and is the last such LOCAL_PREPARE and all shards have voted to accept, an ALL_PREPARED(tx) command **must** also be present in the local proposal.
If a LOCAL_PREPARE command appears in the local proposal and is the first such to abort, then a SOME_PREPARED(abort, tx) **must** also be present in the local proposal.
It may happen that a LOCAL_PREPARE(tx) must be sequenced for an already aborted transaction, in which case, it should not be followed by a SOME_PREPARED(abort, tx) but instead an ALREADY_ABORTED(tx) commmand **must** be present in the local proposal.


# Change Log

| Date        | Change        | Author |
|:------------|:--------------|:-------|
| 17 Nov 2023  | First draft   | stringhandler  |

