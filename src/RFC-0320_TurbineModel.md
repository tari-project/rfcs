# I-TIP-RFC-O-0320: TurbineModel

| TIP             | [I-TIP-RFC-O-0320](#i-tip-rfc-o-0320-turbinemodel)                        |
|-----------------|---------------------------------------------------------------------------|
| Title           | The Ootle Peg-In Mechanism, or Turbine Model                              |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2022-11-01                                                                |
| References      |                                                                           |

## The Ootle Peg-In Mechanism, or Turbine Model

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77)

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

Tari powers the Ootle's economic engine.

This RFC describes the motivation for, and the mechanism of, the Minotari-to-Ootle peg-in.

## Related Requests for Comment

* [I-TIP-RFC-O-0303: The Tari Ootle](./RFC-0303_DanOverview.md)
* [I-TIP-RFC-O-0350: The Tari Virtual Machine](./RFC-0350_TariVM.md)
* [RFC-0310: Submarine Swaps](./RFC-0310_SubmarineSwaps.md)
* [I-TIP-RFC-MT-0111: Base Node Architecture](./RFC-0111_BaseNodeArchitecture.md)

## Description

Side-chains are related to their parent chains via a pegging mechanism. In general, peg-in transactions — transferring
value to the side-chain — are straightforward. One locks value up on the parent chain, which can be referenced by the
side-chain. The reverse transaction is fraught with difficulty, since the parent chain must know almost nothing about
the transaction particulars of the side chain. We know this is the case; otherwise the side-chain and parent-chain
system are forced to work in lock-step, and the two chains are really just one larger, more complicated chain.

Peg outs are particularly difficult if the participants change on the side-chain, as opposed to, say, payment
channels like the Lightning Network, where the same parties peg in and out.

There are several proposals for a reliable two-way peg, including [space-chains], [drive-chains] and federated
side-chains like [elements]. All of them have particular trade-offs and difficulties.

For Tari, we propose a slightly different approach: a one-way peg with persistent second-layer burn.

Because the operating principle is quite similar to that of a gas turbine, we call this approach the _turbine model_.
Fuel (Minotari) is fed into the turbine, where it is burnt, producing a hot, motive gas (Tari) that drives the engine
(the Ootle). Exhaust gas is ejected from the rear of the turbine: a portion of every transaction fee is burnt.

### An aside - the monetary policy trilemma

The [monetary policy trilemma](https://www.investopedia.com/terms/t/trilemma.asp) states that you _cannot
control all 3 of these things simultaneously_:

1. exchange rate
2. monetary policy (i.e. minting and burning to control supply)
3. flow of capital (money leaving or entering the system)

Let's briefly consider the trilemma from the point of view of the Ootle.

#### Monetary policy

We are effectively forced to control monetary policy.
Or put another way, we can't let people freely mint their own Tari. Unfortunately, even though we have "chosen" to
control supply, it's difficult for us to control the Tari supply in practice. In the physical world, the money 
supply is typically managed by a central bank, with the emphasis on "central".

The designers of a decentralised monetary system have precious few levers available to control supply and no simple ones.

#### Capital flow

Allowing free capital flow would require a reliable and efficient peg-out mechanism from the Ootle back to the base layer.
However, I argue that this is an Achilles heel. _Any_ peg-out system you can devise that is coupled with a burn-type 
peg-in mechanism is an existential threat to the base layer.

Why? Because the peg-out necessarily requires creation of coins on the base layer by _trusting_ some mechanism 
external to it. Note that we're not bringing UTXOs that were pegged-in back into circulation (in this 
case they would not be burned, merely locked-up as in a traditional peg). Therefore, the base layer accounting simply 
has to accept these mints as valid. 

Consequently, _any bug whatsoever on the Ootle related to the minting process' authenticity_  could lead to undetectable 
inflation on the base layer. 

A central axiom of side-chain design, if there is such a thing, is that the side-chain should pose _zero_ risk to the 
security of the base layer. For this reason, the burn mechanism effectively _excludes the possibility of peg outs_.

So essentially, we cannot allow the free flow of capital either.

#### Exchange rate

Since we have already picked two legs of the trilemma, we cannot do anything about the third, and must allow the exchange
rate to float.

### The turbine model

This is actually not as terrible as it sounds. The trilemma doesn't force you to sit at the vertex of the monetary
policy triangle. If you allow _partial_ freedoms in supply and capital flow, then the exchange rate will move, but
will tend to remain range-bound.

Although capital flow here is not free, it's not completely restricted either:
1. Peg-ins are completely unrestricted.
2. Submarine-swaps allow people to remove money from the system on the micro-level (albeit not on the macro level).

And the money supply can be tuned, if not controlled. This all leads to the proposal of a new mechanism, the turbine 
model:

![turbine](./assets/turbine.png)

The Ootle's Tari supply is increased by user peg-in deposits, and any other mechanism that we may want to enforce, 
such as asset issuer financing. 

To prevent the eventual collapse of the Tari price to zero, there must be an exhaust mechanism that continually 
removes Tari from the system..

The simplest exhaust mechanism is to simply burn a fraction of Tari fees from every transaction! These can be very
low. Presumably, over the long-run the burn rate should approximately match the Minotari blockchain tail emission.

The exhaust places a permanent upward pressure on the Tari exchange rate; but it will never exceed 1:1 with Minotari,
since any premium will be immediately arbitraged away. This is because anyone can _always_ burn as much Minotari as they 
wish and mint Tari at a 1:1 ratio on the Ootle and then sell them for a risk-free profit. This action will increase 
the supply of Tari and drive the price back down to parity.

If the exhaust is temporarily insufficient to hold the peg, the Tari price will drop below 1 XTR. This will 
immediately shut off deposits because submarine swaps will a be cheaper route to obtaining Tari than burning 
Minotari (which are always 1:1). Since the exhausts upward price pressure is a constant force, the Tari price will 
eventually approach 1:1 again.

Over time, we expect this mechanism to provide a somewhat stable peg between Tari and Minotari with the Tari price 
occasionally dropping below parity and possibly remaining there for some time. As secondary markets for the 
Tari-Minotari pair matures, this event will immediately create a bid on Tari, since -- in the absence of catastrophic 
failure -- speculators know that the Tari price will eventually return to parity, causing upward pressure to come into 
play quickly and efficiently.


## The turbine model as implemented

The two halves of the turbine — the peg-in and the exhaust — are both in the network today.

### Peg-in: burning Minotari, claiming Tari

Peg-in is a burn on the base layer followed by a claim on the Ootle.

1. The user creates a Minotari transaction with a burned output. The burn destroys the Minotari; there is nothing to
   spend and nothing locked up.
2. The user submits a transaction to the Ootle containing a `ClaimBurn` instruction. The instruction carries a
   `MinotariBurnClaimProof`: the burn public key, the output commitment, a Schnorr ownership proof over that
   commitment, a Merkle proof that the output is in the base-layer chain, the abridged transaction kernel, and the
   claimed value.
3. Validator nodes verify the proof against their view of the base layer and mint the equivalent Tari into the
   claiming account.

The burn is recorded on the Ootle as a substate, so a given burn can be claimed exactly once. There is no trusted
party and no federation: the peg-in is a proof about base-layer data that any validator can check.

The peg-in is 1:1 by construction. One µXTM burnt yields one µXTR.

### Exhaust: burning a fraction of every fee

The exhaust is the `ExhaustBurnRate` consensus constant, currently 500 basis points (5%) on every network. When the
engine settles a transaction's fees it charges the burn on top of the accrued execution fee, as a separate
`FeeSource::ExhaustBurn` charge. The leader therefore receives the execution fee in full, and the burnt amount is
destroyed rather than redistributed.

The rate is a consensus rule: it must be identical network-wide, or nodes would disagree on the burn totals recorded
in block headers. It is resolved per epoch (`ConsensusConstants::exhaust_burn_rate(epoch)`), which leaves room for a
schedule or a controller to vary it in future without changing the fee-charging path.

<div class="note">
A dynamic burn rate — a controller that varies the exhaust to steer the circulating supply — was studied in
<a href="RFC-0323_TariThrottle.md">D-TIP-RFC-O-0323</a> and not adopted. That RFC is deprecated; its conclusion was
that a supply-targeting controller moves the burn rate too sharply to be compatible with sustainable validator node
economics. The fixed rate is the design in force.
</div>

### Where fees go

Fees not burnt as exhaust accrue to the block leader's `ValidatorFeePool` substate, which is derived from the
validator's claim key rather than its identity key ([I-TIP-RFC-O-0313](./RFC-0313_VNRegistration.md)). Pooling avoids
a dust-sized value transfer per transaction; the validator withdraws the accumulated balance with a
`ClaimValidatorFees` instruction when it chooses to.

# Change Log

| Date        | Change                                                              | Author |
|:------------|:----------------------------------------------------------------------|:-------|
| 07 Sep 2026 | DAN -> Ootle; document the peg-in and exhaust mechanisms as built    | Tari Labs |
| 23 Nov 2023 | Thaum -> Tari                                                        | CjS77  |
| 1 Nov 2022  | First draft                                                          | CjS77  |

[space-chains]: https://www.youtube.com/watch?v=N2ow4Q34Jeg
[drive-chains]: https://www.drivechain.info/
[elements]: https://elementsproject.org/how-it-works
