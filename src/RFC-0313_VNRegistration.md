# RFC-313/VN Registration


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
The goal of this RFC is to describe the process for registering a new Validator Node for use in the second layer.

## Intro
The way [Cerberus](https://www.radixdlt.com/post/cerberus-infographic-series-chapter-i) works, it's imperative that the list of active Validator Nodes (VN)s are publicly known. 
Luckily we have the [Base Layer] where we can publicly commit to VNs. Because we have this list of active VNs, we can use the list when determining [VNC]s.

## Registration
Each VN wishing to participate in the DAN layer must publish a registration UTXO to the [Base Layer]. This registration UTXO MUST be flagged
as a registration UTXO type. A UTXO on the [Base Layer] allows all nodes, including pruned nodes, to verify the list of active VNs. 

We want to make VN registration Sybill-resistant, and to enforce this, the registration UTXOs MUST have at least a value of `VN registration amount` amount of Tari locked up. 
This amount is determined by consensus code and can be only be changed with Hard-Forks. This amount should be high enough that the user who owns the
registration UTXO will de-register the VN to reclaim the amount.

Because we cannot force VNs who have published registration UTXOs to be active and participate in the DAN layer, we can incentivize them by allowing them to reclaim their registration UTXOs as a form of 
de-registration. We cannot stop stale UTXOs, but we can ignore them by enforcing VNs to re-register every `VN re-registration` period of blocks. If [base node]s via consensus
exclude VNs from the `VN Merkle tree` whose registration UTXOs are older than the `VN re-registration` period, we can limit this. 

> NOTE: An aggressive approach may be to force an anyone can spend script on the UTXO if the UTXO goes stale.

In order to shuffle VNs inside of their respective VNCs, VNs MUST get a new VN-key each time they register. This is done to prevent some
operators to do shard targeting attacks. 

Each registration UTXO MUST contain the VN public key with a signature proving it knows the private key. 
The signature MUST as a schnorr type signature as follows:
$$
\begin{aligned}
sig = r + e*k \\\\
e = hash(R || K || Commitment) \\\\
\end{aligned}
$$
As the challenge, we hash the nonce, VN public key, and the commitment. We include the commitment to ensure each signature must be unique. This is important
as we don't want users to reuse all signatures. 


## VN-Key

The VN-key is the unique key used to identify where in the [shard space] this key is generated unique each time the VN is registered to assign the
VN to a different area of the [shard space] each time.

The key MUST be calculated as follows:

$$
\begin{aligned}
\text{VN-key} = hash(\text{VN-pubkey}||\text{blockhash})
\end{aligned}
$$
Where the `blockhash` is the blockhash of the block, the registration transaction was mined in.
It is essential we ensure that the `VN-Key` has some random entropy inside of it, as the `VN-Key` needs to be pseudorandom.

## VN-Key option two

We only need to ensure that the `VN-key` has some random entropy inside of it. At first glance, the `blockhash` is an excellent easy source of random entropy that's different
for each block. But this causes some issues with the proof in the block. If the `blockhash` is dependent on all the information in the block, we cannot include the current VN Merkle proof in the current block. 

An easy fix for this would be to use another source of random entropy that does not depend on the entire current block info. We can replace the `blockhash` with the
`utxo Merkle root`. This is also pseudorandom but does not rely on the `VN key` calculation. 
$$
\begin{aligned}
\text{VN-key} = hash(\text{VN-pubkey}||\text{utxo merkle root})
\end{aligned}
$$


## UTXO de-registration
An option exists to lock the registration UTXO for a certain amount of blocks before allowing spending to ensure registration stays open. But it can be argued that this
serves no real purpose as we don't care if the UTXO exists or not. We care that we have an accurate list of active VNs. Therefore we can say that we allow VNs to 
de0register themselves by spending their registration UTXOs to a normal UTXO. We will still have the [delayed view] of the main chain, so this de-registration action will
only take effect after some time. 

## Epochs
Radix's Cerberus uses epochs to manage VN stability and shuffling of VNs inside the [shard space]. It can be argued that we don't need to group nodes inside of 
epochs to shuffle them around or lock them into a period of "service as a VN". Above in [UTXO de-registration], it was argued why we should not lock a VN to a 
specific period in which they have to serve as VN. And in [Registration], it was argued why it is essential to force VNs to publish new registration transactions 
periodically. We have also mentioned [delayed view] of the [Base Layer]. If we combine these three properties, we can argue that we have stability of the VN population.
We will force VNs to shuffle around the [shard space] at a minimum interval. VNs will know when and to where they will shuffle, giving plenty of time to prepare by 
syncing new state etc., and we know who the active VNs are at all times.


# Change Log

| Date        | Change              | Author    |
|:------------|:--------------------|:----------|
| 12 Oct 2022 | First outline       | SWvHeerden|

[base node]: Glossary.md#base-node
[Base Layer]: Glossary.md#base-layer
[VNC]: RFC-0314-VNCSelection.md#Intro
[shard space]: RFC-0304-DanGlossarymd#Consensus-level
[delayed view]:RFC-0303_DanOverview.md#Network-view
