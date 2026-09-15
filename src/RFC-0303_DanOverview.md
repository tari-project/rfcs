# I-TIP-RFC-O-0303: OotleOverview

| TIP             | [I-TIP-RFC-O-0303](#i-tip-rfc-o-0303-ootleoverview)                       |
|-----------------|---------------------------------------------------------------------------|
| Title           | The Tari Ootle                                                            |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2022-10-26                                                                |
| References      | [I-TIP-RFC-O-0305](RFC-0305_Consensus.md), [I-TIP-RFC-O-0330](RFC-0330_Cerberus.md) |

## The Tari Ootle

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77),[S W van Heerden](https://github.com/SWvheerden)

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

The aim of this Request for Comment (RFC) is to describe the key elements of the Tari smart contract layer, the
**Ootle**.

<div class="note">
The Ootle was previously called the Digital Assets Network, or DAN. The older name survives in some places (the
<code>dan</code> prefix on a few crates and RPC methods, and in the deprecated RFCs listed under
<a href="deprecated_rfc.md">Deprecated</a>). This RFC and its siblings use "Ootle" throughout.
</div>

## Related Requests for Comment

* [I-TIP-RFC-O-0305: The Ootle Consensus Layer](./RFC-0305_Consensus.md)
* [I-TIP-RFC-O-0313: Validator Node Registration](./RFC-0313_VNRegistration.md)
* [I-TIP-RFC-O-0314: Validator Node Committee Selection](./RFC-0314_VNCSelection.md)
* [I-TIP-RFC-O-0320: The Turbine Model](./RFC-0320_TurbineModel.md)
* [I-TIP-RFC-O-0325: Epochs and Time Management](./RFC-0325_DanTimeManagement.md)
* [I-TIP-RFC-O-0330: The Ootle HotStuff Consensus Algorithm](./RFC-0330_Cerberus.md)
* [I-TIP-RFC-O-0331: Ootle Indexers](./RFC-0331_Indexers.md)
* [I-TIP-RFC-O-0350: The Tari Virtual Machine](./RFC-0350_TariVM.md)
* [I-TIP-RFC-MT-0111: Base Node Architecture](./RFC-0111_BaseNodeArchitecture.md)

## Description

The Ootle is a sharded, BFT-replicated smart contract layer that settles against the Minotari base layer.

State is not partitioned by contract, as it is in Tari DANv1, Polkadot or Avalanche. Instead the entire 256-bit
substate address space is partitioned into contiguous **shards**, and validator nodes are distributed evenly across
those shards. When a transaction reads or writes a substate, only the nodes covering that substate's shard take part
in agreeing the resulting state change. A transaction touching substates in several shards is agreed by those shards
jointly, through the cross-shard protocol described in
[I-TIP-RFC-O-0330](./RFC-0330_Cerberus.md).

This means that nodes have to be prepared to execute transactions against any contract in the network. It creates a
data synchronisation burden, but the payoff — a scalable, decentralised contract layer — significantly outweighs the
trade-off.

<div class="note">
<p><strong>Provenance.</strong> The design started from
<a href="https://arxiv.org/abs/2008.04450">Cerberus</a>, substituting HotStuff for the pBFT used in that paper. The
network as built has diverged far enough from the paper that the name is no longer used in the code or in these
RFCs: notably, shards are grouped into fixed <em>shard groups</em> rather than assigned per substate address, and the
cross-shard exchange is a pull-based reliable broadcast of committed blocks
(<a href="RFC-0321_ProcessingForeignProposals.md">I-TIP-RFC-O-0321</a>) rather than the leader-to-leader message
exchange of the paper. The Cerberus and <a href="https://arxiv.org/pdf/1708.03778.pdf">Chainspace</a> papers remain
useful background reading.</p>
</div>

## Key actors

Several components on both the Ootle and the base layer interoperate to enable scalable smart contracts on Tari:

* **Minotari base layer** — enforces Tari monetary policy and acts as global registrar.
* **Templates** — reusable smart contract code, published to the Ootle.
* **Components** — instances of a template, holding the state of a running contract.
* **Validator nodes** — execute transactions and reach consensus on the resulting state changes, earning fees for
  doing so.
* **Consensus layer** — a scalable, sharded HotStuff BFT engine.
* **Tari Virtual Machine** — runs template code in a WASM sandbox.
* **Indexers** — follow the state of a chosen set of components across the shard space and serve it to clients.
* **Tari** — the token that pays for execution on the Ootle.

The remainder of this document describes these elements in a little more detail and how they relate to each other.

## The Minotari Base Layer

The most important role of the Minotari base layer is to issue and secure the base Tari token.

As it relates to the Ootle, the base layer also serves as an immutable global registry:

* It maintains the register of all validator nodes, including each node's shard key, claim key and the epoch range
  for which its registration is valid. See [I-TIP-RFC-O-0313](./RFC-0313_VNRegistration.md).
* It provides the only means of minting new Tari into the Ootle economy, by burning Minotari. See
  [I-TIP-RFC-O-0320](./RFC-0320_TurbineModel.md).
* It provides the shared clock that drives Ootle epoch transitions, when the base-layer epoch oracle is in use. See
  [I-TIP-RFC-O-0325](./RFC-0325_DanTimeManagement.md).

### Templates

Templates are smart contract code: a WASM module plus the ABI describing the functions and methods it exposes.
Templates are intended to be well-tested, secure, reusable building blocks.

For example, an NFT template lets a user populate a few fields — name, number of tokens, media locations — and launch
a new NFT series without writing any code.

Templates are published to the Ootle itself with the `PublishTemplate` instruction, which creates a `Template`
substate holding the module. A template's address is derived from the publisher and the module, so a published
template is content-addressed and immutable; publishing a new version creates a new address, and a component can be
migrated to it with `UpdateComponentTemplate` subject to the component's owner rule.

<div class="note">
Base-layer template registration (the <code>CodeTemplateRegistration</code> transaction output and the
<code>get_template_registrations</code> base node RPC) still exists and is still scanned by validator nodes. It
predates on-chain publishing and points at a module hosted off-chain. On-chain publishing is the mechanism new
templates should use: it removes the dependency on external hosting and makes the module part of consensus state.
</div>

### Components

A component is a live instance of a template — the "contract" in everyday usage. Components hold their state in
`Component` substates and their tokens in `Vault` substates.

Components are always executed in the Tari Virtual Machine. The inputs and outputs of every transaction are agreed by
the validator committees covering the affected substates.

### Validator Nodes

Validator nodes (VNs) execute Ootle transactions and reach consensus on the outcome. A VN must register on the base
layer and lock up funds — the registration deposit — in order to participate. The deposit is a Sybil-resistance
mechanism, and the registration gives every base node an up-to-date list of active validator nodes and their
metadata.

Registrations carry a maximum epoch, so a VN must re-register periodically as a proof-of-liveness mechanism. A VN
registers a separate **claim key** alongside its identity key; leader fees accrue to a `ValidatorFeePool` substate
derived from that claim key, and are claimed in a batch with the `ClaimValidatorFees` instruction rather than being
paid out per transaction.

Validator nodes must be able to:

1. interpret the transactions they receive from clients, identifying the template code each instruction refers to,
2. retrieve and deserialise the relevant input state,
3. compute the output state resulting from applying the template logic to the input state, and
4. reach consensus with their peers.

Steps 1–3 are carried out in the Tari Virtual Machine. Step 4 is achieved by communicating with peers via the
consensus layer.

Validator nodes that misbehave can be evicted from the network by their own committee, using the `EvictNode` command
described in [I-TIP-RFC-O-0305](./RFC-0305_Consensus.md).

### Consensus layer

The BFT consensus algorithm runs on the consensus layer. This layer is completely ignorant of the semantics of Ootle
smart contracts.

This layer only cares that:

* _only_ VNs registered for the current epoch are participating in consensus, and
* VNs are organised into validator node committees and are following the consensus rules correctly.

In particular, the consensus layer has _no idea_ whether a transaction's output is correct. If a super-majority of
the committee agree on the result, then consensus has been reached and the consensus layer is happy.

For example, if consensus decides that 2 + 2 = 5, then for the purposes of that contract, that is the case.

### The Tari Virtual Machine

The TVM is a WASM-based virtual machine designed to run Tari templates. Tari Labs provides a Rust implementation of
the template library, but in principle other languages could target the same ABI.

The TVM is able to:

* load a template,
* provide a list of the functions and methods the template exposes,
* execute calls against those functions and methods, and
* initiate retrieval and persistence of component state. The state itself is not stored in the VM; it is held as
  substates by the validator committees, and served to clients by Indexers.

See [I-TIP-RFC-O-0350](./RFC-0350_TariVM.md).

### Indexers

Where validator nodes stay in position and manage a fixed slice of the address space, Indexers follow a chosen set of
components wherever their state moves across the shard space. Client applications — wallets, dApps, exchange
front-ends — talk to an Indexer to read state and to dry-run transactions before submitting them. See
[I-TIP-RFC-O-0331](./RFC-0331_Indexers.md).

### Tari and the turbine model

Tari powers the Ootle's economic engine. Tari is minted via a one-way perpetual peg as described in
[I-TIP-RFC-O-0320](./RFC-0320_TurbineModel.md). Briefly: Minotari are burnt on the base layer to create Tari, which
pay for execution on the Ootle. A fraction of every transaction fee — the *exhaust*, currently 5% — is burnt, which
provides a constant source of demand for Tari.

There is no peg-out back to the base layer. The reason is explained in
[I-TIP-RFC-O-0320](./RFC-0320_TurbineModel.md). Holders wishing to convert Tari back to Minotari can perform a
submarine swap with a buyer ([RFC-0310: Submarine Swaps](./RFC-0310_SubmarineSwaps.md)), and we anticipate that exchanges will
list the pair.

# Change Log

| Date        | Change                                                            | Author     |
|:------------|:------------------------------------------------------------------|:-----------|
| 07 Sep 2026 | DAN -> Ootle; realign with the implementation; drop Cerberus name | Tari Labs  |
| 23 Oct 2023 | Thaum -> Tari                                                     | CjS77      |
| 1 Nov 2022  | High-level overview                                               | CjS77      |
| 26 Oct 2022 | First outline                                                     | SWvHeerden |

[base layer]: Glossary.md#base-layer
[validator node]: Glossary.md#validator-node
[validator node comittee]: Glossary.md#validator-node-committee
