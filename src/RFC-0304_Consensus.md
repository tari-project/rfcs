# RFC-0304/Consensus

## The Tari Network Consensus Layer

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77),[stringhandler](https://github.com/stringhandler)

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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all
capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

This Request for Comment (RFC) describe the consensus mechanism known as Cerberus as it is implemented in Tari.
Tari implements the Cerberus variant known as Optimistic Cerberus, for the most part, with Hotstuff BFT replacing
pBFT as described in the Cerberus paper.

This RFC serves to document any deviations from the academic paper as well as finer-grained details of the
implementation.

## Related Requests for Comment

* [RFC-303: Digital Assets Network](./RFC-0303_DanOverview.md)

## Introduction

The Tari DAN is based on a sharded BFT consensus mechanism called [Cerberus](https://arxiv.org/abs/2008.04450).

One particular note is that Tari has chosen Hotstuff as the base BFT consensus algorithm over pBFT mentioned in the
paper.

The core idea of Cerberus is that instead of dividing work up between validator nodes according to the contracts
they are managing (as per Tari DANv1, Polkadot, Avalanche, etc.), Cerberus distributes nodes evenly over a set of
state slots. Any time an instruction modifies the state of a contract, it will affect one or more state
slot, and only those nodes that are responsible for covering those addresses will reach consensus on the correct
state changes.

This means that nodes have to be prepared to execute instructions on any contract in the network. This
does create a data synchronisation burden, but the added benefit of a highly scalable, decentralised DAN significantly
outweighs this trade-off.

## The consensus layer is logic agnostic

The first key point to make about the Cerberus layer is that it is _logic agnostic_. The consensus layer does not
know anything about Tari, about digital assets, or smart contracts. It has one job:

> Ensure that a super-majority of participating nodes agree on the state transition for every Tari transaction.

Defining the consensus layer in this way allows us to separate the concerns of the consensus layer from the concerns
of the smart contract layer. This is important because it reduces the attack surface of the consensus layer, and allows
us to develop the consensus layer in isolation from the smart contract, or "business logic" layer.

To be clear, if 67% percent of nodes decide that $1 + 1 = 3$ then that is the truth as far as the consensus layer is
concerned.

This job can be subdivided into several smaller, co-ordinated tasks:

1. Deterministic distribution of validator nodes across the state space, to form **validator committees**.
2. Periodically re-distributing validator nodes across the state space to reduce the likelihood and opportunity for 
3. collusion.
4. Efficient transmission of consensus messages to the rest of the network.
5. Identifying and removing malicious nodes from the network.
6. Correct identification of nodes participating in cross-shard consensus.
7. Requesting and responding to state requests from other nodes.
8. Reaching consensus on the state transition for a given transaction.
9. Effective leader rollover in the case of a faulty leader.
10. Guaranteeing liveness in the face of a Byzantine stoppage.
       
## Distribution of validator nodes

Validator node selection and distribution is described in [RFC-314](./RFC-0314_VNCSelection.md). RFC-314 also covers 
the periodic re-distribution of validator nodes across the state space. 

## Efficient transmission of consensus messages to the rest of the network

The Tari communications layer is used to transmit consensus messages to the rest of the network.
The Comms layer is described in [RFC-170](./RFC-0170_NetworkCommunicationProtocol.md) and related sub-RFCs.

TODO:
* Describe differences in configuration between the Tari and Minotari networks.
* Describe how VNC members find each other and how they keep in touch.
* Describe how banning or other sanctioning behaviour works. 
* How client messages are propagated and routed to the correct nodes in the network.
* How consensus messages are communicated across the network.

## Identifying and removing malicious nodes from the network

Currently, malicious nodes are not actively removed from the network. Instead, they can be banned by peers, as 
described above, and then de-registered as validator nodes at an epoch transition.

## Identification of nodes participating in cross-shard consensus.

If an instruction touches state involving multiple shards, cross-shard consensus is required.
The broad steps for cross-shard consensus are as follows:
* Identify the sub-states involved as inputs in the instruction.
* Identify the shards that the sub-states belong to.
* Look up the validator nodes responsible for those shards in the VN registry for the current epoch.
* Establish a connection to each validator node in the superset of the participating VNCs.

##  Requesting and responding to state requests from other nodes.

State requests come from two primary sources:
1. Other validator nodes requesting state that they need to process an instruction. They will usually request this 
   state from peers in the braided consensus group as part of a consensus round.
2. Clients (wallets, dApp users etc.) will usually request state from an Indexer that is following the history of a 
   set of contracts on interest. Indexers are a trusted a party. Users wanting to operate in a trustless environment 
   will need to run their own indexer. Indexers are described in [RFC-331](./RFC-0331_Indexers.md).

State requests are just another form of message passing. Therefore, the same approach as 
[message transmission](#efficient-transmission-of-consensus-messages-to-the-rest-of-the-network)
is followed for state requests, with some additions, described next.

* A state request response consists of
  * the state object
  * a quorum certificate, indicating consensus was reached on the digest of the state object.

Both clients and peers must be able to validate state responses by checking that the provided quorum certificate 
  is valid, corresponds to the state received, and the quorum consists of the correct validator node committee.

If a request for state is made that does not exist, ???.

How does a client know if a provided state hash and quorum certificate is current, and not been spent since?

## Reaching consensus on the state transition for a given transaction.

Tari uses Cerberus in conjunction with HotStuff BFT to achieve consensus on sub-state transitions. This process is 
described in detail in [RFC-330](RFC-0330_Cerberus.md). 

## Effective leader rollover in the case of a faulty leader.

Leader rollover is also covered in  [RFC-330](RFC-0330_Cerberus.md).

## Guaranteeing liveness in the face of a Byzantine stoppage.
                 
<div .note>
The final design for liveness guarantees is still under active discussion.
</div>

A liveness break will only occur if at least a third of nodes are actively or passively colluding to prevent 
consensus being reached. Successive leader rollovers will have failed to resolve the issue, and the transaction will 
become stuck. 

Eventually, the entire network will stop functioning even though the network is sharded, because probabilistically, 
every contract will eventually produce a state change that required the Byzantine committee to be part of the 
consensus.

Therefore, it's critical that liveness can be forced relatively quickly and efficiently.

The basic strategy is that enough nodes vote to force an epoch change. Nodes need to provide proof of recent 
activity in order to participate in the new epoch. Nodes that cannot provide proof will be banned and de-registered 
as validator nodes.

The epoch change causes a validator node shuffle, and any remaining nodes that may have been preparing to collude 
will be assigned new shards.

The specifics of this mechanism are yet to be decided.


# Change Log

| Date        | Change      | Author |
|:------------|:------------|:-------|
| 30 Oct 2023 | First draft | CjS77  |

[base layer]: Glossary.md#base-layer

[validator node]: Glossary.md#validator-node

[validator node comittee]: Glossary.md#validator-node-committee
