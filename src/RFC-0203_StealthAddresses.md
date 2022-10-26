# RFC-0203/Stealth addresses

## Stealth addresses

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Philip Robinson](https://github.com/philipr-za)

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

For use in Tari, single-key one-time addresses are supported.

## One-time (stealth) addresses

Single-key one-time stealth addresses require only that a recipient possess a private key \\( a \\) and corresponding public
key \\( A = a \cdot G \\), and distribute the public key out of band to receive [one-sided payments] in a non-interactive
manner.

The protocol that a sender will use to make a payment to the recipient is as follows:
1. Generate a random nonce \\( r \\) and use it to produce an ephemeral public key \\( R = r \cdot G \\).
2. Compute a Diffie-Hellman exchange to obtain the shared secret \\( c = H( r \cdot A ) \\), where \\( H \\) is a cryptographic
hash function.
3. Include \\( K_S = c \cdot G + A \\) as the last public key in a [one-sided payment] script in a transaction.
4. Include \\( R \\) in the script for use by the recipient, but `DROP` it so that it is not used in script execution.
This changes the script for a [one-sided payment] from `PushPubkey(K_S)` to `PushPubkey(R) Drop PushPubkey(K_S)`.

To identify [one-sided payments], the recipient scans the blockchain for outputs containing a [one-sided payment] script. It
then does the following to test for ownership:
1. Extract the ephemeral public key \\( R \\) from the script.
2. Compute a Diffie-Hellman exchange to obtain the shared secret \\( c = H( a \cdot R ) \\).
3. Compute \\( K_S' = c \cdot G + A \\).
If \\( K_S' = K_S \\) is included in the script, the recipient can produce the required script signature using the corresponding
one-time private key \\( c + a \\).

## Implementation notes

* Stealth addresses were included in the Tari Console Wallet as of version v0.35.0 (2022-08-11).
* The FFI (used in Aurora) uses stealth addresses by default as of libwallet-v0.35.0 (2022-08-11).

[tariscript]: ./Glossary.md#tariscript
[mimblewimble]: ./Glossary.md#mimblewimble
[one-sided payments]: ./RFC-0201_TariScript.md#one-sided-payment
[one-sided payment]: ./RFC-0201_TariScript.md#one-sided-payment
[utxo]: ./Glossary.md#unspent-transaction-outputs
[bytecoin]: https://bitcointalk.org/index.php?topic=5965.0
[Cryptonote]: https://cryptonote.org/whitepaper.pdf
[Peter Todd]: https://www.mail-archive.com/bitcoin-development@lists.sourceforge.net/msg03613.html
[BIP-32]: https://en.bitcoin.it/wiki/BIP_0032

# Change Log

| Date        | Change                       | Author    |
|:------------|:-----------------------------|:----------|
| 26 Oct 2022 | Stabilise RFC                | CjS77     |
| 01 Jun 2022 | First draft                  | philip-za |