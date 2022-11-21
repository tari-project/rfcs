# RFC-0303/DanOverview

## Digital Assets Network

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77),[S W van Heerden](https://github.com/SWvheerden)

<!-- TOC -->
  * [Goals](#goals)
  * [Related Requests for Comment](#related-requests-for-comment)
  * [Description](#description)
  * [Key actors](#key-actors)
  * [The Tari Base Layer](#the-tari-base-layer)
    * [Templates](#templates)
    * [Contracts](#contracts)
    * [Validator Nodes](#validator-nodes)
    * [DAN consensus layer](#dan-consensus-layer)
    * [The Tari Virtual Machine](#the-tari-virtual-machine)
    * [Thaums and the turbine model](#thaums-and-the-turbine-model)
* [Change Log](#change-log)
<!-- TOC -->

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

The aim of this Request for Comment (RFC) is to describe the key elements of the Tari second layer, also known as the 
Digital Assets Network (DAN).

## Related Requests for Comment

* [RFC-0111: Base Node Architecture](./RFC-0111_BaseNodeArchitecture.md)

## Description

The Tari DAN is based on a sharded BFT consensus mechanism called [Cerberus](https://arxiv.org/abs/2008.04450). 

One particular note is that Tari has chosen Hotstuff as the base BFT consensus algorithm over pBFT mentioned in the paper.

The core idea of Cerberus is that instead of dividing work up between validator nodes according to the contracts 
they are managing (as per Tari DANv1, Polkadot, Avalanche, etc.), Cerberus distributes nodes evenly over a set of 
shard addresses. Any time an instruction modifies the state of a contract, it will affect one or more shard 
addresses, and only those nodes that are responsible for covering those addresses will reach consensus on the correct 
state changes.

This means that nodes have to be prepared to execute instructions on any contract in the network. This 
does create a data synchronisation burden, but the added benefit of a highly scalable, decentralised DAN significantly 
outweighs this trade-off.

## Key actors

There are several components on both the DAN and base layer that interoperate to collectively enable scalable 
smart contracts on Tari.

These components include:
* Tari base layer - Enforces Tari monetary policy and plays the role of global registrar.
* Templates - Reusable smart contract components.
* Contracts - Self-contained pieces of code that describe the behaviour of a smart contract. They are compiled and 
  executed in the Tari VM.
* Validator Nodes - VNs validate smart contracts and earn fees for doing so.
* Cerberus consensus engine - highly scalable, high-speed sharded BFT consensus engine.
* Tari Virtual Machine - Runs smart contracts in a secure sandbox.
* Thaums - the unit of magic that fuels the Tari DAN.

The remainder of this document describes these elements in a little more detail and how they relate to each other.

## The Tari Base Layer

Obviously, the most important role of the Tari base layer is to issue and secure the base Tari token.
As it relates to the DAN, the base layer also serves as an immutable global registry for several key pieces of data:
* It maintains the register of all validator nodes.
* It provides the only means of minting more [Thaum]s into the DAN economy.
* It maintains the register of all DAN contract templates.

The base layer also forces the DAN to make progress in the case of a Byzantine stoppage.

### Templates

Templates are parameterised smart contracts. Templates are intended to be well-tested, secure, reusable components 
for building and running smart contracts on the DAN.

For example, an NFT template would allow a user to populate a few fields, such as name, number of tokens, media 
locations, and then launch a new NFT series without having to write any actual code.

Templates are stored and managed on the base layer. You can think of the Tari base layer as a type of _git_ for 
smart contracts. Templates will also have version control features and a smooth upgrade path for existing contracts.

### Contracts

Tari smart contracts are the meat of the DAN ecosystem. Usually a smart contract will be comprised of one or more 
Tari templates, glue code, and initialisation code.

The contracts are always executed in the Tari Virtual machines. The input and output of every contract instruction 
is validated by validator nodes that reach consensus using the Cerberus consensus engine.

### Validator Nodes

Validator Nodes (VNs) execute and reach consensus on DAN contract instructions. VNs must register on the base layer 
and lock up funds (the registration deposit) in order to participate in the DAN. 

With this in place, every base node has an up-to-the-minute list of all active validator nodes and their metadata. The 
registration deposit also serves as a Sybil prevention mechanism.

Validator nodes are the bridge between the consensus layer and the Tari Virtual Machine (TVM).

VNs are required to re-register periodically as a proof-of-liveness mechanism.

Validator nodes must be able to
1. interpret the instructions they receive from clients, identifying the contract code that the instruction refers,
2. retrieve and deserialize the relevant input state,
3. compute the output state that result from applying the contract logic to the input state, and
4. reach consensus with its peers.

Steps 1 - 3 are carried out in the Tari Virtual Machine (TVM).
Step 4 is achieved by communicating with peers via the DAN consensus layer.

[Thaums](#thaums-and-the-turbine-model) exist at the Validator node level, and VNs earn fees, in Thaums, for each 
instruction that it aids in getting finalised.

### DAN consensus layer

The Cerberus BFT consensus algorithm runs on the consensus layer. This layer is completely ignorant of the 
semantics of DAN smart contracts.

This layer only cares that:
* _only_ VNs that have registered on the base layer are participating in consensus.
* VNs are self-organising into VN committees and are carrying out the rules of Cerberus
  correctly.

In particular, the consensus layer has _no idea_ whether an instruction's output is correct. If two-thirds (plus one)
of the committee agree on the results, then consensus has been reached and the consensus layer is happy.

For example, if consensus decides that 2 + 2 = 5, then for the purposes of this contract, that is the case. 
### The Tari Virtual Machine

The TVM is a WASM-based virtual machine designed to run Tari contracts.
Contracts are composed of one or more Tari templates, glue code and a state schema. Tari Labs provides a Rust 
implementation for TVM contracts, but in principle, other languages could implement the specification as well.

The TVM is able to
* load a contract.
* provide a list of methods that the contract exposes.
* Execute calls on the contract.
* Persist and restore the state of the contract.

### Thaums and the turbine model

Thaums is a [unit of magic](https://discworld.fandom.com/wiki/Thaum). Thaums are used to power the DAN's economic 
engine. Thaums are created with a one-way perpetual peg as described in [RFC-0320]. Briefly, Tari is burnt to create 
Thaums, which are used to pay for the execution of instructions on the DAN. A portion of instruction fees are burnt 
with every instruction to provide a constant source of demand for Thaums in the DAN.

There is no peg out back to the base layer for Thaums. The reason for this is explained in [RFC-0320]. Thaum holders wishing to convert back to Tari will be able to 
perform a submarine swap with a Tari seller. We also anticipate that exchanges will list the Thaum-Tari pair to 
enable easy conversion of Thaums back to Tari.

# Change Log

| Date        | Change              | Author     |
|:------------|:--------------------|:-----------|
| 1 Nov 2022  | High-level overview | CjS77      |
| 26 Oct 2022 | First outline       | SWvHeerden |

[base layer]: Glossary.md#base-layer
[validator node]: Glossary.md#validator-node
[validator node comittee]: Glossary.md#validator-node-committee
[FTL]: RFC-0120_Consensus.md#FTL
[RFC-0320]: RFC-0320_TurbineModel.md