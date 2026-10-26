# I-TIP-RFC-MT-0203: Stealth addresses

| TIP             | [I-TIP-RFC-MT-0203](#I-TIP-RFC-MT-0203-stealth-addresses) |
|-----------------|---------------------------------------------------------------------------|
| Title           | Stealth Addresses                                                         |
| Last Modified   | 2026-10-22                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Implemented                                                               |
| Type            | RFC                                                                       |
| Created         | 2022-06-01                                                                |
| References      |                                                                           |

## Stealth addresses

![status: stable](theme/images/status-stable.svg)


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
SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT
RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all
capitals, as shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update without
notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

This Request for Comment (RFC) presents a design for a one-time (stealth) address protocol useful for one-sided payments
to improve recipient privacy for payments on the Tari base layer.

## Related Requests for Comment

- [RFC-0201: TariScript](RFC-0201_TariScript.md)

## Introduction

The Tari protocol extends the [Mimblewimble] protocol to include scripting in the form of [TariScript]. One of the 
first features implemented using [TariScript] was [one-sided payments]. These are payments to a recipient that do not 
require an interactive negotiation in the same way a standard [Mimblewimble] transaction does. One of the main downsides
of the current implementation of [one-sided payments] is that the script key used is the public key of the recipient's 
wallet. This public key is embedded in the [TariScript] of the [UTXO] created by the sender. The issue is that it becomes
very easy for a third party to scan the blockchain to look for one-sided transaction outputs being sent to a given wallet. 
In order to alleviate this privacy leak, this RFC proposes the use of one-time (stealth) addresses to be used as the script
key when sending a one-sided payment.

## Background

Stealth addresses were first proposed on the Bitcoin Talk forum by user [Bytecoin]. The concept was further refined by
[Peter Todd], using a design similar to the [BIP-32] style of address generation. In this approach, the sender can use an
ephemeral public key (derived from a nonce) to perform a non-interactive Diffie-Hellman exchange with the recipient's
public key, and use this to derive a one-time public key to which only the recipient can derive the corresponding private
key. This reduces on-chain linkability (but, importantly, does not eliminate it).

The approach was further extended in the [CryptoNote] whitepaper to support a dual-key design, whereby a separate scanning
key is also used in the one-time address construction; this enables identification of outputs, but requires the spending
key to derive the private key required to spend the output.

It is important to note that while one-time addresses are not algebraically linkable, it is possible to observe transactions
that consume multiple such outputs and infer common ownership of them.

For use in Tari, the dual-key design is used. A Tari wallet address carries both a public view key and a public spend key.
The view key is sufficient to identify outputs, decrypt their values and confirm that they are spendable by the wallet,
while the spend key is required to spend them.

## Keys and notation

A recipient holds two key pairs:

- a spend key pair \\( (a, A = a \cdot G) \\), and
- a view key pair \\( (k_V, K_V = k_V \cdot G) \\).

Both public keys are published in the recipient's (dual) Tari address. An address that carries only a spend key (a single
address) cannot receive one-sided stealth payments, and a sender **MUST** refuse to build one to it.

The following domain-separated hash functions are used. Each is Blake2b-512, and the 64-byte output is reduced to a scalar
with a uniform (wide) reduction:

| Symbol | Hash domain | Label | Used for |
|:-------|:------------|:------|:---------|
| \\( H_{mask} \\) | `com.tari.base_layer.wallet.output_spending_keys` v1 | (none) | commitment mask |
| \\( H_{enc} \\) | `com.tari.base_layer.wallet.output_encryption_keys` v1 | (none) | encrypted data key |
| \\( H_{script} \\) | `com.tari.base_layer.core.transactions.key_manager` v1 | `script key` | one-time script key |

\\( H_{mask} \\) and \\( H_{enc} \\) take the compressed encoding of a Diffie-Hellman point as input; \\( H_{script} \\) takes the
32-byte encoding of a scalar.

## One-time (stealth) addresses

Every TariScript output already carries a sender offset public key \\( K_{O} \\), whose private key \\( k_{O} \\) is generated
fresh by the sender for each output. It therefore serves as the ephemeral Diffie-Hellman nonce, and no separate nonce is
included in the script.

The protocol a sender uses to make a one-sided payment of value \\( v \\) to the recipient is as follows:

1. Compute the Diffie-Hellman shared secret with the recipient's **view** key, \\( S = k_{O} \cdot K_V \\).
2. Derive the commitment mask \\( k_i = H_{mask}(S) \\) and build the commitment \\( C = k_i \cdot G + v \cdot H \\).
3. Derive the encryption key \\( k_E = H_{enc}(S) \\) and use it to encrypt the value, the commitment mask and the memo into
   the output's encrypted data.
4. Compute the one-time script key \\( K_S = H_{script}(k_i) \cdot G + A \\).
5. Set the script to `PushPubkey(K_S)`.

To identify [one-sided payments], the recipient scans the blockchain and, for each output, does the following to test for
ownership:

1. Compute the shared secret \\( S' = k_V \cdot K_{O} \\) from the output's sender offset public key.
2. Derive \\( k_E' = H_{enc}(S') \\) and attempt to decrypt the encrypted data. If decryption fails, the output is not ours.
3. Check that the decrypted value \\( v \\) and mask \\( k_i \\) open the commitment, i.e. \\( C = k_i \cdot G + v \cdot H \\). If
   they do not, the output is not ours.
4. Compute \\( K_S' = H_{script}(k_i) \cdot G + A \\). If the script is not `PushPubkey(K_S')`, the output is not ours.

If all checks pass, the recipient can produce the required script signature using the one-time private key
\\( k_S = H_{script}(k_i) + a \\).

## View-only wallets

Every step of the scanning procedure above uses only the private view key \\( k_V \\) and the **public** spend key \\( A \\).
A view-only wallet holding \\( (k_V, A) \\) can therefore identify its outputs, recover their values and memos, and confirm
that each one is spendable by the owner of \\( a \\). It cannot spend them, because the script signature requires
\\( k_S \\), and therefore \\( a \\).

Note that the view key reveals the commitment mask \\( k_i \\) of every received output. In plain [Mimblewimble] the mask
alone is spend authority; in Tari it is not, because spending also requires the script signature. The view key **MUST**
nevertheless be treated as confidential, as it reveals all received values and memos.

This construction also allows a hardware wallet to keep \\( a \\) on the device while a helper scans with \\( k_V \\); see
[RFC-0205: Hardware Transactions](RFC-0205_HardwareTransactions.md).

## Notes

Earlier revisions of this RFC described a single-key construction, in which the shared secret was computed against the
spend key, \\( c = H( k_{O} \cdot A ) \\) with \\( K_S = c \cdot G + A \\), optionally with the script
`PushPubkey(R) Drop PushPubkey(K_S)`. One-sided payments do not use that construction. Under it, only the holder of
\\( a \\) could compute \\( c \\), so a wallet holding only the view key could not confirm ownership of an output.

The single-key form \\( H( k \cdot A ) \cdot G + A \\) (hashed with the label `stealth_address`) is still used outside
one-sided payment scripts, for example for burn-claim public keys and for message signing with an offset spend key.

[tariscript]: ./Glossary.md#tariscript
[mimblewimble]: ./Glossary.md#mimblewimble
[one-sided payments]: ./RFC-0201_TariScript.md#one-sided-payment
[one-sided payment]: ./RFC-0201_TariScript.md#one-sided-payment
[utxo]: ./Glossary.md#unspent-transaction-outputs
[bytecoin]: https://bitcointalk.org/index.php?topic=5965.0
[Cryptonote]: https://web.archive.org/web/20200926050427/https://cryptonote.org/whitepaper.pdf
[Peter Todd]: https://www.mail-archive.com/bitcoin-development@lists.sourceforge.net/msg03613.html
[BIP-32]: https://en.bitcoin.it/wiki/BIP_0032

# Change Log

| Date        | Change                       | Author    |
|:------------|:-----------------------------|:----------|
| 01 Jun 2022 | First draft                  | philip-za |
| 26 Oct 2022 | Stabilise RFC                | CjS77     |
