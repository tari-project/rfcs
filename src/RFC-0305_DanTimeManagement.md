# RFC-0305/DanEpochManagement



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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as 
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

The aim of this Request for Comment (RFC) is to describe the role of Epochs and time management on the Dan.


## Related Requests for Comment

* [RFC-0303: The Digital Assets Network Overview](RFCD-0303_DanOverview.md)


## Motivation

For stability and security in the [VNC]s we have the following requirements:
* We need to know who the valid and active [VN]s are.
* [VN]s need to be swapped around to prevent shard targeting attacks.
* [VNC] members cannot be swapped on a whim and need to be stable to allow members to vote on and process instructions.
* Re-orgs on [base node]s should not have an effect on the [VNC].
* When swapping [VN]s from one [shard space] to another, the [VN] has have enough time to sync the required state before the swapping takes effect.
* When swapping [VN]s from one [shard space] to another, the [VNC] must retain enough members so as as to keep functioning.

## Dan Lag
Because the [Base Layer] influences the Dan layer and is used as a timing mechanism for the Dan, we need to ensure that the Dan has a stable view of the [Base Layer].
The [Base Layer] is PoW and this means that chain might re-org. We need to ensure that re-orgs cannot remove [VN]s from [VNC]s etc. and in general does not influcne the
workings of the Dan layer. We introduce a concept called `Dan Lag` which is a certain amount of blocks until the effect if seen by the Dan Layer. 

In example of this is, if we define `Dan Lag` as 720 blocks, aka a day. Then when a VN registers and that transaction is mined in the [Base Layer] at height 1000 then 
only at height 1720 will the Dan Layer recognise the [VN] as being registered. 

This `Dan Lag` allows the [Base Layer] to have small re-orgs of less than the `Dan Lag` without it having any effect on the Dan Layer. The added benefit of this is, that
the Dan Layer knows all changes in advance of when it will happen, so when a [VN] is swapped to a new [shard space] it will give the [VN] the `Dan Lag` period to sync 
the required state.

## Dan Grace Time 
Because [base node]s are all decentralized and we dont have a single point of view of the [base layer] we need to allow [VN]s to have a different height for the 
[base layer]. The Dan layer will process instructions in ms, while the [base layer] runs at 2 min blocks, and these blocks can take a few seconds to process and 
propagate through the network. This means that for some [VN]s the [base layer] height might be 999, while for others it might be 1000. The practical problem for this
is that we cannot base consensus decisions on the height if the [VN]s cannot come to some consensus as to what the [base layer] height is. 

We define `Dan Grace Time` or DGT as the number of blocks in the past or future of the [VN]'s own current block height, that it will accept. This is very similar to the [FTL] concept concerning the timestamp in the block header.

In example of this would be, that we have `VN_1` whose [base node] is on height 999 and `VN_2` whose [base node] is on height 1000. We have set the DGT as 1. An 
instruction has specified that from height 1000 the [VNC] that must process it contain both `VN_1` and `VN_2`, but before that it is only `VN_1`.  From this it can be 
seen that `VN_1` thinks only it must be in the [VNC] but `VN_2` thinks they both need to be. But using the DGT of 1 block, `VN_1` will accept `VN_2` as part of the [VNC]
because it is withing the DGT period and it assume that its own [base node] is simply lagging 1 block.

The DGT has the additional benefit of allowing a [VN] to finish processing an instruction after a block height has been reached. 

With the example mentioned above if `VN_1` has to stop processing an instruction at height 1000, but it started the instruction at height 999. When height 1000 comes
along it can still continue to process the instruction till height 1001. 

## VN Epoch
We define `VN Epoch` as the time period a [VN] must serve in a single [shard space] before being swapped to a different [shard space]. This to periodically swap [VN]s
around and not have a set single [VNC] in place for an extended period of time. If we define the `VN Epoch` to be equal to the [VN registration] it provides us with two
benefits, one: forces a [VN] to move around the [shard space] periodically, and two: it provides each [VN] with a unique Epoch window meaning the when we swap [VN]s 
around the [shard space] we only swap a small percentage at in a block. This will be limited by block size limit, or can be artificially limited by only allowing a set
number of [VN registration]s per block.

## Big picture
If zoom out and look at the bigger picture and combine all terms and ideas here it can be argued that we meet all of the required goals set out in the motivation. By
forcing [VN]s to re-register periodically via the [VN registration], [VN]s will be provided new a [shard key] periodically. Because of the `Dan Lag` the [VN] will have 
enough time to sync the new shard state required to serve in a [VNC]. Because each [VN] has its own unique `VN Epoch` thats defined as the time the [VN] registered till
the next time the [VN] re-registered, we will only swap small pieces of the Dan layer at a time. If couple the fact that [VN]s that dont publish a new registration 
transaction will be termed as in-active, then we can get a list of active [VN]s. 

## Tuning the values
We need to ensure that all the consensus values defined in the RFC needs to be tuned with the following in mind:

### Dan Lag
The `Dan Lag` must be long enough that small frequent re-orgs dont have an effect on the Dan layer. This must also be long enough to give any new [VN] ample time to
download any required state for [shard space] it will serve in.

### Dan Grace Time
This must be only a block or two. This is just to handle the edge case of what happens if a [VN]'s node has not yet seen a new height, or the height changes while
processing an instruction

### VN Epoch
This must be long enough so that [VN]s dont flood the network with sync requests and spend most of their time processing instructions, it must be longer than the 
`Dan Lag`. This must be short enough that we dont allow [VN]s to do sharding attacks and that we "refesh" the entire network periodically. For example if we set the
`VN Epoch` to a week, aka 5040 blocks, then will move every single [VN] in that time period, but importantly we wont move them at once, but rather spread out. This must
also be short enough that we can easily remove inactive [VN]s from the list of [VN]s.

## Change Log

| Date        | Change              | Author    |
|:------------|:--------------------|:----------|
| 19 Oct 2022 | First outline       | SWvHeerden|

[VNC]: RFC-0314_VNCSelection.md#Intro
[VN]: RFC-0XXX.md
[base node]: Glossary.md#base-node 
[Base Layer]: Glossary.md#base-layer
[shard space]: RFC-0304-DanGlossarymd#Consensus-level
[shard key]: RFC-0304-DanGlossarymd#Consensus-level
[FTL]: RFC-0120_Consensus.md#FTL
[VN registration]: RFC-0XXX.md
