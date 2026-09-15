# P-TIP-RFC-O-0310: SubmarineSwaps

| TIP             | [P-TIP-RFC-O-0310](#p-tip-rfc-o-0310-submarineswaps)                      |
|-----------------|---------------------------------------------------------------------------|
| Title           | Minotari to Tari Submarine Swaps                                          |
| Last Modified   | 2026-09-09                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Proposed                                                                  |
| Type            | RFC                                                                       |
| Created         | 2022-11-15                                                                |
| References      | [A-TIP-RFC-MT-0241](RFC-0241_AtomicSwapXMR.md)                            |

## Minotari to Tari Submarine Swaps

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [S W van Heerden](https://github.com/SWvheerden)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2021 The Tari Development Community

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

This Request for Comment (RFC) describes how a trustless swap between Minotari on the base layer and Tari on the
Ootle is constructed — the "peg-out" route out of the Ootle, given that the turbine model deliberately provides no
protocol-level peg-out.

## Related Requests for Comment

* [I-TIP-RFC-MT-0201: TariScript](RFC-0201_TariScript.md)
* [I-TIP-RFC-MT-0202: TariScript Opcodes](RFC-0202_TariScriptOpcodes.md)
* [I-TIP-RFC-MT-0240: Atomic Swap](RFC-0240_AtomicSwap.md)
* [A-TIP-RFC-MT-0241: XMR Atomic Swap](RFC-0241_AtomicSwapXMR.md)
* [I-TIP-RFC-O-0320: The Turbine Model](RFC-0320_TurbineModel.md)
* [I-TIP-RFC-O-0350: The Tari Virtual Machine](RFC-0350_TariVM.md)

$$
\newcommand{\script}{\alpha} % utxo script
\newcommand{\input}{ \theta }
\newcommand{\cat}{\Vert}
\newcommand{\so}{\gamma} % script offset
\newcommand{\hash}[1]{\mathrm{H}\bigl({#1}\bigr)}
$$

## Comments

Any comments, changes or questions to this PR can be made in one of the following ways:

* Create a new PR on the Tari project [Github pull requests](https://github.com/tari-project/tari/pulls).
* Create a new issue on the Tari project [Github issues](https://github.com/tari-project/tari/issues).

## Status of this document

<div class="note">
<p>This RFC is a <strong>proposal</strong>. The cryptographic primitives both halves need are implemented and
exercised end-to-end on a local network, but no Minotari–Tari swap protocol is implemented, and the parameter
choices and the full security argument below still need work. See <a href="#open-questions">Open questions</a>.</p>
<p><strong>What changed.</strong> Earlier drafts described the Tari side as a Mimblewimble-style commitment locked by
a multi-party aggregate key $X = X_a + X_b + k_i \cdot G$, claimed by learning the counterparty's key half from the
base-layer script. That does not match how value is held on the Ootle, and it is not the mechanism that was built.
Value on the Ootle lives in vaults and stealth outputs, and the atomicity primitive that shipped is the
<strong>Schnorr adaptor signature</strong> — the same "scriptless script" idiom
<a href="RFC-0241_AtomicSwapXMR.md">A-TIP-RFC-MT-0241</a> already uses on the base layer. The Ootle half of this
document has been rewritten against those primitives; the Minotari half is unchanged.</p>
</div>

## Description

To exchange Tari and Minotari without a centralised exchange service, we need a submarine swap: an atomic swap
between the base layer and the Ootle.

This is not a peg-out. [I-TIP-RFC-O-0320](RFC-0320_TurbineModel.md) argues that any protocol-level peg-out coupled
with a burn-based peg-in is an existential risk to the base layer, because it would require the base layer to mint
coins on the strength of a mechanism external to it. A swap has no such property: no coins are created on either
chain, existing value simply changes hands. This is why the turbine model can refuse a peg-out and still let holders
convert Tari back to Minotari.

## Method

The happy path of a Minotari–Tari submarine swap. We assume Alice wants to trade her Minotari for Bob's Tari.

* **Negotiation** — both parties agree the amounts, the keys, and the timelock parameters.
* **Commitment** — both parties commit to the keys and to the swap point $T = t \cdot G$.
* **Minotari payment** — Alice pays into a base-layer UTXO carrying the script described
  [below](#tariscript).
* **Tari payment** — Bob pays into an Ootle stealth output whose condition tree has a 2-of-2 claim leaf and a
  timelocked refund leaf.
* **Claim Minotari** — Bob spends the Minotari UTXO. Doing so publishes the swap secret $t$.
* **Claim Tari** — Alice reads $t$ off the base layer, completes Bob's adaptor pre-signature, and claims the Tari.

Note the notation used in [TariScript], specifically on the
[transaction inputs](RFC-0201_TariScript.md#transaction-input-changes) and
[transaction outputs](RFC-0201_TariScript.md#transaction-output-changes). Other notation is in the
[Notation](#notation) section.

## TL;DR

Alice wants to exchange her Minotari for Bob's Tari. Because they do not trust each other, each locks their side
behind a construction that the other can only unlock by publishing a secret — and that each can recover from if the
counterparty walks away.

A single scalar $t$ ties the two halves together. Alice locks Minotari in a base-layer UTXO whose script cannot be
satisfied without publishing $t$. Bob locks Tari in an Ootle stealth output whose claim path needs signatures from
both of them, and hands Alice his signature *pre-signed under the point* $T = t \cdot G$ — a signature that is
verifiable but unusable until someone supplies $t$.

Alice cannot claim the Tari until she learns $t$, and the only way $t$ becomes public is Bob claiming the Minotari.
So either both legs complete, or neither does.

Both sides have a timed escape. The base-layer script has two lock heights, and the Ootle output has a timelocked
refund leaf that returns the funds to Bob. Before the first lock height only Bob can take the Minotari — the *swap*
transaction. If Bob disappears after Alice has funded, Alice reclaims her Minotari between the two lock heights — the
*refund* transaction. After the second lock height only Bob can take the Minotari — the *lapse* transaction.

## Heights, Security, and other considerations

A few things need care, as there are scenarios that reduce the security of the swap.

The first lock height must be large enough to give ample time for Alice's Minotari UTXO to be mined with a safe number
of confirmations, and for Bob to fund the Ootle side and have it finalised. The second lock height must give Alice
ample time after the first to reclaim her Minotari. Larger heights make refunds slower but safer.

The Ootle refund leaf's `AfterEpoch` deadline must be set relative to the base-layer lock heights, not independently.
An Ootle epoch is a base-layer block count ([I-TIP-RFC-O-0325](RFC-0325_DanTimeManagement.md)), so the two clocks are
commensurable, but the Ootle's view of the base layer is deliberately lagged — the refund deadline must allow for
that lag plus the epoch-transition spread.

Allowing both parties to claim the Minotari after the second lock height is, on face value, the safer option. It
opens an attack, though: either party could claim the Tari while claiming the Minotari, by front-running. The
counterparty monitors broadcast transactions, and on identifying the lapse transaction broadcasts both their own
lapse transaction and the transaction claiming the Tari, with high fees. Miners prefer higher fees, so the
counterparty can walk away with both sides. This is why the lapse path is restricted to Bob.

It is also possible for a transaction to sit unmined after being submitted to the mempool — a combination of a busy
network, insufficient fees, or too short a time lock. Once one of these transactions reaches a mempool the details
are already exposed: part of the secret is public even though the transaction has not been mined. This is true of any
HTLC-like construction on any blockchain. Where fees are too low, a child-pays-for-parent transaction can bump them
to get the parent mined.

## The swap secret and why publishing it is safe

The swap turns on one scalar, $t$, with public point $T = t \cdot G$.

The base-layer script forces the spending party to supply $t$ as script input data, evaluated with the
`ToRistrettoPoint` opcode, which is checked against $T$. On the Ootle, $t$ is the adaptor secret: Bob's contribution
to the 2-of-2 claim arrives as a pre-signature under $T$, and completing it requires $t$.

Publishing $t$ is safe because it is a one-time value with no standing authority. It is not an account key, not a
spend key, and not half of one. It authorises exactly one thing — completing one pre-signature over one message — and
that pre-signature is itself bound to a specific transaction. Learning $t$ tells you nothing about either party's
long-term keys.

This is the property that makes the classic scriptless-script argument work. Given

$$
\begin{aligned}
\hat{s} &= r + e \cdot x \\\\
s &= \hat{s} + t \\\\
\end{aligned}
$$

anyone holding the pre-signature $\hat{s}$ who observes the completed signature $s$ recovers $t = s - \hat{s}$, while
the signer's key $x$ stays private: recovering $x$ from $\hat{s}$ would require solving the discrete logarithm
problem, since $r$ is a freshly sampled nonce known only to the signer.

## Method

### Detail

The two halves use different mechanisms to enforce the same thing — that taking one side publishes $t$.

On the base layer we rely on TariScript. Based on
[Point Time Lock Contracts](https://suredbits.com/payment-points-part-1/), the script forces the spending party to
supply $t$ as input data, evaluated via `ToRistrettoPoint` and compared against $T$.

On the Ootle we rely on adaptor signatures, and no script-level revelation is needed: completing the signature *is*
the revelation. This is the cleaner half — it leaves nothing on-chain that identifies the transaction as part of a
swap, since the completed signature is an ordinary Schnorr signature.

### TariScript

The script used for the Minotari UTXO is as follows:

``` TariScript,ignore
   ToRistrettoPoint
   CheckHeight(height_1)
   LtZero
   IFTHEN
      PushPubkey(T)
      EqualVerify
      HashSha256
      PushHash(HASH256{pre_image})
      EqualVerify
      PushPubkey(K_{Sb})
   Else
      CheckHeight(height_2)
      LtZero
      IFTHEN
         PushPubkey(T_a)
         EqualVerify
         PushPubkey(K_{Sa})
      Else
         PushPubkey(T)
         EqualVerify
         PushPubkey(K_{Sb})
      ENDIF
   ENDIF
```

Before `height_1`, Bob can claim the Minotari UTXO by supplying `pre_image` and the swap secret $t$. After `height_1`
but before `height_2`, Alice can claim it by supplying her refund secret $t_a$. After `height_2`, Bob can claim it by
supplying $t$.

### The Ootle output

Bob funds a stealth output holding the agreed amount of Tari. A stealth output carries a **condition tree**: a set of
leaves, each a conjunction of atomic conditions, committed to as a Merkle root. Spending reveals one leaf and an
inclusion proof for it, so the paths not taken are never disclosed.

The tree has two leaves:

| Leaf     | Condition                                                    | Who can take it              |
|:---------|:---------------------------------------------------------------|:-----------------------------|
| `claim`  | `AccessRule(AllOf[P_a, P_b])` — both signatures required       | Alice, once she learns $t$   |
| `refund` | `All([Builtin(AfterEpoch(e_refund)), AccessRule(P_b)])`        | Bob, after $e_\text{refund}$ |

$P_a$ and $P_b$ are one-time keys, not account keys. They should be derived unlinkably from the output's nonce, so
that the revealed leaf exposes only single-use keys and never either party's account identity.

The refund leaf is a plain timelock to the funder. Bob does not need anything from Alice to recover his Tari if the
swap stalls — which is a simplification over earlier drafts, where the Ootle-side refund depended on Alice revealing
a key half.

Two further condition types are available and are not used here, but are worth noting for variants: a `Builtin`
hashlock, which admits a spend on presentation of a preimage, and a `TemplateFunction` predicate, which runs a WASM
function over the spending transfer. A hashlock leaf would give a more conventional HTLC construction at the cost of
the privacy that the adaptor path buys.

### Negotiation

Alice and Bob negotiate the exchange rate and the amounts, and agree how the two outputs will look. The following
must be finalised:

* the amount of Minotari to swap for the amount of Tari,
* the swap point $T$, and Alice's refund point $T_a$,
* the one-time Ootle claim keys $P_a$, $P_b$,
* the Minotari [script key] parts \\(K_{Sa}\\), \\(K_{Sb}\\),
* the [TariScript] to be used in the Minotari UTXO, and its two lock heights,
* the Ootle refund epoch $e_\text{refund}$,
* the blinding factor \\(k_i\\) for the Minotari UTXO, which can be a Diffie-Hellman between their Tari network
  addresses.

### Commitment phase

Bob samples the swap secret $t$ and publishes $T = t \cdot G$. Alice samples her refund secret $t_a$ and publishes
$T_a$. Each party publishes their one-time Ootle claim public key.

Alice needs from Bob: the script public key \\( K_{Sb}\\), the swap point $T$, and the claim key $P_b$.
Bob needs from Alice: the script public key \\( K_{Sa}\\), the refund point $T_a$, and the claim key $P_a$.

### Minotari payment

Alice constructs the Minotari UTXO with the correct [script](#tariscript) and publishes the transaction, knowing she
can reclaim her Minotari after `height_1` if Bob vanishes or tries to break the agreement. This is done with standard
Mimblewimble rules and signatures.

### Tari payment

Once Alice's UTXO is mined with the agreed script, Bob funds the Ootle stealth output with the condition tree above.

Bob then constructs the claim transaction that Alice would use — spending the stealth output via its `claim` leaf —
derives its authorization message, and sends Alice an **adaptor pre-signature** of his side under $T$. Alice verifies
the pre-signature against $P_b$, $T$ and that message. Verification guarantees that the pre-signature can be
completed into a valid signature by, and only by, someone holding $t$.

At this point Alice holds one of the two signatures she needs, in a form she cannot yet use.

### Claim Minotari

Alice provides Bob with the `pre_image` required to spend the Minotari UTXO. She still lacks $t$, so she cannot claim
the Tari yet.

Bob supplies the `pre_image` and the swap secret $t$ as transaction input data, satisfying the script, and takes the
Minotari.

### Claim Tari

$t$ is now public on the base layer. Alice reads it from Bob's spending `input_data`, completes Bob's pre-signature
into an ordinary Schnorr signature, and submits the claim transaction carrying both her own signature and Bob's
completed one. The 2-of-2 claim leaf is satisfied and the Tari is hers.

Equivalently, Alice can recover $t$ from any completed signature she sees paired with the pre-signature she holds;
she does not have to parse the base-layer script input.

The Ootle sees nothing unusual. The completed signature is an ordinary Schnorr signature over the transaction, and
the engine verifies it with no adaptor awareness.

### The refund

If Bob never funds the Ootle side, or disappears, Alice waits for `height_1` and reclaims her Minotari by supplying
her refund secret $t_a$. Bob's Tari, if he did fund, is recovered through the `refund` leaf once
$e_\text{refund}$ passes; he needs nothing from Alice to do it.

### The lapse transaction

If Alice never provides the `pre_image`, Bob waits for `height_2` and claims the Minotari by supplying $t$. Doing so
publishes $t$, so if Alice reappears she can still complete the pre-signature and claim the Tari — both legs settle,
just late. If Alice never reappears, Bob recovers his Tari through the `refund` leaf.

## Open questions

These need to be resolved before this document should be treated as implementable.

1. **Parameter relationships.** `height_1`, `height_2` and $e_\text{refund}$ must be constrained relative to one
   another so that no two escape paths are simultaneously live. In particular, $e_\text{refund}$ must not become
   spendable before `height_2`, or Bob could take his Tari back *and* lapse-claim the Minotari.
2. **Ootle finality.** Alice must know how many blocks to wait before treating Bob's funding of the Ootle output as
   final, expressed in terms the base-layer lock heights can be set against.
3. **Fee payment on the claim path.** The claim transaction pays its fee from the swapped funds. Whether the claim
   leaf should constrain the resulting outputs — with a `Covenant` atomic condition — to stop a malformed claim
   draining value to fees is unresolved.
4. **Who samples $t$.** Above, Bob does. Whether the protocol is better with Alice sampling it, and Bob pre-signing
   under a point she supplies, changes which party can stall and needs analysis.
5. **A security proof** of the composed protocol, in the style of the one in
   [A-TIP-RFC-MT-0241](RFC-0241_AtomicSwapXMR.md).

## Implementation status

The primitives both halves rely on exist today.

| Primitive                                  | Where                                                              |
|:-------------------------------------------|:---------------------------------------------------------------------|
| `ToRistrettoPoint`, `CheckHeight` opcodes  | `tari`, `infrastructure/tari_script`                                 |
| Base-layer atomic swap machinery           | `tari`, wallet output manager and transaction service                |
| Schnorr adaptor signatures over Ristretto  | `tari-ootle`, `crates/wallet/crypto/src/adaptor.rs`                  |
| Pre-sign / complete / extract on a transaction authorization | `tari-ootle`, `crates/wallet/ootle-rs/src/transaction/adaptor.rs` |
| Stealth outputs with condition trees, `AfterEpoch`, `BeforeEpoch`, hashlock | `tari-ootle`, `crates/template_lib_types/src/stealth` |
| A worked 2-of-2 adaptor claim on localnet  | `tari-ootle`, `crates/wallet/ootle-rs/examples/adaptor_claim.rs`     |

What does not exist is the swap protocol itself: the negotiation, the coupling of base-layer lock heights to the
Ootle refund epoch, and the wallet support to drive both legs.

## Notation

Where possible, the "usual" notation is used to denote terms commonly found in cryptocurrency literature. Lower case 
characters are used as private keys, while uppercase characters are used as public keys. New terms introduced here are 
assigned greek lowercase letters in most cases. Some terms used here are noted down in [TariScript]. 

| Name                        | Symbol                | Definition |
|:----------------------------|-----------------------| -----------|
| subscript s                 | \\( _s \\)            | The swap transaction |
| subscript r                 | \\( _r \\)            | The refund transaction |
| subscript l                 | \\( _l \\)            | The lapse transaction |
| subscript a                 | \\( _a \\)            | Belongs to Alice |
| subscript b                 | \\( _b \\)            | Belongs to Bob |
| Swap secret                 | \\( t \\)             | The scalar tying the two legs together; published when the Minotari UTXO is spent |
| Swap point                  | \\( T = t \\cdot G \\) | The adaptor point Bob pre-signs under, and the point the TariScript checks against |
| Alice's refund secret       | \\( t_a \\)           | The scalar Alice publishes to take the refund path on the base layer |
| Alice's refund point        | \\( T_a \\)           | \\( t_a \\cdot G \\) |
| Alice's Ootle claim key     | \\( P_a \\)           | Alice's one-time key in the 2-of-2 claim leaf |
| Bob's Ootle claim key       | \\( P_b \\)           | Bob's one-time key in the 2-of-2 claim leaf |
| Refund epoch                | \\( e_r \\)           | The Ootle epoch after which Bob may take the `refund` leaf |
| Script key                  | \\( K_s \\)           | The [script key] of the utxo |
| Alice's Script key          | \\( K_{Sa} \\)        | Alice's partial [script key]  |
| Bob's Script key            | \\( K_{Sb} \\)        | Bob's partial [script key]  |
| Pre-signature               | \\( \\hat{s} \\)       | Bob's adaptor pre-signature of his side of the 2-of-2 claim leaf |
| Completed signature         | \\( s = \\hat{s} + t \\) | The ordinary Schnorr signature Alice submits, from which \\( t \\) is recoverable |
| Ristretto G generator       | \\(k \\cdot G  \\)     | Value k over Curve25519 G generator encoded with Ristretto|


# Change Log

| Date        | Change                                                                              | Author     |
|:------------|:--------------------------------------------------------------------------------------|:-----------|
| 09 Sep 2026 | Rewrite the Ootle half against adaptor signatures and stealth condition trees        | Tari Labs  |
| 23 Oct 2023 | Thaum -> Tari                                                                        | CjS77      |
| 15 Nov 2022 | First outline                                                                        | SWvHeerden |

[HTLC]: Glossary.md#hashed-time-locked-contract
[Mempool]: Glossary.md#mempool
[Mimblewimble]: Glossary.md#mimblewimble
[TariScript]: Glossary.md#tariscript
[script key]: Glossary.md#script-keypair
[sender offset key]: Glossary.md#sender-offset-keypair
[script offset]: Glossary.md#script-offset
