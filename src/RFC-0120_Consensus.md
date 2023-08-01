# RFC-0120/Consensus

## Base Layer Consensus

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77), [Stanley Bondi](https://github.com/sdbondi) and [SW van heerden](https://github.com/SWvheerden)

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

The aim of this Request for Comment (RFC) is to describe the fields that a block should contain as well as all consensus rules that will determine the validity of a block.

## Related Requests for Comment

* [RFC-0122: Burn outputs](RFC-0122_Burning.md)
* [RFC-0130: Mining](RFCD-0130_Mining.md)
* [RFC-0140: SyncAndSeeding](RFC-0140_Syncing_and_seeding.md)

## Description

Blockchain consensus is a set of rules that a majority of nodes agree on that determines the state of the blockchain. 

This RFC details the consensus rules for the Tari network. 

### Blocks
[Blocks]: #blocks "Block consensus"

Every [block] MUST:

* have _exactly one_ valid [block header], as per the [Block Headers] section
* have _exactly one_ [coinbase] transaction
* have a total [transaction weight] less than the consensus maximum
* be able to calculate matching Merkle roots ([kernel_mr], [output_mr], [witness_mr], and [input_mr]) 
* each [transaction input] MUST: 
  * be of an allowed [transaction input] version
  * spend an existing valid [UTXO] with a maturity less than the current block height
  * satisfy the [covenant] attached to the [UTXO]
  * have a valid [script signature]
  * be in a canonical order (see [Transaction ordering])
* each [transaction output] MUST:
  * be of an allowed [transaction output] version
  * have a unique domain separated hash (`version || features || commitment || script || covenant || encrypted_values`) with the domain (`transaction_output`)
  * have a unique commitment in the current [UTXO] set
  * be in a canonical order (see [Transaction ordering])
  * have a valid [range proof]
  * have a valid [metadata signature]
  * contain only allowed opcodes in the script
* each [transaction kernel] MUST 
  * have a valid kernel excess signature
  * have a unique excess
* have a valid total script offset, \\( \gamma \\), see [script-offset].
* the number of `BURNED` outputs MUST equal the number of `BURNED_KERNEL` kernels exactly,
* the commitment values of each burnt output MUST match the commitment value of each corresponding `BURNED_KERNEL` exactly.
* the transaction commitments and kernels MUST balance, as follows:

  $$
  \begin{align}
  &\sum_i\mathrm{Cout_{i}} - \sum_j\mathrm{Cin_{j}} + \text{fees} \cdot H \stackrel{?}{=} \sum_k\mathrm{K_k} + \text{offset} \\\\
  & \text{for each output}, i, \\\\
  & \text{for each input}, j, \\\\
  & \text{for each kernel excess}, k \\\\
  & \text{and }\textit{offset }\text{is the total kernel offset} \\\\
  \end{align}
  \tag{1}
  $$


If a [block] does not conform to the above, the block SHOULD be discarded and MAY ban the peer that sent it.

#### Coinbase
[coinbase]: #coinbase "Coinbase consensus"

A coinbase transaction contained in a block MUST:

* be the only transaction in the block with the coinbase flag
* consist of exactly one output and one kernel (no input)
* have a valid kernel signature
* have a value exactly equal to the emission at the block height it was minted (see [emission schedule]) 
  plus the total transaction fees within the block
* have a lock-height as per consensus
* can not have a offset except 0
* can not have a script offset except 0
  
A coinbase transaction contained in a block CAN:
* include any arbitrary 64 bytes of extra data, [coinbase-extra]

### Block Headers
[block headers]: #block-headers "Block headers"

Every [block header] MUST contain the following fields:

* version;
* height;
* prev_hash;
* timestamp;
* output_mr;
* output_mmr_size;
* input_mr;
* witness_mr;
* kernel_mr;
* kernel_mmr_size;
* total_kernel_offset;
* script_kernel_offset;
* nonce;
* pow.

The [block header] MUST conform to the following:

* The nonce and [PoW](#pow) must be valid for the [block header].
* The [achieved difficulty] MUST be greater than or equal to the [target difficulty].
* The [FTL] and [MTP] rules, detailed below.
* The block hash must not appear in the bad block list.
  
The Merkle roots are validated as part of the full block validation, detailed in [Blocks].

If the [block header] does not conform to any of the above, the [block] SHOULD be rejected and MAY ban the peer that
sent it.

#### Version

This is the version currently running on the chain.

The version MUST conform to the following:

* It is represented as an unsigned 16-bit integer.
* Version numbers MUST be incremented whenever there is a change in the blockchain schema or validation rules starting from 0.
* The version must be one of the allowed versions for the consensus rules at this block's height.

#### Height

A counter indicating how many blocks have passed since the genesis block (inclusive).

The height MUST conform to the following:

* Represented as an unsigned 64-bit integer.
* The height MUST be exactly one more than the block referenced in the `prev_hash` block header field.
* The genesis block MUST have a height of 0.

#### Prev_hash

This is the hash of the previous block's header.

The prev_hash MUST conform to the following:

* represented as an array of unsigned 8-bit integers (bytes) in little-endian format.
* MUST be a hash of the entire contents of the previous block's header using the domain (`block_header`).

#### Timestamp

This is the timestamp at which the block was mined.

The timestamp MUST conform to the following:

* Must be transmitted as UNIX timestamp.
* MUST be less than [FTL].
* MUST be higher than the [MTP].

#### Output_mr
[output_mr]: #output_mr "Output Merkle root"

The `output_mr` MUST be calculated as follows: Hash (`TXO MMR root`  || Hash(`spent TXO bitmap`)).

The `TXO MMR root` is the MMR root that commits to every [transaction output] that has ever existed since 
the genesis [block]. 

The `spent TXO bitmap` is a compact serialized [roaring bitmap] containing all the output MMR leaf indexes 
of all the outputs that have ever been spent. 

The output_mr MUST conform to the following:

* Represented as an array of unsigned 8-bit integers (bytes) in little-endian format.
* The hashing function used MUST be blake2b with a 256-bit digest.

#### Output_mmr_size

This is the total size of the leaves in the output Merkle mountain range.

The Output_mmr_size MUST conform to the following:

* Represented as a single unsigned 64-bit integer.

#### Input_mr
[input_mr]: #input_mr "Input Merkle root"

This is the Merkle root of all the inputs in the block, which consists of the hashed inputs. It is used to prove that 
all inputs are correct and not changed after mining. This MUST be constructed by adding, in order, the hash of every 
input contained in the block. 

The input_mr MUST conform to the following:

* Represented as an array of unsigned 8-bit integers (bytes) in little-endian format.
* The hashing function must be blake2b with a 256-bit digest.

#### Witness_mr
[witness_mr]: #witness_mr "Witness Merkle root"

This is the Merkle root of the output witness data, specifically all created outputs’ [range proof]s and 
metadata signatures. This MUST be constructed by 
Hash ( `RangeProof` || `metadata commitment signature`), in order, for every output contained in the block.

The witness_mr MUST conform to the following:

* Represented as an array of unsigned 8-bit integers (bytes) in little-endian format.
* The hashing function used must be blake2b with a 256-bit digest.

#### Kernel_mr
[kernel_mr]: #kernel_mr "Kernel Merkle root"

This is the Merkle root of the kernels.

The kernel_mr MUST conform to the following:

* Must be transmitted as an array of unsigned 8-bit integers (bytes) in little-endian format.
* The hashing function used must be blake2b with a 256-bit digest.

#### Kernel_mmr_size

This is the total size of the leaves in the kernel Merkle mountain range.

The Kernel_mmr_size MUST conform to the following:

* Represented as a single unsigned 64-bit integer.

#### Total_kernel_offset

This is the total summed offset of all the transactions in this block.

The total_kernel_offset MUST conform to the following:

* Must be transmitted as an array of unsigned 8-bit integers (bytes) in little-endian format

#### Total_script_offset

This is the total summed script offset of all the transactions in this block.

The total_script_offset MUST conform to the following:

* Must be transmitted as an array of unsigned 8-bit integers (bytes) in little-endian format

#### Nonce

This is the nonce used in solving the Proof of Work.

The nonce MUST conform to the following:

* MUST be transmitted as an unsigned 64-bit integer;
* for RandomX blocks, thus MUST be 0

#### PoW

This is the Proof of Work algorithm used to solve the Proof of Work. This is used in conjunction with the Nonce.

The [PoW] MUST contain the following:

* pow_algo as an enum (0 for RandomX, 1 for Sha3x).
* pow_data for RandomX blocks as an array of unsigned 8-bit integers (bytes) in little-endian format, containing the RandomX merge-mining Proof-of-Work data.
  * the RandomX seed, stored as `randomx_key` within the RandomX block, must have not been first seen in a block with confirmations more than `max_randomx_seed_height`.
* pow_data for Sha3x blocks MUST be empty.

#### Difficulty Calculation
[target difficulty]: #target-difficulty "Target Difficulty"

The target difficulty represents how difficult it is to mine a given block. This difficulty is not fixed and needs to
constantly adjust to changing network hash rates. 

The difficulty adjustment MUST be calculated using a linear-weighted moving average (LWMA) algorithm (2)
$$
\newcommand{\solvetime}{ \mathrm{ST_i} }
\newcommand{\solvetimemax}{ \mathrm{ST_{max}} }
$$

| Symbol                 	| Value                   | Description                                                                                                         |
|-------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------|
| N                       | 90                      | Target difficulty block window                                                                                      |
| T                       | SHA3x: 300 RandomX: 200   | Target block time in seconds.  The value used depends on the  PoW algorithm being used.                             |
| \\( \solvetimemax \\)   | SHA3x: 1800 RandomX: 1200 | Maximum solve time.  This is six times the target time  of the current PoW algorithm.                                 |
| \\( \solvetime \\)    	| variable                | The timestamp difference in seconds between  block _i_ and _i - 1_ where \\( 1 \le \solvetime \le \solvetimemax \\) |
| \\( \mathrm{D_{avg}} \\)| variable                | The average difficulty of the last _N_ blocks                                                                       |

$$
\begin{align}
& \textit{weighted_solve_time} = \sum\limits_{i=1}^N(\solvetime*i)  \\\\
& \textit{weighted_target_time} = (\sum\limits_{i=1}^Ni) * \mathrm{T} \\\\
& \textit{difficulty} = \mathrm{D_{avg}} * \frac{\textit{weighted_target_time}}{\textit{weighted_solve_time}}\\\\
\end{align}
\tag{2}
$$

It is important to note that the two proof of work algorithms are calculated _independently_. i.e., if the current block uses _SHA3x_ proof of work, the block window and solve times only include _SHA3x_ blocks and vice versa.

### FTL
[FTL]: #ftl "Future Time Limit"

The Future Time Limit. This is how far into the future a time is accepted as a valid time. Any time that is more than the FTL is rejected until such a time that it is not more than the FTL.
The FTL is calculated as (T*N)/20 with T and N defined as:
T: Target time - This is the ideal time that should pass between blocks that have been mined.
N: Block window - This is the number of blocks used when calculating difficulty adjustments.

### MTP
[MTP]: #mtp "Median Time Passed"

The Median Time Passed (MTP) is the lower bound calculated by taking the median average timestamp of the 
last _N_ blocks. Any block with a timestamp that is less than MTP will be rejected.

### Total accumulated proof of work

This is defined as the total accumulated proof of work done on the blockchain. Tari uses two _independent_ proof of work algorithms 
rated at different difficulties. To compare them, we simply multiply them together into one number:
$$
\begin{align}
 \textit{accumulated_randomx_difficulty} * \textit{accumulated_sha3x_difficulty} 
\end{align}
\tag{3}
$$
This value is used to compare chain tips to determine the strongest chain.

### Transaction Ordering
[Transaction ordering]: #transaction-ordering "Canonical Transaction Ordering"

The order in which transaction inputs, outputs, and kernels are added to the Merkle mountain range completely changes the
final Merkle root. Input, output, and kernel ordering within a block is, therefore, part of the consensus. 

The block MUST be transmitted in canonical ordering. The advantage of this approach is that sorting does not need to be 
done by the whole network, and verification of sorting is exceptionally cheap.

- Transaction outputs are sorted lexicographically by the byte representation of their Pedersen commitment i.e. ( \\(k \cdot G + v \cdot H\\) ).
- Transaction kernels are sorted lexicographically by the excess signature byte representation.
- Transaction inputs are sorted lexicographically by the hash of the output that is spent by the input.

# Change Log

| Date        | Change              | Author    |
|:------------|:--------------------|:----------|
| 11 Oct 2022 | First stable        | SWvHeerden|
| 13 Mar 2023 | Add mention of coinbase extra        | SWvHeerden|
| 05 Jun 2023 | Add coinbase excess rule       | SWvHeerden|
| 01 Aug 2023 | Add Randomx rule, fix Sha and Monero names       | SWvHeerden|



[block]: Glossary.md#block
[coinbase-extra]:  Glossary.md#coinbase-extra
[block header]: Glossary.md#block-header
[transaction input]: Glossary.md#transaction
[transaction output]: Glossary.md#unspent-transaction-outputs
[transaction kernel]: Glossary.md#transaction-kernel
[transaction weight]: Glossary.md#transaction-weight
[metadata signature]: Glossary.md#metadata-signature
[script signature]: Glossary.md#script-signature
[utxo]: Glossary.md#unspent-transaction-outputs
[range proof]: Glossary.md#range-proof
[cut-through]: Glossary.md#cut-through
[emission schedule]: Glossary.md#emission-schedule
[roaring bitmap]: https://github.com/RoaringBitmap/RoaringFormatSpec
[Ristretto]: https://docs.rs/curve25519-dalek/3.1.0/curve25519_dalek/ristretto/index.html
[FTL]: RFC-0120_Consensus.md#FTL
[MTP]: RFC-0120_Consensus.md#MTP
[script-offset]: Glossary.md#script-offset
[covenant]: RFC-0250_Covenants.md
