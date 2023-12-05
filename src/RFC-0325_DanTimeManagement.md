# RFC-0325/DanEpochManagement

## Epochs and time management

![status: draft](theme/images/status-draft.svg)

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

The aim of this Request for Comment (RFC) is to describe the role of Epochs and time management on the DAN.

## Related Requests for Comment

* [RFC-0303: The Digital Assets Network Overview](RFC-0303_DanOverview.md)

## Motivation

For stability and security in the [VNC]s we have the following requirements:

* We need to know who the valid and active [VN]s are.
* [VNC]s need to be periodically shuffled to prevent shard targeting attacks.
* [VNC] members cannot be swapped on a whim and need to be stable to allow members to vote on and process instructions.
* Chain re-organisations on the Minotari chain should not have an effect on the [VNC] distribution.
* When swapping [VN]s from one [shard] to another, the [VN] has enough time to sync the required state before the
  swapping takes effect.
* When swapping [VN]s from one [shard] to another, the [VNC] must retain enough members so as to keep functioning.

## DAN Lag

Because the [Minotari] chain influences the DAN layer and is used as a timing mechanism for the DAN, we need to ensure
that the DAN has a stable view of the [Minotari].

The [Minotari] is built on Proof-of-Work and this means that chain might undergo re-organisation. We need to ensure
that re-orgs do cause a [VNC] reshuffle. We introduce a concept called `DAN Lag` which is an offset between when a
[VNC] change is recorded on the Minotari chain and when it takes effect.

For example, if we define `DAN Lag` as 720 blocks, or a day. Then when a VN registers and that transaction is
mined in the [Minotari] at height 1000 then only at height 1720 will the DAN Layer recognise the [VN] as being
registered.

This `DAN Lag` allows the [Minotari] chain to have small re-orgs of less than the `DAN Lag` without it having any
effect on the DAN Layer.
An added benefit of this is that the DAN Layer knows all changes in advance of when it will happen, so when a [VN] is
swapped to a new [shard space] it will give it the `DAN Lag` period to sync the required state.

## DAN Grace Time

Minotari nodes are decentralized. Thus, we don't have a single point of view of the state of the chain.

The DAN operates in ms timeframes, while the [Minotari] chain runs at the minute timeframe, averaging 2 minutes per
block. These blocks also take a few seconds to process and propagate through the network.

This means that for some [VN]s the [Minotari] block height might be 999, while for others it might be 1000. The
practical problem for this is that we cannot base consensus decisions on the block height if the [VN]s cannot come to
some consensus as to what the [Minotari] height is.

We define `DAN Grace Time` or DGT as the number of blocks in the past or future of the [VN]'s own current block height,
that it will accept. This is very similar to the [FTL] concept concerning the timestamp in the block header.

In example of this would be, that we have `VN_1` whose [base node] is on height 999 and `VN_2` whose [base node] is on
height 1000. We have set the DGT as 1.
An instruction has specified that from height 1000 the [VNC] that must process it contain both `VN_1` and `VN_2`, but
before that it is only `VN_1`. From this it can be seen that `VN_1` thinks only it must be in the [VNC] but `VN_2`
thinks they both need to be. But using the DGT of 1 block, `VN_1` will accept `VN_2` as part of the [VNC]
because it is withing the DGT period and it assumes that its own [base node] is simply lagging 1 block.

The DGT has the additional benefit of allowing a [VN] to finish processing an instruction after a block height has been
reached.

With the example mentioned above if `VN_1` has to stop processing an instruction at height 1000, but it started the
instruction at height 999. When height 1000 comes
along it can still continue to process the instruction till height 1001.

## VN Epoch

We define `VN Epoch` as the time period a [VN] must serve in a single [shard] before being moved to a different
[shard]. The purpose of this shuffling is to prevent having a single [VNC] cover the same shard for an extended
period of time and thus reduce the risk of VN collusion.

The shuffling algorithm can be linked to the [VN registration] hash. This provides a random and uniformly 
distributed seed that allows us to shuffle the [VN]s around the [shard space] in a deterministic way. The algorithm 
can also be constructed such that a minority of nodes are shuffled at every epoch, while still maintaining 
equal-sized VNCs.


## Summary

VNs must re-register periodically. This is to ensure that the [VN]s are still active and to prevent a [VN] from
registering once and then never being removed from the VN registry. A new [shard key] is generated each time that a 
VN re-registers. 

(Open question: Is the re-registration fee cheaper than the initial registration fee? Is it zero?)

VNs that miss their re-registration deadline will automatically be de-registered. (Open question: Is the 
registration deposit lost in this case?)
Therefore it is always possible to maintain a list of recently active VNs.

The `DAN Lag` gives [VN]s enough time to sync their new shard's state. 

[VN] are shuffled periodically, but a minority of nodes are shuffled every epoch.

## Tuning the values

We need to ensure that all the consensus values defined in the RFC needs to be tuned with the following in mind:

### DAN Lag

The `DAN Lag` must be long enough that small frequent re-orgs dont have an effect on the DAN layer. This must also be
long enough to give any new [VN] ample time to download any required state for [shard] it will cover.

### DAN Grace Time

This must be only a block or two. This is just to handle the edge case of what happens if a [VN]'s node has not yet seen
a new height, or the height changes while processing an instruction

### VN Epoch

This must be long enough so that [VN]s don't flood the network with sync requests and are able to spend most of their 
time processing instructions. 
It must clearly be longer than the `DAN Lag`. 

It must be short enough that we don't allow [VN]s to collude and carry out sharding attacks. 

The epoch must also be short enough that we can effectively remove inactive [VN]s from the [VN] registry.

## Change Log

| Date        | Change        | Author     |
|:------------|:--------------|:-----------|
| 19 Oct 2022 | First outline | SWvHeerden |

[VNC]: RFC-0314_VNCSelection.md#Intro

[VN]: RFC-0XXX.md

[base node]: Glossary.md#base-node

[Minotari]: Glossary.md#base-layer

[shard space]: RFC-0304-DanGlossarymd#Consensus-level

[shard key]: RFC-0304-DanGlossarymd#Consensus-level

[FTL]: RFC-0120_Consensus.md#FTL

[VN registration]: RFC-0XXX.md
