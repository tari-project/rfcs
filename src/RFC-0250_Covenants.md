# RFC-0250/Covenants

## Covenants

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Stanley Bondi](https://github.com/sdbondi)

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

This Request for Comment (RFC) presents a proposal for introducing _covenants_ into the Tari base layer protocol. Tari
Covenants aims to provide restrictions on the _future_ spending of subsequent transactions to enable a number of powerful
use-cases, such as

- [vaults]
- side-chain checkpointing transactions,
- commission on NFT transfers, and
- many others not thought of here.

## Related Requests for Comment

- [RFC-0200: Base Layer Extensions](BaseLayerExtensions.md)
- [RFC-0300: The Tari Digital Assets Network](RFCD-0300_DAN.md)

## Introduction

The Tari protocol already provides programmable consensus, through [TariScript], that restricts whether a [UTXO]
may be included as an input to a transaction (a.k.a spent). The scope of information within [TariScript] is inherently limited,
by the [TariScript Opcodes] and the input data provided by a spender. Once the requirements of the script are met,
a spender may generate [UTXO]s of their choosing, within the constraints of [MimbleWimble].

This RFC expands the capabilities of Tari protocol by adding _additional requirements_, called covenants
that allow the owner(s) of a [UTXO] to control the composition of a _subsequent_ transaction.

Covenants are not a new idea and have been proposed and implemented in various forms by others.

For example,

- [Bitcoin-NG covenants] put forward the `CheckOutputVerify` script opcode.
- [Handshake] has implemented covenants to add the [UTXO] state of their auctioning process.
- [Elements Covenants]

## Covenants in MimbleWimble

In blockchains like Bitcoin, a block contains discrete transactions containing inputs and outputs. A covenant
in Bitcoin would be able to interrogate those outputs _belonging to the input_ to ensure that they adhere to rules.

In [MimbleWimble], the body of a block and transaction can be expressed in an identical data structure. This
is indeed the case in the [Tari codebase], which defines a structure called `AggregateBody` containing inputs
and outputs (and kernels) for transactions and blocks. This is innate to [MimbleWimble], so even if we were
to put a "box" around these inputs/outputs there is nothing to stop someone from including inputs and
outputs from other boxes as long as balance is maintained.

This results in an interesting dilemma: how do we allow rules that dictate how future outputs look only armed with
the knowledge that the rule must apply to one or more outputs?

In this RFC, we detail a covenant scheme that allows the [UTXO] originator to express a _filter_ that must be
satisfied for a subsequent spending transaction to be considered valid.

## Assumptions

The following assumptions are made:

1. Duplicate commitments within a block are disallowed by consensus _prior_ to covenant execution,
2. all outputs in the output set are valid, and
3. all inputs are valid spends, save for covenant checks.

## Protocol modifications

Modifications to the existing protocol and consensus are as follows:

- the covenant is recorded in the transaction [UTXO],
- the covenant is committed to in the output and input hashes to prevent malleability,
- transactions with covenants entering the mempool MUST be validated, and
- each covenant in a block must be validated before being included in the block chain.

### Transaction input and output changes

A `covenant` field would need to be added to the `TransactionOutput` and `TransactionInput` structs
and committed to in their hashes.

### Covenant definition

We define a clear notation for covenants that mirrors the [miniscript] project.

#### Execution Context and Scope

Covenants execute within a limited read-only context and scope. This is both to reduce complexity (and therefore
the possibility of bugs) and maintain reasonable performance.

A covenant's context is limited to:

- an immutable reference to the current input,
- a vector of immutable _references_ to outputs in the current block/transaction (called the output set),
- the current input's mined height, and
- the current block height.

Each output's covenant is executed with this context, filtering on the output set and returning the result.
The output set given to each covenant at execution MUST be the same set for all covenants and MUST never be
influenced by other covenants. The stateless and immutable nature of this scheme has the benefit of being
able to execute covenants in parallel.

A covenant passes if at least one output in the set is matched. Allowing more than one output to match allows for
covenants that restrict the characteristics of multiple outputs. A covenant that matches zero outputs _fails_
which invalidates the transaction/block.

If a covenant is empty (zero bytes) the `identity` operation is implied and therefore, no actual execution need occur.

#### Argument types

```rust,ignore
enum CovenantArg {
    // byte code: 0x01
    // data size: 32 bytes
    Hash([u8; 32]),
    // byte code: 0x02
    // data size: 32 bytes
    PublicKey(RistrettoPublicKey),
    // byte code: 0x03
    // data size: 32 bytes
    Commitment(PedersonCommitment),
    // byte code: 0x04
    // data size: variable
    TariScript(TariScript),
    // byte code: 0x05
    // data size: <= 4096 bytes
    Covenant(Covenant),
    // byte cide: 0x06
    // data size: variable
    Uint(u64),
    // byte cide: 0x07
    // data size: variable
    OutputField(OutputField),
    // byte cide: 0x08
    // data size: variable
    OutputFields(OutputFields),
    // byte cide: 0x09
    // data size: variable
    Bytes(Vec<u8>),
    // byte cide: 0x0a
    // data size: 1 bytes
    OutputType(OutputType),
}
```

##### Output field tags

Fields from each output in the output set may be brought into a covenant filter.
The available fields are defined as follows:

| Tag Name                             | Byte Code | Returns                            |
|--------------------------------------|-----------|------------------------------------|
| `field::commitment`                  | 0x00      | output.commitment                  |
| `field::script`                      | 0x01      | output.script                      |
| `field::sender_offset_public_key`    | 0x02      | output.sender_offset_public_key    |
| `field::covenant`                    | 0x03      | output.covenant                    |
| `field::features`                    | 0x04      | output.features                    |
| `field::features_output_type`        | 0x05      | output.features.output_type        |
| `field::features_maturity`           | 0x06      | output.features.maturity           |
| `field::features_metadata`           | 0x07      | output.features.metadata           |
| `field::features_sidechain_features` | 0x08      | output.features.sidechain_features |

Each field tag returns a consensus encoded byte representation of the value contained in the field.
How those bytes are interpreted depends on the covenant. For instance, `filter_fields_hashed_eq` will
concatenate the bytes and hash the result whereas `filter_field_eq` will interpret the bytes as a
little-endian 64-bit unsigned integer.

#### Set operations

##### identity()

The output set is returned unaltered. This rule is implicit for an empty (0 byte) covenant.

op_byte: 0x20<br>
args: []

##### and(A, B)

The intersection (\\(A \cap B\\)) of the resulting output set for covenant rules \\(A\\) and \\(B\\).

op_byte: 0x21<br>
args: [Covenant, Covenant]

##### or(A, B)

The union (\\(A \cup B\\)) of the resulting output set for covenant rules \\(A\\) and \\(B\\).

op_byte: 0x22<br>
args: [Covenant, Covenant]

##### xor(A, B)

The symmetric difference (\\(A \triangle B\\)) of the resulting output set for covenant rules \\(A\\) and \\(B\\).
This is, outputs that match either \\(A\\) or \\(B\\) but not both.

op_byte: 0x23<br>
args: [Covenant, Covenant]

##### not(A)

Returns the compliment of `A`. That is, all the elements of `A` are removed from the
resultant output set.

op_byte: 0x24<br>
args: [Covenant]

#### Filters

##### filter_output_hash_eq(hash)

Filters for a single output that matches the hash. This filter only returns zero or one outputs.

op_byte: 0x30<br>
args: [Hash]

##### filter_fields_preserved(fields)

Filter for outputs where all given fields in the input are preserved in the output.

op_byte: 0x31<br>
args: [Fields]

##### filter_fields_hashed_eq(fields, hash)

op_byte: 0x32<br>
args: [Fields, VarInt]

##### filter_field_eq(field, int)

Filters for outputs whose field value matches the given integer value. If the given field cannot be cast
to an unsigned 64-bit integer, the transaction/block is rejected.

op_byte: 0x33<br>
args: [Field, VarInt]


##### filter_absolute_height(height)

Checks the block height that the current [UTXO] (i.e. the current input) is greater than or
equal to the `HEIGHT` block height. If so, the `identity()` is returned.

op_byte: 0x34<br>
args: [VarInt]

#### Encoding / Decoding

Covenants can be encoded to/decoded from bytes as a token stream. Each token is consumed and interpreted serially
before being executed.

For instance,

```ignore
xor(
    filter_output_hash_eq(Hash(0e0411c70df0ea4243a363fcbf161ebe6e2c1f074faf1c6a316a386823c3753c)),
    filter_relative_height(10),
)
```

is represented in hex bytes as `23 30 01 a8b3f48e39449e89f7ff699b3eb2b080a2479b09a600a19d8ba48d765fe5d47d 35 07 0a`.
Let's unpack that as follows:

```ignore
23 // xor - consume two covenant args
30 // filter_output_hash_eq - consume a hash arg
01 // 32-byte hash
a8b3f48e39449e89f7ff699b3eb2b080a2479b09a600a19d8ba48d765fe5d47d // data
// end filter_output_hash_eq
35 // 2nd covenant - filter_absolute_height
07 // varint
0A // 10
// end varint, filter_absolute_height, xor
```

Some functions can take any number of arguments, such as `filter_fields_hashed_eq` which defines the `Fields` type.
This type is encoded first by its byte code `34` followed by a varint encoded number that indicates the number
of field identifiers to consume. To mitigate misuse, the maximum allowed arguments are limited.

### Covenant Validation

A covenant and therefore the block/transaction MUST be regarded as invalid if:

1. an unrecognised bytecode is encountered
2. the end of the byte stream is reached unexpectedly
3. there are bytes remaining on the stream after interpreting
4. an invalid argument type is encountered
5. the `Fields` type encounters more than 9 arguments (i.e. the number of fields tags available)
6. the depth of the calls exceeds 16.

### Consensus changes

The covenant is executed once all other validations, including [TariScript], are complete. This ensures that
invalid transactions in a block cannot influence the results.

## Considerations

### Complexity

This introduces additional validation complexity. We avoid stacks, loops, and conditionals (covenants are basically
one conditional), there are overheads both in terms of complexity and performance as a trade-off for the
power given by covenants.

The worst case complexity for covenant validation is `O(num_inputs*num_outputs)`, although as mentioned above
validation for each input can be executed in parallel. To compensate for the additional workload the network
encounters, use of covenants should incur heavily-weighted fees to discourage needlessly using them.

### Cut-through

The same arguments made in the [TariScript RFC](./RFC-0201_TariScript.md#cut-through) for the need to prevent
[cut-through] apply to covenants.

### Chain analysis

The same arguments made in the [TariScript RFC](./RFC-0201_TariScript.md#fodder-for-chain-analysis) apply.

### Security

As all outputs in a block are in the scope of an input to be checked, any unrelated/malicious output in a block
_could_ pass an unrelated covenant rule if given the chance. A secure covenant is one that _uniquely_ identifies
one or more outputs.

## Examples

### Now or never

Spend by block 10 or burn

```ignore
not(filter_absolute_height(10))
```

Note, this covenant may be valid when submitted to the mempool, but invalid by the time it is put in a block for
the miner.

### Side-chain checkpointing

```ignore
and(
   filter_field_eq(field::feature_flags, 16) // SIDECHAIN CHECKPOINT = 16
   filter_fields_preserved([field::features, field::covenant, field::script])
)
```

### Restrict spending to a particular commitment if not spent by block 100

```ignore
or(
   not(filter_absolute_height(100)),
   filter_fields_hashed_eq([field::commmitment], Hash(xxxx))
)
```

### Output must preserve covenant, features and script or be burnt

```ignore
xor(
    filter_fields_preserved([field::features, field::covenant, field::script]),
    and(
        filter_field_eq(field::features_flags, 128), // FLAG_BURN = 128
        filter_fields_hashed_eq([field::commitment, field::script], Hash(...)),
    ),
)
```

### Commission for NFT transfer

```ignore
// Must be different outputs
xor(
    and(
        // Relavant input fields preserved in subsequent output
        filter_fields_preserved([fields::features, fields::covenant, fields::script]),
        // The spender must obtain the covenent for the subsequent output
        filter_fields_hashed_eq([fields::covenant], Hash(xxxx)),
    ),
    // The spender must obtain and submit the output that matches this hash
    filter_output_hash_eq(Hash(xxxx)),
)
```

### Other potential covenants

- `filter_script_eq(script)`
- `filter_covenant_eq(covenant)`
- `filter_script_match(<pattern>)`
- `filter_covenant_match(<pattern>)`

# Change Log

| Date        | Change        | Author |
|:------------|:--------------|:-------|
| 17 Oct 2021 | First draft   | sbondi |
| 08 Oct 2022 | Stable update | brianp |

[commitment]: ./Glossary.md#commitment
[tari codebase]: https://github.com/tari-project/tari
[handshake]: https://handshake.org/files/handshake.txt
[cut-through]: https://tlu.tarilabs.com/protocols/grin-protocol-overview/MainReport.html#cut-through
[bitcoin-ng covenants]: https://maltemoeser.de/paper/covenants.pdf
[utxo]: ./Glossary.md#unspent-transaction-outputs
[miniscript]: https://medium.com/blockstream/miniscript-bitcoin-scripting-3aeff3853620
[elements covenants]: https://blockstream.com/2016/11/02/en-covenants-in-elements-alpha/
[vaults]: https://hackingdistributed.com/2016/02/26/how-to-implement-secure-bitcoin-vaults/
[tariscript]: ./Glossary.md#tariscript
[mimblewimble]: ./Glossary.md#mimblewimble
[TariScript Opcodes]: ./RFC-0202_TariScriptOpcodes.md
