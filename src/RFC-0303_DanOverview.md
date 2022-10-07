# RFC-0303/DanOverview

## Digital Assets Network

![status: outdated](../../book/theme/images/status-outofdate.svg)

**Maintainer(s)**: [Hansie Odendaal](https://github.com/hansieodendaal)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2018 The Tari Development Community

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

The aim of this Request for Comment (RFC) is to describe the key features of the Tari second layer, also known as the 
Digital Assets Network (DAN). This document will not provide much detail and will only give an overview of the dan.

## Related Requests for Comment

* [RFC-0100: Base Layer](RFC-0100_BaseLayer.md)

## Description

The Tari Dan layer is based on work by Radix called [Cerberus](https://www.radixdlt.com/post/cerberus-infographic-series-chapter-i). 
Tari's implementation of Cerberus will differ somewhat in crucial areas from the implementation done by Radix. First and foremost is that Radix's implementation will run as a base-layer Proof-of-Stake, 
whereas Tari's will run as a second layer to a Proof-of-Work base layer. More details will be discussed in other RFCs. 

The tl;dr of Cerberus is that each transaction is divided into parts(inputs, outputs), with each piece being assigned a unique address within the space `2^256`.
When a part is created, it is assigned a permanent address that will never change. When a piece is destroyed or spent, it is marked as such, but that destroyed part
keeps on living at that address. The entire network is then divided into BFT committees to validate transactions, with each validation committee
only serving some set of the total `2^256` address set. This means that the network will scale with more validators and transactions.
More detail will be provided in the following RFCs:
- N/A

### Assets
[Digital Asset]s (DAs) will all live in the second layer together. The second layer will be managed by special nodes called [Validator Node]s (VNs). 
Each VN will serve only a selected part of the address space determined by its registration key. The VNs will form [Validator Node Committee]s (VNCs), as 
is required to serve parts of a transaction.

### Validator Nodes
Validator Nodes will register themselves on the base layer to prevent Sybil attacks. This registration will also provide the address key for the VN.
To determine the liveness of a VN, we will require the vn to register itself after a period.

### Templates.
A template is what Tari defines as a smart contract. These templates are registered on the base layer and mined. VNs will reference the base layer for valid contracts. 

### Transactions
Every transaction will be divided into shards for processing by VNCs. A VNC will be created for each shard contained in each transaction. Each VNC is responsible 
for validating its own shard. The VNCs communicate with the other VNCs over three rounds to determine if each VNC has a valid shard from the transaction. The VNCs will sign
and broadcast this over BFT consensus to each other and within, see [Emergent Cerberus](https://www.radixdlt.com/post/cerberus-infographic-series-chapter-vi).
Each transaction should contain all the metadata(signatures etc.) to validate the transaction.

[base layer]: Glossary.md#base-layer
[validator node]: Glossary.md#validator-node
[validator node comittee]: Glossary.md#validator-node-committee
