# RFC-0160/BlockSerialization

## Tari Block Binary Serialization

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Byron Hambly](https://github.com/delta1)

<!-- TOC -->
  * [Goals](#goals)
  * [Related Requests for Comment](#related-requests-for-comment)
  * [Specification](#specification)
  * [Block field ordering](#block-field-ordering)
  * [Mining template field ordering](#mining-template-field-ordering)
  * [Value encryption](#value-encryption)
  * [Hash domains](#hash-domains)
  * [Tari Block and Mining Template - Data Types](#tari-block-and-mining-template---data-types)
    * [Block Header](#block-header)
      * [Proof Of Work](#proof-of-work)
    * [Block Body](#block-body)
      * [TransactionInput](#transactioninput)
        * [SpentOutput](#spentoutput)
        * [CommitmentAndPublicKeySignature](#commitmentandpublickeysignature)
        * [OutputFeatures](#outputfeatures)
        * [CovenantToken](#covenanttoken)
        * [CovenantFilter](#covenantfilter)
        * [CovenantArg](#covenantarg)
        * [OutputField](#outputfield)
      * [TransactionOutput](#transactionoutput)
      * [TransactionKernel](#transactionkernel)
      * [RistrettoSchnorr](#ristrettoschnorr)
    * [New Block Template](#new-block-template)
      * [New Block Header Template](#new-block-header-template)
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

The aim of this Request for Comment (RFC) is to specify the binary serialization of:

1. a mined Tari block
1. a Tari block mining template

This is to facilitate interoperability of mining software and hardware.

## Related Requests for Comment

- [RFC-0131: Full-node Mining on Tari Base Layer](RFC-0131_Mining.md)

## Specification

By reviewing the [block and mining template fields](#tari-block-and-mining-template---data-types) below, we have the 
following underlying data types for serialization:

1. `bool`
2. `u8`
3. `u16`
4. `u64`
5. `i64`
6. `array` of type `[u8; n]`
7. `Vec<T>` where `T` is `u8`, `enum` or `array`

For 1. to 5. and all numbers, [Base 128 Varint] encoding MUST be used.

From the Protocol Buffers documentation:

> Varints are a method of serializing integers using one or more bytes. Smaller numbers take a smaller number of bytes. 
> Each byte in a varint, except the last byte, has the most significant bit (msb) set – this indicates that there are 
> further bytes to come. The lower 7 bits of each byte are used to store the two's complement representation of the 
> number in groups of 7 bits, least significant group first.

For 6. to 7., the dynamically sized `array` and `Vec` type, the encoded array MUST be preceded by a number indicating the 
length of the array. This length MUST also be encoded as a varint. By prepending the length of the array, the decoder 
knows how many elements to decode as part of the sequence.

[base 128 varint]: https://developers.google.com/protocol-buffers/docs/encoding#varints

## Block field ordering

Using this varint encoding, all fields of the complete block MUST be encoded in the following order:

1. Version
2. Height
3. Previous block hash
4. Timestamp
5. Output Merkle root
6. Witness Merkle root
7. Output Merkle mountain range size
8. Kernel Merkle root
9. Kernel Merkle mountain range size
10. Input Merkle root
11. Total kernel offset
12. Total script offset
13. Nonce
14. Proof of work algorithm
15. Proof of work supplemental data
16. Transaction inputs - for each input:
    - Version 
    - Spent output - for each output:
      - Version
      - Features
        - Version
        - Maturity
        - Output type
        - Sidechain features
        - Metadata
      - Commitment
      - Script
      - Sender offset public key
      - Covenant
      - Encrypted value
      - Minimum value promise
    - Input data ([vector] of Stack items)
    - Script signature
17. Transaction outputs - for each output:
    - Version
    - Features
        - Version
        - Maturity
        - Output type
        - Sidechain features
        - Metadata
    - Commitment
    - Range proof
    - Script
    - Sender offset public key
    - Metadata signature
    - Covenant
    - Encrypted value
    - Minimum value promise
18. Transaction kernels - for each kernel:
    - Version
    - Features
    - Fee
    - Lock height
    - Excess
    - Excess signature public nonce
    - Excess signature
    - Burn commitment

## Mining template field ordering

The [new block template](#new-block-template) is provided to miners to complete. Its fields MUST also be encoded using varints, in the following order:

1. Version
2. Height
3. Previous block hash
4. Total kernel offset
5. Total script offset
6. Proof of work algorithm
7. Proof of work supplemental data
8. Transaction inputs - for each input:
   - Version
   - Spent output - for each output:
       - Version
       - Features
           - Version
           - Maturity
           - Output type
           - Sidechain features
           - Metadata
       - Commitment
       - Script
       - Sender offset public key
       - Covenant
       - Encrypted value
       - Minimum value promise
   - Input data ([vector] of Stack items)
   - Script signature
9. Transaction outputs - for each output:
   - Version
   - Features
       - Version
       - Maturity
       - Output type
       - Sidechain features
       - Metadata
   - Commitment
   - Range proof
   - Script
   - Sender offset public key
   - Metadata signature
   - Covenant
   - Encrypted value
   - Minimum value promise
10. Transaction kernels - for each kernel:
    - Version
    - Features
    - Fee
    - Lock height
    - Excess
    - Excess signature public nonce
    - Excess signature
    - Burn commitment
11. Target difficulty
12. Reward
13. Total fees

## Value encryption

The value of the value commitment MUST be encrypted using [ChaCha20Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305)
Authenticated Encryption with Additional Data (AEAD). The AEAD key MUST be 32 bytes in size and produced using a
[domain separated hash](#hash-domains) of the private key and commitment.

## Hash domains

To use a single hash function for producing a sampling of multiple independent hash functions, it's common to employ 
domain separation. Tari uses the [hashing API](https://github.com/tari-project/tari-crypto/blob/main/src/hashing.rs) 
within the tari codebase to achieve proper hash domain separation.

The following functional areas MUST each use a separate hash domain that is unique in the tari codebase:
- kernel Merkle Mointain Range;
- witness MMR;
- output MMR;
- input MMR;
- value encryption.

To achieve interoperability with other blockchains like Bitcoin and Monero, for example an atomic swap, TariScript MUST 
NOT make use of hash domains.  

## Tari Block and Mining Template - Data Types

A [Tari block] is composed of the [block header] and [aggregate body].

Here we describe the respective Rust types of these fields in the tari codebase, and their underlying data types:

[Tari block]: https://github.com/tari-project/tari/blob/development/base_layer/core/src/blocks/block.rs

### Block Header

| Field               | Abstract Type    | Data Type                         | Description                                                                               |
|---------------------|------------------|-----------------------------------|-------------------------------------------------------------------------------------------|
| Version             | `u16`            | `u16`                             | The Tari protocol version number, used for soft/hard forks                                |
| Height              | `u64`            | `u64`                             | Height of this block since the genesis block                                              |
| Previous Block Hash | `BlockHash`      | `[u8;32]`                         | Hash of the previous block in the chain                                                   |
| Timestamp           | `EpochTime`      | `u64`                             | Timestamp at which the block was built (number of seconds since Unix epoch)               |
| Output Merkle Root  | `BlockHash`      | `[u8;32]`                         | Merkle Root of the unspent transaction ouputs                                             |
| Witness Merkle Root | `BlockHash`      | `[u8;32]`                         | MMR root of the witness proofs                                                            |
| Output MMR Size     | `u64`            | `u64`                             | The size (number of leaves) of the output and range proof MMRs at the time of this header |
| Kernel Merkle Root  | `BlockHash`      | `[u8;32]`                         | MMR root of the transaction kernels                                                       |
| Kernel MMR Size     | `u64`            | `u64`                             | Number of leaves in the kernel MMR                                                        |
| Input Merkle Root   | `BlockHash`      | `[u8;32]`                         | Merkle Root of the transaction inputs in this block                                       |
| Total Kernel Offset | `BlindingFactor` | `[u8;32]`                         | Sum of kernel offsets for all transaction kernels in this block                           |
| Total Script Offset | `BlindingFactor` | `[u8;32]`                         | Sum of script offsets for all transaction kernels in this block                           |
| Nonce               | `u64`            | `u64`                             | Nonce increment used to mine this block                                                   |
| Pow                 | `ProofOfWork`    | See [Proof Of Work](#proof-of-work) | Proof of Work information                                                                 |

`[u8;32]` indicates an array of 32 unsigned 8-bit integers

#### Proof Of Work

| Field                   | Abstract Type    | Data Type | Description                                                                                                                                                                                       |
|-------------------------|------------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Proof of Work Algorithm | `PowAlgorithm`   | `u8`      | The algorithm used to mine this block ((Monero or SHA3))                                                                                                                                          |
| Proof of Work Data      | `Vec<u8>`        | `u8`      | Supplemental proof of work data. For example for Sha3, this would be empty (only the block header is required), but for Monero merge mining we need the Monero block header and RandomX seed hash |

### Block Body

| Field               | Abstract Type            | Data Type           | Description                                                            |
|---------------------|--------------------------|---------------------|------------------------------------------------------------------------|
| Sorted              | `bool`                   | `bool`              | True if sorted                                                         |
| Transaction Inputs  | `Vec<TransactionInput>`  | `TransactionInput`  | List of inputs spent                                                   |
| Transaction Outputs | `Vec<TransactionOutput>` | `TransactionOutput` | List of outputs produced                                               |
| Transaction Kernels | `Vec<TransactionKernel>` | `TransactionKernel` | Kernels contain the excesses and their signatures for the transactions |

A further breakdown of the body fields is described below:

#### TransactionInput

| Field            | Abstract Type                      | Data Type                                                               | Description                                                                                         |
|------------------|------------------------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Version          | `TransactionInputVersion`          | `u16`                                                                   | The features of the output being spent. We will check maturity for all outputs.                     |
| Spent Output     | `SpentOutput`                      | See [SpentOutput](#spentoutput)                                         | Either the hash of TransactionOutput that this Input is spending or its data                        |
| Input Data       | `ExecutionStack`                   | `Vec<u8>`                                                               | The script input data, maximum size is 512                                                          |
| Script Signature | `CommitmentAndPublicKeySignature`  | See [CommitmentAndPublicKeySignature](#commitmentandpublickeysignature) | A signature signing the script and all other transaction input metadata with the script private key |

##### SpentOutput

| Field                    | Abstract Type                     | Data Type                                           | Description                                                                     |
|--------------------------|-----------------------------------|-----------------------------------------------------|---------------------------------------------------------------------------------|
| OutputHash               | `HashOutput`                      | `[u8;32]`                                           | The features of the output being spent. We will check maturity for all outputs. |
| Version                  | `TransactionOutputVersion`        | `u8`                                                | The TransactionOutput version                                                   |
| Features                 | `OutputFeatures`                  | See [OutputFeatures](#outputfeatures)               | Options for the output's structure or use                                       |
| Commitment               | `PedersenCommitment`              | `[u8;32]`                                           | The commitment referencing the output being spent.                              |
| Script                   | `TariScript`                      | `Vec<u8>`                                           | The serialised script, maximum size is 512                                      |
| Sender Offset Public Key | `CommitmentAndPublicKeySignature` | `[u8;32]`                                           | The Tari script sender offset public key                                        |
| Covenant                 | `Vec<CovenantToken>`              | See [CovenantToken](#covenanttoken)                 | A future-based contract detailing input and output metadata                     |
| Encrypted Value          | `EncryptedValue`                  | `[u8;24]`                                           | The encrypted value of the value commitment                                     |
| Minimum Value Promise    | `MicroTari`                       | `u64` _(See [Value encryption](#value-encryption))_ | The minimum value promise embedded in the range proof                           |

##### CommitmentAndPublicKeySignature

| Field        | Abstract Type        | Data Type | Description                                                                             |
|--------------|----------------------|-----------|-----------------------------------------------------------------------------------------|
| Public Nonce | `PedersenCommitment` | `[u8;32]` | The public (Pedersen) commitment nonce created with the two random nonces               |
| `u`          | `SecretKey`          | `[u8;32]` | The first publicly known private key of the signature signing with the value            |
| `v`          | `SecretKey`          | `[u8;32]` | The second publicly known private key of the signature signing with the blinding factor |
| Public Key   | `PedersenCommitment` | `[u8;32]` | The public nonce of the Schnorr signature                                               |
| `a`          | `SecretKey`          | `[u8;32]` | The publicly known private key of the Schnorr signature                                 |

Find out more about CommitmentAndPublicKey signatures:

- [Simple Schnorr Signature with Pedersen Commitment as Key](https://eprint.iacr.org/2020/061.pdf)
- [A New and Efficient Signature on Commitment Values](https://documents.uow.edu.au/~wsusilo/ZCMS_IJNS08.pdf)
- [Tari Commitment and Public Key Signature](https://github.com/tari-project/tari-crypto/blob/main/src/signatures/commitment_and_public_key_signature.rs)

##### OutputFeatures

| Field               | Abstract Type           | Data Type | Description                                       |
|---------------------|-------------------------|-----------|---------------------------------------------------|
| Version             | `OutputFeaturesVersion` | `u8`      | The OutputFeatures version                        |
| Output Type         | `OutputType`            | `u8`      | The type of output                                |
| Maturity            | `u64`                   | `u64`     | The block height at which the output can be spent |
| Metadata            | `Vec<u8>`               | `u8`      | The block height at which the output can be spent |
| Side-chain Features | `SideChainFeatures`     | _none_    | _Not implemented_                                 |

##### CovenantToken

| Field  | Abstract Type    | Data Type                             | Description              |
|--------|------------------|---------------------------------------|--------------------------|
| Filter | `CovenantFilter` | See [CovenantFilter](#covenantfilter) | The covenant filter      |
| Arg    | `CovenantArg`    | See [CovenantArg](#covenantarg)       | The covenant argument(s) |

##### CovenantFilter

| Field               | Abstract Type            | Data Type | Description                  |
|---------------------|--------------------------|-----------|------------------------------|
| Identity            | `IdentityFilter`         | _none_    | The Identity                 |
| And                 | `AndFilter`              | _none_    | And operation                |
| Or                  | `OrFilter`               | _none_    | Or operation                 |
| Xor                 | `XorFilter`              | _none_    | Xor operation                |
| Not                 | `NotFilter`              | _none_    | Not operation                |
| Output Hash Equal   | `OutputHashEqFilter`     | _none_    | Output hash to be equal to   |
| Fields Preserved    | `FieldsPreservedFilter`  | _none_    | Fields to be preserved       |
| Field Equal         | `FieldEqFilter`          | _none_    | Field to be equal to         |
| Fields Hashed Equal | `FieldsHashedEqFilter`   | _none_    | Fields hashed to be equal to |
| Absolute Height     | `AbsoluteHeightFilter`   | _none_    | Absolute height              |

##### CovenantArg

| Field        | Abstract Type        | Data Type                            | Description                                           |
|--------------|----------------------|--------------------------------------|-------------------------------------------------------|
| Hash         | `FixedHash`          | `[u8;32]`                            | Future hash value                                     |
| PublicKey    | `PublicKey`          | `[u8;32]`                            | Future public key                                     |
| Commitment   | `PedersenCommitment` | `[u8;32]`                            | Future commitment referencing the output being spent. |
| Tari Script  | `TariScript`         | `Vec<u8>`                            | Future serialised script, maximum size is 512         |
| Covenant     | `Vec<CovenantToken>` | See [CovenantToken](#covenanttoken)  | Future covenant                                       |
| Output Type  | `OutputType`         | `u8`                                 | Future type of output                                 |
| Uint         | `Uint`               | `u64`                                | Future value                                          |
| Output Field | `OutputField`        | See [OutputField](#outputfield)      | Future set of output fields                           |
| OutputFields | `Vec<OutputField>`   | See [OutputField](#outputfield)      | Future set of output fields                           |
| Bytes        | `Vec<u8>`            | `u8`                                 | Future raw data                                       |

##### OutputField

| Field                        | Abstract Type | Data Type | Description                         |
|------------------------------|---------------|-----------|-------------------------------------|
| Commitment                   | `u8`          | `u8`      | Commitment byte code                |
| Script                       | `u8`          | `u8`      | Script byte code                    |
| Sender Offset Public Key     | `u8`          | `u8`      | SenderOffsetPublicKey byte code     |
| Covenant                     | `u8`          | `u8`      | Covenant byte code                  |
| Features                     | `u8`          | `u8`      | Features byte code                  |
| Features Output Type         | `u8`          | `u8`      | FeaturesOutputType byte code        |
| Features Maturity            | `u8`          | `u8`      | FeaturesMaturity byte code          |
| Features Metadata            | `u8`          | `u8`      | FeaturesMetadata byte code          |
| Features Side Chain Features | `u8`          | `u8`      | FeaturesSideChainFeatures byte code |

#### TransactionOutput

| Field                    | Abstract Type                     | Data Type                                                               | Description                                                                                             |
|--------------------------|-----------------------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Version                  | `TransactionOutputVersion`        | `u8`                                                                    | The TransactionOutput version                                                                           |
| Features                 | `OutputFeatures`                  | See [OutputFeatures](#outputfeatures)                                   | Options for the output's structure or use                                                               |
| Commitment               | `PedersenCommitment`              | `[u8;32]`                                                               | The homomorphic commitment representing the output amount                                               |
| Proof                    | `RangeProof`                      | `Vec<u8>`                                                               | A proof that the commitment is in the right range                                                       |
| Script                   | `TariScript`                      | `Vec<u8>`                                                               | The script that will be executed when spending this output                                              |
| Sender Offset Public Key | `PublicKey`                       | `[u8;32]`                                                               | The Tari script sender offset public key                                                                |
| Metadata Signature       | `CommitmentAndPublicKeySignature` | See [CommitmentAndPublicKeySignature](#commitmentandpublickeysignature) | A signature signing all transaction output metadata with the script offset private key and spending key |
| Covenant                 | `Vec<CovenantToken>`              | See [CovenantToken](#covenanttoken)                                     | A future-based contract detailing input and output metadata                                             |
| Encrypted Value          | `EncryptedValue`                  | `[u8;24]`                                                               | The encrypted value of the value commitment                                                             |
| Minimum Value Promise    | `MicroTari`                       | `u64` _(See [Value encryption](#value-encryption))_                     | The minimum value promise embedded in the range proof                                                   |

#### TransactionKernel

| Field            | Abstract Type                 | Data Type                                 | Description                                                                                                                                                                       |
|------------------|-------------------------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Version          | `TransactionKernelVersion`    | `u8`                                      | The TransactionKernel version                                                                                                                                                     |
| Features         | `KernelFeatures`              | `u8`                                      | Options for a kernel's structure or use                                                                                                                                           |
| Fee              | `MicroTari`                   | `u64`                                     | Fee originally included in the transaction this proof is for.                                                                                                                     |
| Lock Height      | `u64`                         | `u64`                                     | This kernel is not valid earlier than this height. The max maturity of all inputs to this transaction                                                                             |
| Excess           | `PedersenCommitment`          | `[u8;32]`                                 | Remainder of the sum of all transaction commitments (minus an offset). If the transaction is well-formed, amounts plus fee will sum to zero, and the excess is a valid public key |
| Excess Signature | `RistrettoSchnorr`            | See [RistrettoSchnorr](#ristrettoschnorr) | An aggregated signature of the metadata in this kernel, signed by the individual excess values and the offset excess of the sender                                                |
| Burn Commitment  | `PedersenCommitment`          | `[u8;32]`                                 | This is an optional field that must be set if the transaction contains a burned output                                                                                            |

#### RistrettoSchnorr

| Field        | Abstract Type | Data Type | Description                               |
|--------------|---------------|-----------|-------------------------------------------|
| Public nonce | `PublicKey`   | `[u8;32]` | The public nonce of the Schnorr signature |
| Signature    | `SecretKey`   | `[u8;32]` | The signature of the Schnorr signature    |

### New Block Template

The new block template is used in constructing a new partial block, allowing a miner to add the coinbase UTXO and as
a final step for the Base node to add the MMR roots to the header.

| Field                 | Abstract Type            | Data Type                                                   | Description                                                                |
|-----------------------|--------------------------|-------------------------------------------------------------|----------------------------------------------------------------------------|
| Header                | `NewBlockHeaderTemplate` | See [New Block Header Template](#new-block-header-template) | The Tari protocol version number, used for soft/hard forks                 |
| Body                  | `AggregateBody`          | See [Block Body](#block-body)                                | Height of this block since the genesis block                               |
| Target Difficulty     | `Difficulty`             | `u64`                                                       | The minimum difficulty required to satisfy the Proof of Work for the block |
| Reward                | `MicroTari`              | `u64`                                                       | The value of the emission for the coinbase output for the block            |
| Total Fees            | `MicroTari`              | `u64`                                                       | The sum of all transaction fees in this block                              |

#### New Block Header Template

| Field               | Abstract Type    | Data Type                         | Description                                                                                                                                                                  |
|---------------------|------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Version             | `u16`            | `u16`                             | The Tari protocol version number, used for soft/hard forks                                                                                                                   |
| Height              | `u64`            | `u64`                             | Height of this block since the genesis block                                                                                                                                 |
| Previous Hash       | `BlockHash`      | `[u8;32]`                         | Hash of the previous block in the chain                                                                                                                                      |
| Total Kernel Offset | `BlindingFactor` | `[u8;32]`                         | Total accumulated sum of kernel offsets since genesis block. We can derive the kernel offset sum for *this* block from the total kernel offset of the previous block header. |
| Total Script Offset | `BlindingFactor` | `[u8;32]`                         | Sum of script offsets for all transaction kernels in this block                                                                                                              |
| Pow                 | `ProofOfWork`    | See [Proof Of Work](#proof-of-work) | Proof of Work information                                                                                                                                                    |


[vector]: https://doc.rust-lang.org/rust-by-example/std/vec.html
[block header]: Glossary.md#block-header
[aggregate body]: Glossary.md#block-body
