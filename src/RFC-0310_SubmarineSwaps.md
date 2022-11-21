# RFC-310/Submarine Swap

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [S W van Heerden](https://github.com/SWvheerden)

<!-- TOC -->
  * [Goals](#goals)
  * [Related Requests for Comment](#related-requests-for-comment)
  * [Comments](#comments)
  * [Description](#description)
  * [Method](#method)
  * [TL;DR](#tldr)
  * [Heights, Security, and other considerations](#heights-security-and-other-considerations)
  * [Key construction](#key-construction)
  * [Key security](#key-security)
  * [Method](#method)
    * [Detail](#detail)
    * [TariScript](#tariscript)
    * [Negotiation](#negotiation)
    * [Key selection](#key-selection)
    * [Commitment phase](#commitment-phase)
      * [Starting values](#starting-values)
    * [Tari payment](#tari-payment)
    * [Thaum payment](#thaum-payment)
    * [Claim Tari](#claim-tari)
    * [Claim Thaum](#claim-thaum)
    * [The refund](#the-refund)
    * [The lapse transaction](#the-lapse-transaction)
  * [Notation](#notation)
<!-- TOC -->

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

This Request for Comment (RFC) aims to describe how an Atomic swap between Tari and Thaum will be created.
> Note: Name is still pending going with Wrapped Tari aka Thaum for this document till a proper name has been decided apon. 

## Related Requests for Comment

* [RFC-0201: TariScript](RFC-0201_TariScript.md)
* [RFC-0202: TariScript Opcodes](RFC-0202_TariScriptOpcodes.md)
* [RFC-0240: AtomicSwap ](RFC-0240_AtomicSwap.md)
* [RFC-0241: AtomicSwap XMR](RFC-0241_AtomicSwapXMR.md)


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

## Description

To be able to exchange Tari and Thaum without the use of some centralized exhange service, we need to do Submarine swaps or Atomic swaps between the two.
We want to keep Thaum as bare bones as possible with if possible just a commitment and perhaps a rangeproof, this means that we will not have access to
smart contract features typically required for doing submarine swaps. This does not mean it is not possible to do atomic swaps with non smart contract coins,
look at [RFC-0241: AtomicSwap XMR](RFC-0241_AtomicSwapXMR.md) to see how this is done with Tari and Monero.

## Method

The primary, happy path outline of a Tari - Thaum submarine swap is described here, and more detail will follow. We assume
that Alice wants to trade her Tari for Bob's Thaum.

* Negotiation - Both parties negotiate the value and other details of the Tari and Thaum commitment's.
* Commitment - Both parties commit to the keys, nonces, inputs, and outputs to use for the transaction.
* Tari payment - Alice makes the Tari payment to a UTXO containing a "special" script described below.
* Thaum Payment - The Thaum payment is made to a multiparty [scriptless script](https://tlu.tarilabs.com/cryptography/introduction-to-scriptless-scripts) commitment.
* Claim Tari - Bob redeems the Tari, and in doing so, reveals the Thaum private key to Alice only.
* Claim Thaum - Alice may claim the Thaum using the revealed key.

Please take note of the notation used in [TariScript] and specifically notation used on the signatures on the [transaction inputs](RFC-0201_TariScript.md#transaction-input-changes) and on the signatures on the [transaction outputs](RFC-0201_TariScript.md#transaction-output-changes).
We will note other notations in the [Notation](#notation) section.

## TL;DR

The scheme revolves around Alice, who wants to exchange her Tari for Bob's Thaum. Because they don't trust each other, 
they have to commit some information to do the exchange. And if something goes wrong here, we want to ensure that we can 
refund both parties either in Thaum or Tari.

How this works is that Alice and Bob create a shared output on both chains. The Thaum output is a simple aggregate key 
to unlock the commitment, while multiple keys are needed to unlock the Tari UTXO. An aggregate key locks this Thaum commitment
that neither Alice nor Bob knows, but they both know half of the key. The current Tari block height determines the unlocking 
key for the Tari UTXO.

The process is started by Alice and Bob exchanging and committing to some information. Alice is the first to publish a 
transaction, which creates the Tari UTXO. If Bob is happy that the Tari UTXO has been mined and verifies all the 
information, he will publish a transaction to create the Thaum commitment.

The TariScript script on the UTXO ensures that they will have to reveal their portion of the Thaum key when either 
Alice or Bob spends this. This disclosure allows the other party to claim the Thaum by being the only one to own the 
complete Thaum aggregate key.

The script will ensure that at any point in time, at least someone can claim the Tari UTXO, and if that person does so, 
the other party can claim the Thaum commitment by looking at the spending data. It has two lock heights, determining who can 
claim the Tari UTXO if the happy path fails. Before the first lock height, only Bob can claim the Tari; we call this the 
swap transaction.

If Bob disappears after Alice has posted the Tari UTXO, Alice can claim the Tari after the first lock height and before 
the second lock height; we call this the refund transaction. It ensures that Alice can reclaim her Tari if Bob 
disappears, and if Bob reappears, he can reclaim his Thaum.

That leaves us with the scenario where Alice disappears after Bob posts the Thaum transaction, in which case we need to 
protect Bob. After the second lock height, only Bob can claim the Tari; we call this the lapse transaction. The lapse 
transaction will reveal Bob's Thaum key so that if Alice reappears, she can claim the Thaum.

## Heights, Security, and other considerations

We need to consider a few things for this to be secure, as there are possible scenarios that can reduce the security in the atomic swap. 

When looking at the two lock heights, the first lock height should be sufficiently large enough to give ample time for Alice to post the Tari UTXO transaction and for it to be mined with a safe number of confirmations,
and for Bob to post the Monero transaction and for it to be mined with a safe number of confirmations. The second lock
height should give ample time for Alice after the first lock height to re-claim her Tari. Larger heights here might make
refunds slower, but it should be safer in giving more time to finalize this. 

Allowing both to claim the Tari after the second lock height is, on face value, a safer option. This can be done by enabling
either party to claim the script with the lapse transaction. The counterparty can then claim the Monero. However, this
will open up an attack vector to enable either party to claim the Monero while claiming the Tari. Either party could trivially
pull off such a scheme by performing a front-running attack and having a bit of luck. The counterparty monitors all broadcast 
transactions to base nodes. Upon identifying the lapse transaction, they do two things; in quick succession, broadcast 
their lapse transaction and the transaction to claim the Monero, both with sufficiently high fees. Base nodes will 
prefer to mine transactions with the higher fees, and thus the counterparty can walk away with both the Tari and the 
Monero.

It is also possible to prevent the transaction from being mined after being submitted to the mempool. This can be caused by a combination
of a too busy network, not enough fees, or a too-small period in the time locks. When one of these atomic swap transactions gets published to a mempool, we effectively already have all the details exposed. For the atomic swaps, it means we already revealed part of the Monero key, although
the actual Tari transaction has not been mined. But this is true for any HTLC or like script on any blockchain. But in the odd
chance that this does happen whereby the fees are too little and time locks not enough, it should be possible to do a child-pays-for-parent
transaction to bump up the fees on the transaction to get it mined and confirmed.

## Key construction

Using [multi-signatures](https://reyify.com/blog/flipping-the-scriptless-script-on-schnorr) with Schnorr signatures, we
need to ensure that the keys are constructed so that key cancellation attacks are not possible. To do this, we create new
keys from the chosen public keys \\(K_a'\\) and \\(K_b'\\)

$$
\begin{aligned}
K_a &=  \hash{\hash{K_a' \cat K_b'} \cat K_a' } * K_a' \\\\
k_a &=  \hash{\hash{K_a' \cat K_b'} \cat K_a' } * k_a' \\\\
K_b &=  \hash{\hash{K_a' \cat K_b'} \cat K_b' } * K_b' \\\\
k_b &=  \hash{\hash{K_a' \cat K_b'} \cat K_b' } * k_b' \\\\
\end{aligned}
\tag{1}
$$

## Key security

The risk of publicly exposing part of the Thaum private key is still secure because of how [ECC](https://cryptobook.nakov.com/asymmetric-key-ciphers/elliptic-curve-cryptography-ecc#private-key-public-key-and-the-generator-point-in-ecc) works. We can
add two secret keys together and share the public version of both. And at the same time, we know that no one can calculate
the secret key with just one part.

$$
\begin{aligned}
(k_a + k_b) \cdot G &= k_a \cdot G + k_b \cdot G\\\\
(k_a + k_b) \cdot G &= K_a + K_b \\\\
(k_a + k_b) \cdot G &= K \\\\
\end{aligned}
\tag{5}
$$

We know that \\(K\\), \\(K_a\\), \\(K_b\\) are public. While \\(k\\), \\(k_a\\), \\(k_b\\) are all private.

But if we expose \\(k_b\\), we can try to do the following:
$$
\begin{aligned}
(k_a + k_b) \cdot G &= K_a + K_b\\\\
k_a \cdot G &= (K_a + K_b - k_b \cdot G) \\\\
k_a \cdot G &= K_a \\\\
\end{aligned}
\tag{6}
$$

However, this is the Elliptic-Curve Discrete Logarithm Problem, and there is no easy solution to solve this on current computer
hardware. Thus this is still secure even though we leaked part of the secret key \\(k\\).

## Method

### Detail

We rely purely on TariScript to enforce the exposure of the private Thaum aggregate keys. Based on [Point Time Lock Contracts](https://suredbits.com/payment-points-part-1/), 
the script forces the spending party to supply their Thaum private key part as input data to the script, evaluated via the operation `ToRistrettoPoint`. This TariScript 
operation will publicly reveal part of the aggregated Thaum private key, but this is still secure: see [Key security](#key-security).

The simplicity of this method lies therein that the spending party creates all transactions on their 
own. Bob requires a pre-image from Alice to complete the swap transaction; Alice needs to verify that Bob published the 
Thaum transaction and that everything is complete as they have agreed. If she is happy, she will provide Bob with the 
pre-image to claim the Tari UTXO.



### TariScript

The Script used for the Tari UTXO is as follows:
``` TariScript,ignore
   ToRistrettoPoint
   CheckHeight(height_1)
   LtZero
   IFTHEN
      PushPubkey(X_b)
      EqualVerify
      HashSha256 
      PushHash(HASH256{pre_image})
      EqualVerify
      PushPubkey(K_{Sb})
   Else
      CheckHeight(height_2)
      LtZero
      IFTHEN
         PushPubkey(X_a)
         EqualVerify
         PushPubkey(K_{Sa})
      Else
         PushPubkey(X_b)
         EqualVerify
         PushPubkey(K_{Sb})
      ENDIF
   ENDIF
```

Before `height_1`, Bob can claim the Tari UTXO by supplying `pre_image` and his private Thaum key part `x_b`. After 
`height_1` but before `height_2`, Alice can claim the Tari UTXO by supplying her private Thaum key part `x_a`. After 
`height_2`, Bob can claim the Tari UTXO by providing his private Thaum key part `x_b`.

### Negotiation

Alice and Bob have to negotiate the exchange rate and the amount exchanged in the atomic swap. They also need to decide 
how the two UTXO's will look on the blockchain. To accomplish this, the following needs to be finalized:

* Amount of Tari to swap for the amount of Thaum
* Thaum public key parts \\(X_a\\), \\(X_b\\) ,and its aggregate form \\(X\\)
* Tari [script key] parts \\(K_{Sa}\\), \\(K_{Sb}\\) 
* The [TariScript] to be used in the Tari UTXO
* The blinding factor \\(k_i\\) for the Tari UTXO, which can be a Diffie-Hellman between their Tari addresses.


### Key selection

Using (1), we create the Thaum keys as they are multi-party aggregate keys.
The Thaum key parts for Alice and Bob is constructed as follows:


$$
\begin{aligned}
X_a' &= x_a' \cdot G \\\\
X_b' &= x_b' \cdot G \\\\
x_a &=  \hash{\hash{X_a' \cat X_b'} \cat X_a' } * x_a' \\\\
x_b &=  \hash{\hash{X_a' \cat X_b'} \cat X_b' } * x_b' \\\\
x_a &= x_a \\\\
x_b &= x_b \\\\
X_a &=  \hash{\hash{X_a' \cat X_b'} \cat X_a' } * X_a' \\\\
X_b &=  \hash{\hash{X_a' \cat X_b'} \cat X_b' } * X_b' \\\\
x &= x_a + x_b + k_i \\\\
X &= X_a + X_b + k_i \cdot G_m\\\\
x &= x_a + x_b + k_i \\\\
X &= X_a + X_b + k_i \cdot G\\\\
\end{aligned}
\tag{7}
$$


### Commitment phase

This phase allows Alice and Bob to commit to using their keys.

#### Starting values

Alice needs to provide Bob with the following:

* Script public key: \\( K_{Sa}\\)
* Thaum public key \\( X_a'\\)

Bob needs to provide Alice with the following:

* Script public key: \\( K_{Sb}\\)
* Thaum public key \\( X_b'\\)

Using the above equations in (7), Alice and Bob can calculate \\(X\\), \\(X_a\\), \\(X_b\\)



### Tari payment

Alice will construct the Tari UTXO with the correct [script](#tariscript) and publish the containing transaction to the 
blockchain, knowing that she can reclaim her Tari if Bob vanishes or tries to break the agreement. This is done with 
standard Mimblewimble rules and signatures.

### Thaum payment

When Bob sees that the Tari UTXO that Alice created is mined on the Tari blockchain with the correct script, Bob can
publish the Thaum transaction containing the Thaum commitment with the aggregate key \\(X = X_a + X_b + k_i \cdot G \\).

### Claim Tari 

When Alice sees that the Thaum commitment that Bob created is confirmed on the second layer containing the correct aggregate 
key \\(X\\), she can provide Bob with the required `pre_image` to spend the Tari UTXO. She does not have the 
missing key \\(x_b \\) to claim the Thaum yet, but it will be revealed when Bob claims the Tari. 

Bob can now supply the `pre_image` and his Monero private key as transaction input to unlock the script.

### Claim Thaum

Alice can now see that Bob spent the Tari UTXO, and by examining the `input_data` required to satisfy the script, she 
can learn Bob's secret Thaum key. Although this private key \\( x_b \\) is now public knowledge, her part of the Thaum spend key 
is still private, and thus only she knows the complete Thaum spend key. She can use this knowledge to claim the Thaum commitment.

### The refund

If something goes wrong and Bob never publishes the Thaum or disappears, Alice needs to wait for the lock height
`height_1` to pass. This will allow her to reclaim her Tari, but in doing so, she needs to publish her Thaum secret key 
as input to the script to unlock the Tari. When Bob comes back online, he can use this public knowledge to reclaim his 
Thaum, as only he knows both parts of the Thaum commitment spend key.


### The lapse transaction

If something goes wrong and Alice never gives Bob the required `pre_image`, Bob needs to wait for the lock height
`height_2` to pass. This will allow him to claim the Tari he wanted all along, but in doing so, he needs to publish
his Thaum secret key as input to the script to unlock the Tari. When Alice comes back online, she can use this public 
knowledge to claim the Thaum she wanted all along as only she now knows both parts of the Thaum commitment spend key.


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
| Thaum key                    | \\( X \\)             | Aggregate Thaum public key |
| Alice's Thaum key            | \\( X_a \\)           | Alice's partial Thaum public key |
| Bob's Thaum key              | \\( X_b \\)           | Bob's partial Thaum public key  |
| Script key                  | \\( K_s \\)           | The [script key] of the utxo |
| Alice's Script key          | \\( K_sa \\)          | Alice's partial [script key]  |
| Bob's Script key            | \\( K_sb \\)          | Bob's partial [script key]  |
| Alice's adaptor signature   | \\( b'_{Sa} \\)       | Alice's adaptor signature for the signature \\( b_{Sa} \\) of the script_signature of the utxo |
| Bob's adaptor signature     | \\( b'_{Sb} \\)       | Bob's adaptor signature for the \\( b_{Sb} \\) of the script_signature of the utxo |
| Ristretto G generator       | \\(k \cdot G  \\)     | Value k over Curve25519 G generator encoded with Ristretto|


[HTLC]: Glossary.md#hashed-time-locked-contract
[Mempool]: Glossary.md#mempool
[Mimblewimble]: Glossary.md#mimblewimble
[TariScript]: Glossary.md#tariscript
[TariScript]: Glossary.md#tariscript
[script key]: Glossary.md#script-keypair
[sender offset key]: Glossary.md#sender-offset-keypair
[script offset]: Glossary.md#script-offset
