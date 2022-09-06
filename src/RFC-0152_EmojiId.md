# RFC-0152/EmojiId

## Emoji Id specification

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**:[Cayle Sharrock](https://github.com/CjS77)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2022. The Tari Development Community

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

## Goals

This document describes the specification for Emoji Ids. Emoji Ids are encoded node ids used for humans to easily verify
peer node addresses.

## Related Requests for Comment

None

## Description

Tari [Communication Node]s are identified on the network via their [Node ID]; which in turn are derived from the node's
public key. Both the node id and public key are simple large integer numbers.

The most common practice for human beings to copy large numbers in cryptocurrency software is to scan a QR code or copy
and paste a value from one application to another. These numbers are typically encoded using hexadecimal or Base58
encoding. The user will then typically scan (parts) of the string by eye to ensure that the value was transferred
correctly.

For Tari, we propose encoding values, the node ID in particular, using emoji. The advantages of this approach are:

* Emoji are more easily identifiable; and if selected carefully, less prone to identification errors (e.g. mistaking an
  O for a 0).
* The alphabet can be considerably larger than hexadecimal (16) or Base58 (58), resulting in shorter character sequences
  in the encoding.

### The specification

#### The emoji character map
An emoji alphabet of 256 characters is selected. Each emoji is assigned a unique index from 0 to 255 inclusive. This
list is the emoji map. For example,

* 😀 => 0
* 😘 => 1
* ...
* 🦊 => 255

The emoji SHOULD be selected such that

* Similar looking emoji are excluded from the map. e.g. Neither 😁 or 😄 should be included. Similarly the Irish and
  Côte d'Ivoirean flags look very similar, and both should be excluded.
* Modified emoji (skin tones, gender modifiers) are excluded. Only the "base" emoji is considered.

#### Encoding

The selection of an alphabet with 256 symbols means there is a direct mapping between bytes and emoji. For each byte
in the input data to be encoded, map the byte to the corresponding emoji using the emoji map. The resulting
concatenation of emoji characters is the emoji string.

#### Emoji ID definition

The emoji ID is an emoji string of 33 symbols from the emoji alphabet. It uses this bitmap:

```text
+-----------------------------+-------------------+
|  Node public key (256 bits) | Checksum (8 bits) |
+-----------------------------+-------------------+
```

 The emoji ID is calculated from a node public key serialized as 32 bytes (`B`) as follows:

* Use the [DammSum](https://github.com/cypherstack/dammsum) algorithm with `k = 8` and `m = 32` to compute an 8-bit
checksum `C` from `B`.
* Encode `B` into an emoji string.
* Encode `C` into an emoji string.
* Concatenate `B` and `C` as the emoji ID.

#### Decoding

One can extract the node public key from an emoji ID as follows:

* Assert that the emoji ID contains exactly 33 valid emoji characters from the emoji alphabet. If not, return an error.
* Decode the emoji ID as an emoji string by mapping each emoji character to a byte value using the emoji map, producing
33 bytes. Let `B` be the first 32 bytes, and `C` be the last byte.
* Use the DammSum validation algorithm on `B` to assert that `C` is a valid checksum. If not, return an error.
* Attempt to deserialize `B` as a public key. If this fails, return an error. If it succeeds, return the public key.


[Communication Node]: Glossary.md#communication-node
[Node ID]: Glossary.md#node-id
