******# RFC-0304/Dan_Glossary

## Template Glossary of Terms

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Stanley Bondi](https://github.com/sdbondi) and [S W van Heerden](https://github.com/SWvheerden)
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

## Goal

This RFC is expand on all terms used the Dan RFCs, that means RFC-03xx. 


## Consensus level

| Term         | Address                                         | Description                                                                                                                                                                    | 
|--------------|-------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Shard space  | --                                              | [0, 2^256], all possible addresses                                                                                                                                             |
| Shard        | $H(Transaction \mathbin\Vert OutputNum)$        | An address within the shard space.                                                                                                                                             |
| ShardGroup   | --                                              | A range of shards managed by a single VN at a point in time.                                                                                                                   |
| Substate     | Shard                                           | State that is stored in a shard.                                                                                                                                               |
| Substate-Up  | Shard                                           | State that is being stored in a shard.                                                                                                                                         |
| Substate-Down| Shard                                           | State that is being marked as spent in a shard.                                                                                                                                |
| Transaction  | $H(\text{instructions etc.})$                   | A transaction is a set of instructions, a signature and other metadata. Contains Substate-Up's and Substate-Down's                                                             |
| Instruction  | --                                              | An instruction describes the action to be taken e.g call template function.                                                                                                    |
| Template     | $H(Commitment \mathbin\Vert  TemplateFeatures)$ | WASM code that defines a tari template ABI and implements some functionality, typically this functionality is single-concern, pure and composable state transition functions.  |

### Application level

| Term        | Address                             | Description                                                                                | 
|-------------|-------------------------------------|--------------------------------------------------------------------------------------------|
| Component   | $H(TxHash \mathbin\Vert OutputNum)$ | An instance of a type defined by a template. Arbitrary state with the notion of ownership. |
| Resource    | $H(TxHash \mathbin\Vert OutputNum)$ | A value container for a single token. Operations: Mint, Deposit, Withdraw, Burn, Update.   |
| KeyValueMap | $H(TxHash \mathbin\Vert OutputNum)$ | A lazy key value map owned by a component. Entries must scale.                             |

### Template level

| Term        | Key                       | Description                                                                                                                                                                                                                               | 
|-------------|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Vault       | TBD, <ResourceAddress, n> | Thinly wraps a single resource and provides convenient API for resource transfer, balances etc.                                                                                                                                           |
| Bucket      | locally unique number     | A temporary resource container. All buckets should be consumed by the end of the transaction.                                                                                                                                             |
| Worktop     | --                        | A temporary object container for working data while the transaction is processed. All resource containers (buckets, vaults, etc.) should be cleared from the workspace at the end of the transaction or the transaction is not committed. |
| AccessRules | TBD                       | Access rules that limit operations on components and resources.                                                                                                                                                                           |
| Badge       | TBD, <ResourceAddress, n> | A resource used with AccessRules and to generate bearer tokens                                                                                                                                                                            |
| BearerToken | nonce                     | A delegated, partially stateless proof providing limited and scoped access to a particular resource or component                                                                                                                          |