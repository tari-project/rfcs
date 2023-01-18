# RFC-0001/Overview

## Overview of Tari Network

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

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

The aim of this proposal is to provide a very high-level perspective of the moving parts of the Tari protocol.

## Related Requests for Comment

- [RFC-0303: Digital asset network](RFC-0303_DanOverview.md)
- [RFC-0131: Tari mining][RFC-131]
- [RFC-0201: TariScript][RFC-201]
- [RFC-0202: TariScript Opcodes][RFC-202]

## Description

### Abstract

Tari's aims to be the most _useful_,  _decentralized_ platform that _empowers anyone_ to create digitally scarce 
things people love.

This statement packages some important concepts.

To be _useful_, creators and users need to be able to interact with their digital assets in the way that they've 
been accustomed to in Web 2.0. This means that there is a safe, secure, responsive interface between human and the 
machines that manage their information. It means that the user experience is smooth and intuitive. It means that 
the network protocol itself is flexible and capable enough to provide every type of assets creators can 
imagine.

It also _scales_, so that the entire network does not become a victim of its own success and grind to a halt when more 
than a few hundred people actually try to use it.

_Decentralisation_ is central to Tari's philosophy (pun intended). The tape is wearing thin on the newsreel that 
reports yet another centralised custodian, gatekeeper or "authority" becoming a single point of failure. This has 
led to thousands of people losing their crypto-assets, as well as their trust in the ideas of crypto-assets.

Tari has a strong focus on developer experience. The Tari community obsesses over building beautiful, 
clean, intuitive APIs and templates, which lead to beautiful developer tools. The idea is to widen the pool and allow 
_anyone_ to create safe, secure, performant digital assets, rather than provide a gated community of rent-extracting 
"smart-contract developers".

In general, some of these goals are in direct opposition to each other. Speed, security and decentralisation 
typically form a trilemma that means that you need to settle for two out of the three.

Tari attempts to resolve the dilemma by splitting operations over two discrete layers. Underpinning everything is a 
base layer that focuses on security and manages global state, and a second, 
digital assets layer that focuses on rapid finalisation and scalability.

#### Multiple Layers

The [distributed system trilemma](https://en.wikipedia.org/wiki/CAP_theorem) tells us that these requirements are
mutually exclusive.

We can't have fast, cheap digital assets and also highly secure and decentralized currency tokens on a single system.

Tari overcomes this constraint by building two layers:

1. A base layer that provides a public ledger of Tari coin transactions, secured by PoW to maximize security.
2. A DAN consisting of a highly scalable, efficient side-chain that each manages the state of all digital asset. 

The DAN layer gives up some security guarantees in exchange for performance. However, in the case of a liveness 
failure (wherein parts of the DAN cannot make progress), the base layer intervenes to break the deadlock and allow 
the DAN to continue.

### Base Layer

[The Tari base layer](RFC-0100_BaseLayer.md) has the following primary features:

- PoW-based blockchain using Nakamoto consensus
- Transactions and blocks based on the [Mimblewimble] protocol

[Mimblewimble] is a blockchain protocol that offers some key advantages over other [UTXO]-based
cryptocurrencies such as Bitcoin:

- Transactions are private. This means that casual observers cannot ascertain the amounts being transferred or the
  identities of the parties involved.
- Mimblewimble has a different set of security guarantees to Bitcoin. The upshot of this is that you can throw away UTXOs
  once they are spent and still verify the integrity of the ledger.
- Multi-signature transactions can be easily aggregated, making such transactions very compact, and completely hiding
  the parties involved, or the fact that there were multiple parties involved at all.

> "Mimblewimble is the most sound, scalable 'base layer' protocol we know" -- @fluffypony

In addition to this, Tari has made some novel additions to the basic Mimblewimble protocol. Primarily, these were 
invented to allow the DAN to be built on top of Tari, but have found some great applications generally:

* TariScript. Similar to Bitcoin script, TariScript ([RFC-201], [RFC-202]) provides limited "smart contract" 
  functionality on the base layer protocol.
* One-sided payments. Vanilla Mimblewimble requires both sender and receiver to participate in the creation of 
  transactions. It is impossible in [MimblewimbleCoin](https://www.mwc.mw/), for example, to post a "tip jar" address and let people 
  unilaterally send you funds. However, this is possible in Tari, thanks to TariScript.
* Stealth addresses. Want to allow people to send you funds using one-sided payments without revealing your public 
  key (and thus, who you are) to the world? [Stealth addresses] have you covered.
* Covenants. [Covenants] allow you to construct complex chains of transactions that follow predefined rules.
* Burn transactions. Tari offers unequivocal "burn" transactions that render the burnt outputs permanently 
  unspendable. This is an important mechanism that underpins the DAN economy. 

#### Proof of Work

Tari is mined using a hybrid approach. On average, 60% of block rewards come from [Monero merge-mining],
 while 40% come from the [Sha3x][RFC-131] algorithm. Blocks are produced every 2 minutes, on average.  

### The role of the base layer

The Base Layer fulfils these, and only these, major roles:

1. It manages and enforces the accounting and consensus rules of the base Tari (XTR) token. This includes standard payments,
   and simple smart contracts such as one-sided payments and cross-chain atomic swaps.
2. It maintains the Validator node register.
3. Maintain a register of smart contract templates. This allows users to verify that digital assets are running the 
   code that they expect and includes functionality like version tracking.
4. Provides a global reference clock for the digital assets layer to help it resolve certain operational failure modes.

### Digital Assets Network

The DAN is focused on achieving high speed and scalability while maintaining a high degree of decentralisation.

The DAN itself is made up of two conceptual levels. On the more fundamental level, the consensus layer uses 
Cerberus and emergent HotStuff to reach consensus on state changes in the DAN in a highly scalable, decentralised way.

A big, and probably the biggest, advantage of this approach is that assets in disparate smart contracts can easily 
interact, without the need for slow, honey pot-shaped bridges. 

Then there is the semantic layer, which is where the Tari contracts are compiled, run and verified inside sandboxed 
Tari virtual machines.

Together, these levels provide that smart contract enabled digital assets layer, that we've simply been calling the DAN.

### Interplay of the layers

In general, the base layer knows _nothing about the specifics of what is happening on the side-chain_. It only cares
that no Tari is created or destroyed, and that the flow of funds in and out of side chains are carried out by the appropriate
authorised agents.

This is by design: the network cannot scale if details of digital asset contracts have to be tracked on the base layer.
We envisage that there could be hundreds of thousands of contracts deployed on Tari. Some of those contracts may be 
enormous;
imagine controlling every piece of inventory and their live statistics for a massively multiplayer online role-playing
game (MMORPG). The base layer is also too slow. If _any_ state relies on base layer transactions being confirmed, there
is an immediate lag before that state change can be considered final, which kills the latency properties we seek for 
the DAN.

It is better to keep the two networks almost totally decoupled from the outset, and allow each network to play to its
strength.

[tari]: Glossary.md#tari-coin
[transaction]: Glossary.md#transaction
[mimblewimble]: Glossary.md#mimblewimble
[utxo]: Glossary.md#unspent-transaction-outputs
[RFC-131]: RFC-0131_Mining.md
[RFC-201]: RFC-0201_TariScript.md
[RFC-202]: RFC-0202_TariScriptOpcodes.md
[Stealth addresses]: RFC-0203_StealthAddresses.md
[Covenants]: RFC-0250_Covenants.md
[Monero merge-mining]: RFC-0132_Merge_Mining_Monero.md

# Change Log

| Date        | Change                                               | Author   |
|:------------|:-----------------------------------------------------|:---------|
| 18 Dec 2018 | First outline                                        | CjS77    |
| 30 Mar 2019 | First draft v0.0.1                                   | CjS77    |
| 19 Jun 2019 | Propose payment channel layer                        | CjS77    |
| 22 Jun 2021 | Remove payment channel layer proposal                | SimianZa |
| 14 Jan 2022 | Update image. Expound on Base layer responsibilities | CjS77    |
| 10 Nov 2022 | Update overview for Cerberus                         | CjS77    |

