# RFC-0131/Mining

## Full-node Mining on Tari Base Layer

![status: stable](theme/images/status-stable.svg)

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
good chance of being "commoditized" when ASICs are eventually manufactured. This would mean that SHA3 ASICs are widely available from multiple suppliers.

### The block distribution

A 50/50 split in hash rate among algorithms minimises the chance of hash rate attacks. However,
sufficient buy-in is required, especially with regard to merge mining RandomX with Monero. To make it worthwhile for a
Monero pool operator to merge mine Tari, but still guard against hash rate attacks and to be inclusive of independent
Tari supporters and enthusiasts, a 60/40 split is employed in favour of merge mining RandomX with Monero.

### The difficulty adjustment strategy

The choice of difficulty adjustment algorithm is important. In typical hybrid mining strategies, each algorithm operates
completely independently with a scaled target block time. 
Tari testnet has been running very successfully using the  Linear Weighted Moving Average (LWMA) from Bitcoin & Zcash
Clones [version 2018-11-27](https://github.com/zawy12/difficulty-algorithms/issues/3#issuecomment-442129791). This LWMA
difficulty adjustment algorithm has also been
[tested in simulations](https://github.com/tari-labs/modelling/tree/master/scenarios/multi_pow_01), 
and it proved to be a good choice in the multi-PoW scene as well.

### Final proposal, hybrid mining details

Tari's proof-of-work mining algorithm is summarized below:

- Two mining algorithms, with an average combined target block time of 120 s, to match Monero's block interval.
- A log-weighted moving average difficulty adjustment algorithm using a window of 90 blocks.

### Tari mining hash

First, the block header is hashed with the 256-bit Blake2b hashing algorithm based using the approach described in
[consensus encoding](RFC-0121_ConsensusEncoding). The fields are hashed in the order:
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

This hash is used in both the SHA-3 and RandomX proof-of-work algorithms. The header version for the Tari Genesis 
block is 1.

#### RandomX

Monero blocks that are merge-mining Tari MUST include the Tari mining hash in the extra field of the Monero coinbase transaction.

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

#### Sha-3x

Tari's independent proof-of-work algorithm is very straightforward.

Calculate the _triple hash_ of the following input data:
 - Nonce (8 bytes)
 - Tari mining hash (32 bytes)
 - PoW record (for Sha-3x, this is always a single byte of value 1)

That is, the nonce in little-endian format, mining hash and the PoW record are chained together and hashed by the 
Keccak Sha3-256 algorithm. The result is hashed again, and this result is hashed a third time. The result of the third 
hash is compared to the target value of the current block difficulty. 

If the entire 64-bit nonce space is exhausted without finding a valid block, the mining algorithm must request a new 
Tari mining hash from the Tari base node. The simplest way to do this is to update the timestamp field in the block 
header, keeping everything else constant.

Tari imposes the following consensus rules:
- The Big endian difficulty MUST be equal or greater than the target difficulty for that block as determined by the 
  LWMA for Tari. The difficulty and target are related by the equation `difficulty = (2^256 - 1) / target`.
- MUST set the header field PoW:pow_algo as 1 for a Sha block.
- The PoW:pow_data field is empty
- The LWMA MUST use a target time of 300 seconds.

A triple hash is selected to keep the requirements on hardware miners (FPGAs, ASICs) fairly low. But we also want to 
avoid making the proof-of-work immediately "NiceHashable". There are several coins that already use a single or 
double SHA3 hash, and we'd like to avoid having that hashrate immediately deployable against Tari.

Historical note: In general, little-endian representations for integers are used in Tari. There are a few places 
where big-endian representations are used, in the PoW hash and in some merge-mined fields in particular. The 
latter is required to be compatible with the Monero specification. But we also use the big-endian representation for 
the block hash due to a historical convention. The Bitcoin white paper describes the block hash target as 
containing "a certain number of leading zeros" (paraphrased). This is obviously a big-endian representation. If we 
used little-endian, our block hashes would have trailing zeroes. So we use the big-endian form to satisfy the 
expected in block explorers and such that block hashes should always start with a series of zeroes.    

# Stabilisation note

This RFC is stable as of PR#4862
# Change Log

| Date         | Change                   | Author     |
|:-------------|:-------------------------|:-----------|
| 2022-11-26   | Finalise SHA-3 algorithm | CjS77      |
| 2022-10-11   | First outline            | SWvHeerden |
