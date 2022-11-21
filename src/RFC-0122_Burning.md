# RFC-0260/Burning

## Consensus-level burn transactions

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77), [stringhandler](https://github.com/stringhandler) and [SW van heerden](https://github.com/SWvheerden) 

<!-- TOC -->
* [Goals](#goals)
* [Related Requests for Comment](#related-requests-for-comment)
* [Description](#description)
* [Introduction](#introduction)
    * [TL;DR](#tldr)
    * [Transaction output changes](#transaction-output-changes)
    * [Kernel changes](#kernel-changes)
    * [Consensus rules changes](#consensus-rules-changes)
    * [Chain balance equation changes](#chain-balance-equation-changes)
<!-- TOC -->


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

* [RFC-0120: Consensus](RFC-0120_Consensus.md)

## Description

Blockchains have used the burn method to destroy coins in circulation and block their use forever. Most chains use a reclaimable address
to denote burned coins. Using [RFC-0201: TariScript](RFC-0201_TariScript.md), Tari can also use this method, but this does not explicitly
remove the coins from circulation. This RFC details a method to remove coins from circulation permanently.

An excellent example of using burned coins is for a [Perpetual One-way Peg](https://medium.com/@RubenSomsen/21-million-bitcoins-to-rule-all-sidechains-the-perpetual-one-way-peg-96cb2f8ac302) this allows users 
create utility tokens on a sidechain or in Tari's case the DAN. By not allowing funds to be moved back, the sidechain gains an auditable total utilitarian value
. Value speculation is largely removed as the sidechain will only ever be as valuable as value of coins burnet in the peg.


## Introduction

To completely remove coins from circulation, we need to mark outputs as burned, and we need to change the balance equation to
allow pruned nodes and non pruned nodes to still verify the integrity and emission of Tari.

### TL;DR
In order to get burns working, we flag each desired output as burned with a flag. To calculate the emission of the network, we need
to store the commitment of the burned output in a kernel. This will allow any pruned node to verify the emission of the network and all burned outputs. 

### Transaction output changes

Each transaction output has a field called [OutputFeatures](https://github.com/tari-project/tari/blob/f7f913c873c9f5d373f99149e52c26a0dd32f03f/base_layer/core/src/transactions/transaction_components/output_features.rs#L62) that tracks the unique properties of each output. 
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

### Kernel changes

Currently, each transaction has to have one or more kernels, [TransactionKernel](https://github.com/tari-project/tari/blob/2ca06724f0ab7c63eb0b6caab563372f353f4348/base_layer/core/src/transactions/transaction_components/transaction_kernel.rs#L53). This tracks details such as the balance proof of each transaction as well as other information essential for the transaction consensus. Here we add an Optional field to track burned commitments.
For each burned output, we need to have a kernel where the burned output's commitment is stored. 

```rust,ignore
pub struct TransactionKernel {
    pub version: TransactionKernelVersion,
    /// Options for a kernel's structure or use
    pub features: KernelFeatures,
    /// Fee originally included in the transaction this proof is for.
    pub fee: MicroTari,
    /// This kernel is not valid earlier than lock_height blocks
    /// The max lock_height of all *inputs* to this transaction
    pub lock_height: u64,
    /// Remainder of the sum of all transaction commitments (minus an offset). If the transaction is well-formed,
    /// amounts plus fee will sum to zero, and the excess is hence a valid public key.
    pub excess: Commitment,
    /// An aggregated signature of the metadata in this kernel, signed by the individual excess values and the offset
    /// excess of the sender.
    pub excess_sig: Signature,
    /// This is an optional field that must be set if the transaction contains a burned output.
    pub burn_commitment: Option<Commitment>,

}
```
Each kernel also has a field called [KernelFeatures](https://github.com/tari-project/tari/blob/2ca06724f0ab7c63eb0b6caab563372f353f4348/base_layer/core/src/transactions/transaction_components/kernel_features.rs#L36) that defines the properties of the kernel. The feature set needs to be expanded to include a burn type.
Inside this field, we track every possible type of output. We need to add another type here called `BURNED_KERNEL`. 

```rust,ignore
pub struct KernelFeatures: u8 {
        /// Coinbase transaction
        const COINBASE_KERNEL = 1u8;
        /// Burned output
        const BURNED_KERNEL = 2u8;
    }
```

For each burned output in a transaction, there needs to be a kernel. This means that if a transaction has two burned outputs, it needs at least two kernels. 
This stops a node from publishing an aggregated inflated commitment in the kernel. 



### Consensus rules changes

When a block or transaction is received with a burned output, there:
* the number of `BURNED` outputs MUST equal the number of `BURNED_KERNEL` kernels exactly,
* the commitment values of each burnt output MUST match the commitment value of each corresponding `BURNED_KERNEL` exactly.

### Chain balance equation changes 

Currently, when checking the total chain emission, the following equation must hold:
$$
\begin{align}
&\sum_i\mathrm{C_{i}} \stackrel{?}{=} E_l \cdot H + \sum_k\mathrm{K_k} + \text{offset}\\\\
& \text{for each unspent output}, i, \\\\
& \text{for each kernel excess}, k \\\\
& \textit{offset }\text{is the total kernel offset} \\\\
& \text{and }E_l\text{ is total emission up to block } l\\\\
\end{align}
\tag{1}
$$

To include burnt outputs in the balance, we can immediately mark burnt outputs as spent (and thus allow them to be pruned), and introduce the additional requirement of tracking the total sum of all burnt output commitments.

This sum is easily verified by summing all `BURNED_KERNEL` commitments in the blockchain history. These are available to all nodes since the kernels are never pruned.

The balance equation then becomes
$$
\begin{align}
&\sum_i\mathrm{C_{i}} \stackrel{?}{=} E \cdot H + \sum_k\mathrm{K_k} + \text{offset} - \sum_m\mathrm{Cburn_{m}}\\\\
& \text{for each unspent output}, i, \\\\
& \text{for each burned output}, m, \\\\
& \text{for each kernel excess}, k \\\\
& \textit{offset }\text{is the total kernel offset} \\\\
& \text{and }E_l\text{ is total emission up to block } l\\\\
\end{align}
\tag{2}
$$

When verifying total chain emission, equation (2) MUST hold.



[block]: Glossary.md#block
[block header]: Glossary.md#block-header
[transaction input]: Glossary.md#transaction
[transaction output]: Glossary.md#unspent-transaction-outputs
[transaction weight]: Glossary.md#transaction-weight
[metadata signature]: Glossary.md#metadata-signature
[utxo]: Glossary.md#unspent-transaction-outputs
[emission schedule]: Glossary.md#emission-schedule
