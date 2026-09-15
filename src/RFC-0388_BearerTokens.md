# D-TIP-RFC-O-0388: BearerTokens

| TIP             | [D-TIP-RFC-O-0388](#d-tip-rfc-o-0388-bearertokens)                        |
|-----------------|---------------------------------------------------------------------------|
| Title           | Bearer Tokens for Delegated Authority                                     |
| Last Modified   | 2026-09-07                                                                |
| Authors         | Tari Labs                                                                 |
| Status          | Deprecated                                                                |
| Type            | RFC                                                                       |
| Created         | 2023-01-01                                                                |
| References      | [I-TIP-RFC-O-0350](RFC-0350_TariVM.md)                                    |

## Bearer Tokens for Delegated Authority

![status: deprecated](theme/images/status-deprecated.svg)

**Maintainer(s)**: @mikethetike

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

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
community. The release of this document is intended solely for review and discussion by the community regarding the
technological merits of the potential system outlined herein.

## Deprecation notice

<div class="note">
This RFC is <strong>deprecated</strong>. The scheme described here was never implemented and is not planned.
</div>

Delegated authority on the Ootle is instead expressed with the capability model that ships in
`tari_template_lib_types::access_rules`:

* Every component method and every resource action — mint, burn, recall, withdraw, deposit, update non-fungible
  data, freeze, update metadata — carries an `AccessRule`, which is `AllowAll`, `DenyAll`, or a `Restricted` rule tree
  composed of `AnyOf`/`AllOf` over `RequireRule`s.
* A `RuleRequirement` is satisfied by presenting a *proof* in the transaction's auth scope — a badge, meaning a
  `Resource` or a specific `NonFungibleAddress` held in a vault — or by the call being scoped to a given component or
  template. Proofs are created from vaults and dropped at the end of the transaction, so authority is scoped to a
  single execution rather than being a persistent allowance.
* Substate ownership is a separate `SubstateOwnerRule`; only the owner may change a substate's access rules after
  creation.

This model achieves the goals stated below — no `approve`-style persistent allowance, and no fee to grant or revoke
authority — by a different route. Delegation is done by transferring or lending a badge rather than by attenuating a
signed token, and revocation is done by reclaiming the badge (or by a recall rule) rather than by rotating a root
nonce. The macaroon-style caveat expression language, the `based_on` attenuation chain, and the `root_nonce`
revocation register have no counterpart in the engine, and no work is planned to add them.

The remainder of this document is retained for historical reference only.

## Goals

Many dapps and web3 enabled applications require the ability to spend or interact with the assets
that a user owns on their behalf. Ethereum and many other blockchains achieve this in a stateful
manner by invoking methods such as 'approve' and 'approve_all' in ERC20 and ERC721. Being stateful, 
the user must spend fees in order to add or revoke permissions. When fees are high, or due to 
simplistic user interfaces, a user will often grant a much higher level of permission than is required. 
For example, the user may approve a service to transfer all of their funds, or all of their NFTs.

The scheme proposed by this RFC is a stateless token that the bearer can use to invoke methods on the 
DAN layer.

## Related Requests for Comment

## Description

This scheme is inspired by [Macaroons](https://www.ndss-symposium.org/ndss2014/programme/macaroons-cookies-contextual-caveats-decentralized-authorization-cloud/) in that it allows the bearer of a token to delegate a more restrictive token to
another bearer. 


## Structure

### Auth Token

| Field | Type | Description |
| --- | --- | --- |
| root_nonce | bytes(32) (optional) | a base ID used to revoke permissions(see below)  | 
| expires_at_height | u64 (optional) | the sidechain height at which this token expires. Timestamps are not reliable in blockchains, so height is used in this case |
| granted_to | pubkey | the public key of the grantee. Any bearer using this token will need to prove knowledge of the private key |
| scopes | string[] | A list of scopes granted to this scope |
| caveats | CaveatExpression[] | An ordered list of caveats |
| based_on | Token (optional) | If this token is derived from another token, it should be present here |
| issuer | PubKey | the issuer of this token |
| issuer_sig | Signature | a signature signed by `issuer` of the challenge `Hash(root_nonce + granted_to + scopes + caveats + expires_at_height + based_on + issuer )` |

### Caveat Expression

```text 
Caveat Expression = <Field> <operator> <Argument>
```

Field: An arbitrary string that will be interpreted by the code
Operator: OneOf("eq", "le", "lt","ge", "gt")
Argument: A constant value, to be interpreted by the code

Examples
```text
amount lt 1000
token_id eq 4759
```

## Delegation

A bearer of a token may grant another identity a more specific token, provided that the scopes and caveats are more restrictive.


## Validation

The root_nonce, if specified must match the root nonce on record for the issuer.
> Open question: should root nonce just be a special caveat?

Before starting execution of the instruction, the list of auth tokens must be validated to ensure that each token is more restrictive than
the last.

When executing instructions, caveats MUST be checked if they are relevant to the resources being acted upon. 
For example, if a function requires a scope `transfer`, the most specific AuthToken must have that scope present.



## Revoking Tokens
Each contract SHOULD store a root nonce for each identity in the contract. To revoke a set of tokens, an identity owner
may change their root nonce. This will revoke all tokens based on this root.

### Example 1: Invoking an instruction

In this example, Alice wants to allow Bob to spend 100 of a fungible asset called `WARI` from her account.

Let's assume the transfer function looks like this:


```nocompile
fn transfer(amount: u64, from: PublicKey, to: PublicKey) 
{
   requires_scope("transfer", from);
   // ...
}
```

Alice creates a token:
```json5
/* bob's token */
{
   "scopes": ["transfer"],
   "granted_to": "<Bob's Public Key>",
   "caveats": [
      "amount le 100"
   ],
   "issuer": "<Alice's Public Key>",
   "issuer_sig": "<sig>"
}
```

> Note: The `root_nonce` and `expires_at_height` are missing here, but it would have been better for Alice to include these.
> Also, this token allows Bob to spend up to 100 at a time, but does not restrict Bob from using this token again

Bob can now create the instruction and submit it to the validator node. The validator node checks that the instruction signature
matches the public key in `granted_to` and also checks that the `amount` parameter is less than or equal to 100. Finally, the
validator node checks that the scope includes 'transfer', and Alice's public key (specified in `from`) matches the auth token's issuer signature.

### Example 2: Delegation
Let's continue the example, but in this case Bob wants to allow Carol to spend the funds.

In this case, Bob creates a token for Carol with the following:

```json5
/* carol's token */
{
   "scopes": ["transfer"],
   "granted_to": "<Carol's Public Key",
   "caveats": [
      "amount le 90"
   ],
   "issuer": "<Bob's Public Key>",
   "issuer_sig": "<sig>",
   "based_on": {
      /* bob's token */
   }
}
```


Carol can now create a set of instructions, attach the token and sign it with her public key.

```json
{
   "instructions": [
      {
         "method": "transfer",
         "amount": "80",
         "from": "<alice's pub key>",
         "to": "<carol's pub key>"
      },
      {
         "method": "transfer",
         "amount": "10",
         "from": "<alice's pub key>",
         "to": "<bob's pub key>"
      }
   ],
   "authority": {
      "bearer": {/* carol's token */},
      "sig": "<sig with carol's pub key>"
   }
}
```

When the validator node receives a set of instructions with this token, it must process each token recursively, with respect to
the token it is based on. 
