# RFC-0122/Burning

## Base Layer Consensus

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77), [stringhandler](https://github.com/stringhandler) and [SW van heerden](https://github.com/SWvheerden) 

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

The aim of this Request for Comment (RFC) is to describe the process of Burning UTXOs and to track the amount burned. 

## Related Requests for Comment

* [RFC-0100: Base Layer](RFC-0100_BaseLayer.md)
* [RFC-0120: Consensus](RFC-0120_Consensus.md)

## Description

Blockchains have used the burn method to destroy coins in circulation and block their use forever. Most chains use a reclaimable address
to denote burned coins. Using [RFC-0201: TariScript](RFC-0201_TariScript.md), Tari can also use this method, but this does not explicitly
remove the coins from circulation. This RFC details a method to remove coins from circulation permanently.


## Introduction

To completely remove coins from circulation, we need to mark outputs as burned, and we need to change the balance equation to
allow pruned nodes and non pruned nodes to still verify the integrity and emission of Tari.

### Transaction output changes

Currently, each transaction output has a field called [OutputFeatures] that tracks the unique properties of each output. 
Inside this field, we track every possible type of output. We need to add another type here called burned. 

```rust,ignore
pub enum OutputType {
    /// An standard non-coinbase output.
    Standard = 0,
    /// Output is a coinbase output, must not be spent until maturity.
    Coinbase = 1,
    /// This output is burned and may never be used as a transaction input.
    Burned = 2,
}
```

### Blockheader changes

On the header of each block, we need to add a field for tracking the sum of all burned outputs on that block.

```rust,ignore
pub struct BlockHeader {
    /// Version of the block
    pub version: u16,
    ...
    /// Sum of kernel offsets for all kernels in this block.
    pub total_kernel_offset: BlindingFactor,
    /// Sum of script offsets for all kernels in this block.
    pub total_script_offset: BlindingFactor,
    /// Sum of all burned output commitments in this block.
    pub burned_total: Commitment,
    /// Nonce increment used to mine this block.
    pub nonce: u64,
    /// Proof of work summary
    pub pow: ProofOfWork,
}
```

This field must contain the sum of all the commitments of all outputs in the block marked as spent. 

$$
\begin{align}
burned\_total = \sum_j\mathrm{C_{j}}  \\\\
\text{for burned output}, i, \\\\
\end{align}
\tag{1}
$$

### Creation of burned output

When creating the output, we need to be able to generate a Proof of Burn for the burned output. 
In the header, we already commit to each and every [UTXO] ever created. There already is a proof of the existence
for this burned output, but this proof is only to the complete output and not just the commitment. 

To get around this, we enforce default values for most of the output except the version and commitment field. 

And the output, when burned, MUST have the following field values
* Empty script,
* Empty covenant,
* and empty encrypted_value.

The OutputFeatures MUST be set to the following values:
* output_type must be set to Burned,
* maturity must be 0,
* metadata must be empty
* and sidechain_features must be empty.

If any of these are not set correctly for a burned output, the output should be dropped as an invalid transaction. 

### Block propagation consensus rules changes

When a block is received, a base node will typically check the following equation to ensure that the emission is correct:
$$
\begin{align}
&\sum_i\mathrm{Cout_{i}} - \sum_j\mathrm{Cin_{j}} + \text{fees} \cdot H - \sum_k\mathrm{K_k} - \text{offset} \stackrel{?}{=}  V_l\cdot H\\\\
& \text{for each output}, i, \\\\
& \text{for each input}, j, \\\\
& \text{for each kernel excess}, k \\\\
& \textit{offset }\text{is the total kernel offset} \\\\
& \text{and }V_l \text{ is the block reward for block } l\\\\
\end{align}
\tag{2}
$$

This equation need to be modified to allow checking the burned number as well, so we change it to:
$$
\begin{align}
&\sum_i\mathrm{Cout_{i}} + \sum_m\mathrm{Cburn_{m}} - \sum_j\mathrm{Cin_{j}} + \text{fees} \cdot H - \sum_k\mathrm{K_k} - \text{offset} \stackrel{?}{=}  V_l\cdot H\\\\
& \text{for each output}, i, \\\\
& \text{for each burned output}, m, \\\\
& \text{for each input}, j, \\\\
& \text{for each kernel excess}, k \\\\
& \textit{offset }\text{is the total kernel offset} \\\\
& \text{and }V_l \text{ is the block reward for block } l\\\\
\end{align}
\tag{3}
$$

We make the following additions to the consensus rules that block propagation must be checked.

When a node receives a block with the node:
* MUST for each output marked as burned, flag that output as spent immediately upon inserting it as an unspent output. 
* MUST check that Equation (1) holds.
* MUST check that Equation (3) holds.


### Chain balance equation changes 

When checking the total chain emission, the following equation must hold:
$$
\begin{align}
&\sum_i\mathrm{C_{i}} \stackrel{?}{=} E_l \cdot H + \sum_k\mathrm{K_k} + \text{offset}\\\\
& \text{for each unspent output}, i, \\\\
& \text{for each kernel excess}, k \\\\
& \textit{offset }\text{is the total kernel offset} \\\\
& \text{and }E_l\text{ is total emission up to block } l\\\\
\end{align}
\tag{4}
$$


$$
\begin{align}
&\sum_i\mathrm{C_{i}} \stackrel{?}{=} E \cdot H + \sum_k\mathrm{K_k} + \text{offset} - \sum_m\mathrm{Cburn_{m}}\\\\
& \text{for each unspent output}, i, \\\\
& \text{for each burned output}, m, \\\\
& \text{for each kernel excess}, k \\\\
& \textit{offset }\text{is the total kernel offset} \\\\
& \text{and }E_l\text{ is total emission up to block } l\\\\
\end{align}
\tag{5}
$$

When verifying total chain emission, equation (5) MUST hold.


### Option 2 for Proof of burn

If we don't want to look into the output MMR, we can include a second MMR root and size counter to the header to track the commitment. 

```rust,ignore
pub struct BlockHeader {
    /// Version of the block
    pub version: u16,
    ...
    /// Sum of kernel offsets for all kernels in this block.
    pub total_kernel_offset: BlindingFactor,
    /// Sum of script offsets for all kernels in this block.
    pub total_script_offset: BlindingFactor,
    /// Sum of all burned output commitments in this block.
    pub burned_total: Commitment,
    /// Merkle root of the burned MMR tree at this block height
    pub burned_mr;
    /// Size of the burned MMR tree at this height. 
    pub burned_mmr_size;
    /// Nonce increment used to mine this block.
    pub nonce: u64,
    /// Proof of work summary
    pub pow: ProofOfWork,
}
```

[burned_mr]: #burned_mr "Burned Merkle root"

This is the Merkle root of the burned outputs.

The kernel_mr MUST conform to the following:

* Must be transmitted as an array of unsigned 8-bit integers (bytes) in little-endian format.
* The hashing function used must be blake2b with a 256-bit digest.


This will allow users to construct a proof of burn to any block height of a burned output.


[block]: Glossary.md#block
[block header]: Glossary.md#block-header
[transaction input]: Glossary.md#transaction
[transaction output]: Glossary.md#unspent-transaction-outputs
[transaction weight]: Glossary.md#transaction-weight
[metadata signature]: Glossary.md#metadata-signature
[utxo]: Glossary.md#unspent-transaction-outputs
[emission schedule]: Glossary.md#emission-schedule


