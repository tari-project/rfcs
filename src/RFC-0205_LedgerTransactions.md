# RFC-0205/ledger transactions

## Ledger addresses

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [SW van Heerden](https://github.com/swvheerden)


\newcommand{\hash}[1]{\mathrm{H}\bigl({#1}\bigr)}

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2023 The Tari Development Community

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

This Request for Comment (RFC) presents a design for a hardware wallet with MimbleWimble

## Related Requests for Comment

- [RFC-0201: TariScript](RFC-0201_TariScript.md)
- [RFC-0203: Stealth Address](RFC-0203_StealthAddress.md)

## Introduction

Hardware wallets are secure physical devices used to protect crypto assets and funds by requiring user interaction from the device.
These devices are used to sign for transactions by keeping all the secrets from the transactions on the hardware device. If
the host machines that run the wallets are compromised by malware the secrets from the transactions are still safe as they are not
kept on the machine as with regular wallets. The devices are very low power and only feature a very limited processing power. MimbleWimble 
has intensive crypto operations that are in some instances very slow or not able to run on the hardware wallet at all. This RFC describes a way to 
get around these limitations to have fully functional secure hardware wallet integration. 

## Background

Vanilla [Mimblewimble] only has a single secret per [UTXO], the blinding factor (\\( k_i \\) ), the Tari protocol extends the [Mimblewimble] protocol to include scripting in the form of [TariScript]. This adds a second secret per [UTXO] called the script_key (\\( k_s \\) ). In practical terms this means that while vanilla [Mimblewimble] only requires that a wallet wishing to spend an [UTXO], prove knowledge of (\\( k_i \\) ) by producing the kernel signature, this is not sufficient for Tari. A Tari wallet must also prove knowledge of the script key (\\( k_s \\) ), by producing the script signature. 

## Requirements

To properly implement hardware wallets we need the following requirements to be met:
* No UTXO can be spent without a user physically approving the transaction on the hardware wallet.
* Users need to verify transaction properties when signing for transactions.
* The user must be able to receive transactions without having to authorize them on the hardware wallet.

## Implementation

### Entities
Normal transactions have only a single entity, the wallet which controls all secrets and transactions. But with hardware wallets, we need to define two distinct types:
* Signer: This is the entity that keeps the secrets for the transactions and approves them, aka the hardware wallet.
* Helper: This entity is the program that helps the signer construct the transaction, send it over the network and scan the network, aka wallet.

### Process Overview
By splitting the ownership of the [UTXO]'s secret by assigning knowledge of only the script key (\\( k_s \\) ) to the signer, we can lift much of the heavy cryptography like bulletproof creation to the helper device by exposing (\\( k_i \\) ) to it. By looking at how [one-sided-stealth] transactions are created, we can construct the script key in such a way that the helper can calculate the public script key, but cannot calculate the private script key.

All hardware wallet created [UTXO]s created will be created with a script `PushPubkey(K_S)`. The key (\\( k_s \\) ) is created as follows:
$$
\begin{align}
k_S &= k_i + a \\\\
K_S &= k_i \cdot G + A
\end{align}
$$

The blinding factor (\\( k_i \\) ) is used as a random nonce when creating the script key. This means the helper can create the public key without the signer present, and the signer can then at a later stage create the private key from the nonce. The key pair (\\( a, A \\) ) is the master key pair from the signer. The private key (\\( a \\) ) is kept secret by the signer at all times.

### Initialization
Adding a hardware wallet to a wallet (helper) we need to ensure that all keys are only derived from a single seed phrase provided by the hardware wallet. 

Helper asks signer for master helper key (\\( k_H \\) ). 
This key is derived from the signer seed phrase.

### Transaction receiving
When a transaction is received the helper constructs the new [UTXO] with its Rangeproof. Choosing a new (\\( k_i \\) ) for the [UTXO], it calculates a new \\( K_S \\). It attaches the script `PushPubkey(K_S)` to output.

### Transaction sending
When the user wants to send a transaction, the helper retrieves the desired [UTXO]. The helper asks the signer to sign the transaction. 
The signer calculates \\( k_s \\) to sign the transaction. 
The signer creates a random nonce \\( k_O \\) to use for the script_offset. It produces the metadata signature with \\( k_O \\), and supplies the script_offset to the helper. 
The helper can attach the correct signatures to the [UTXO]s and ship the transaction.

### Receiving normal one-sided transaction
This can be done by the helper asking the signer for a public key. And advertising this public key as the destination public key for a 1-sided transaction. 
The helper can scan the blockchain for this public key. 

### Receiving one-sided-stealth
`TODO`

### Output recovery
When creating outputs the wallet encrypts the blinding factor (\\k_i \\) and value \\( v \\) with (\\( k_H \\) ).
Because the key (\\( k_H \\) ) is calculated from the seed phrase of the signer, this will be the same each time. The helper can try to decrypt each scanned output, when it is successful it knows it has found its own output. 
The helper can validate that the commitment is correct using the blinding factor (\\k_i \\) and value \\( v \\). It can also validate (\\( K_S)\\) ) corresponds to (\\( k_i, A \\) )

## Security
Because the script key is required for spending, it is the only key that needs to be kept secret. 
The following table explains what an attacker can do upon learning a key from the helper

| key         | Worst case scenario          | 
|:------------|:-----------------------------|
| \\( k_H \\) | Can view all transactions and values made by the wallet |
| \\( k_i \\) | Can try and brute force the value of the transaction |

The keys ( \\( a, k_S, k_O \\) ) are only known to the signer, and should never leave the hardware wallet.

[tariscript]: ./Glossary.md#tariscript
[mimblewimble]: ./Glossary.md#mimblewimble
[one-sided-stealth]: ./RFC-0203_StealthAddresses.md
[utxo]: ./Glossary.md#unspent-transaction-outputs
# Change Log

| Date        | Change                       | Author    |
|:------------|:-----------------------------|:----------|
| 17 May 2023 | First draft                  | swvheerden|

