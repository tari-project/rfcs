# RFC-0131/Mining

## Full-node Mining on Tari Base Layer

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Hansie Odendaal](https://github.com/hansieodendaal), [Philip Robinson](https://github.com/philipr-za)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2020 The Tari Development Community

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

This document describes the final proof-of-work strategy proposal for Tari main net.

## Related Requests for Comment

* [RFC-0100: Base Layer](RFC-0100_BaseLayer.md)
* [RFC-0110: Base Nodes](RFC-0110_BaseNodes.md)

This RFC replaces and deprecates [RFC-0130: Mining](RFCD-0130_Mining.md)

## Description

The following proposal draws from many of the key points of debate from the Tari community on the topic of Tari’s
main chain proof of work strategy. The early working assumption was that Tari would be 100% merged mined by Monero.

Having a single, merge mined Proof of Work (PoW) algorithm would be nice, but the risks of hash rate attacks are 
real and meaningful. Double-spends and altering history can happen with >50% hash power, while selfish mining and 
eclipse attacks can happen with >33% hash power for a poorly connected attacker and >25% for a well-connected attacker 
(see [_Merged Mining: Analysis of Effects and Implications_](http://repositum.tuwien.ac.at/obvutwhs/download/pdf/2315652)).
Any non-merge mined PoW algorithm that is currently employed is even more vulnerable, especially if one can simply buy
hash rate on platforms like NiceHash.

Hybrid mining is a strategy that apportions blocks across multiple PoW algorithms. If the hybrid algorithms are
independent, then one can get at most x% of the total hash rate, where x is the fraction of blocks apportioned to that
algorithm. As a result, the threat of a double-spend or selfish mining attack is mitigated, and in some cases
eliminated.

This proposal puts forward Hybrid mining as the Tari PoW algorithm. 

### The choice of algorithms

In hybrid mining, "independence" of algorithms is key. If the same mining hardware can be used on multiple PoW
algorithms in the hybrid mining scheme, you may as well not bother with hybrid mining because miners can simply
switch between them.

In practice, no set of algorithms is genuinely independent. The best we can do is try to choose algorithms that work best
on CPUs, GPUs, and ASICs. In truth, the distinction between GPUs and ASICs is only a matter of time. Any "GPU-friendly"
algorithm is ASIC-friendly, too; it's just a case of whether the capital outlay for fabricating them is worth it, and
this will eventually become true for any algorithm that supplies PoW for a growing market cap.

With this in mind, we should only choose one GPU/ASIC algorithm and one for CPUs. 

An excellent technical choice would be merge mining with Monero using RandomX as a CPU-only algorithm and SHA3, also known as Keccak
, for a GPU/ASIC-friendly algorithm. Using a custom configuration of such a simple and well-understood algorithm means there is 
a low likelihood of unforeseen optimizations that will give a single miner a considerable advantage. It also means that it stands a 
good chance of being "commoditized" when ASICs are eventually manufactured. This means that SHA3 ASICs will be widely available 
and not available from only a single supplier.

### The block distribution

As discussed earlier, close to a 50/50 distribution is needed to reduce the chance of hash rate attacks. However,
sufficient buy-in is required, especially with regard to merge mining RandomX with Monero. To make it worthwhile for a
Monero pool operator to merge mine Tari, but still, guard against hash rate attacks and to be inclusive of independent
Tari supporters and enthusiasts, a 60/40 split is proposed in favor of merge mining RandomX with Monero. The
approaching [Monero tail emission](https://web.getmonero.org/resources/moneropedia/tail-emission.html) at the end of May
2022 should also make this a worthwhile proposal for Monero pool operators.

### The difficulty adjustment strategy

The choice of difficulty adjustment algorithm is important. In typical hybrid mining strategies, each algorithm operates
completely independently with a scaled-up target block time and is the most likely approach that any blockchain will
take. Tari testnet has been running very successfully on Linear Weighted Moving Average (LWMA) from Bitcoin & Zcash
Clones [version 2018-11-27](https://github.com/zawy12/difficulty-algorithms/issues/3#issuecomment-442129791). This LWMA
difficulty adjustment algorithm has also been
[tested in simulations](https://github.com/tari-labs/modelling/tree/master/scenarios/multi_pow_01), and it proved to be a good choice in the multi-PoW scene as well.

### Final proposal, hybrid mining details

The final proposal is summarized below:

- 2x mining algorithms, with an average combined target block time of 120 s, to match Monero's block interval
- LWMA version 2018-11-27 difficulty algorithm adjustment for both with difficulty algorithim window of 90 blocks

### Tari mining hash

Tari will use a mining hash that is hashed with a 256bit Blake2b hash constructed from the Tari blockheader. 
The hash MUST be constructed with the following encoded with [consensus encoding](RFC-0121_ConsensusEncoding), in order:
- version
- previous header hash
- timestamp
- input Merkle root
- output Merkle root
- output Merkle mountain range size
- witness Merkle root
- kernel Merkle root
- kernel Merkle mountain range size
- total kernel offset
- total script offset

#### RandomX

This will be merge mined with Monero and MUST follow all Monero consensus rules with the following for Tari. 
The Monero coinbase transaction MUST contain the Tari mining hash in the extra field.

Tari also imposes the following consensus rules:
- The `seed_hash` MUST only be used for 3000 blocks, after which a block MUST be discarded if it's used again.
- The little-endian difficulty MUST be equal to or greater than the target for that block as determined by the LWMA for Tari.
- The LWMA MUST use a target time of 200 seconds.
- MUST set the header field PoW:pow_algo as 0 for a Monero block
- MUST encode the following data into the Pow:Pow_data field:
  - Monero BlockHeader,
  - RandomX VM key,
  - Monero transaction count,
  - Monero merkle root,
  - Monero coinbase merkle proof and,
  - Monero coinbase transaction

#### Sha3

The Sha3 mining hash is constructed as a Sha3-256 with the following fields:
 - Nonce
 - Tari mining hash
 - Pow data

For the Sha3 difficulty, the Sha3 mining hash is hashed with Sha3-256. 

Tari imposes the following consensus rules:
- The Big endian difficulty MUST be equal or greater than the target for that block as determined by the LWMA for Tari.
- MUST set the header field PoW:pow_algo as 1 for a Sha block.
- The LWMA MUST use a target time of 300 seconds.
