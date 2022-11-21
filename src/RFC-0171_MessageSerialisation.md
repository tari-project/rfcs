# RFC-0171/MessageSerialization

<!-- TOC -->
  * [Goals](#goals)
  * [Related Requests for Comment](#related-requests-for-comment)
  * [Description](#description)
    * [Binary Serialization Formats](#binary-serialization-formats)
      * [bincode](#bincode)
      * [Message Pack](#message-pack)
      * [Protobuf](#protobuf)
      * [Cap'n Proto](#capn-proto)
      * [Hand-rolled Serialization](#hand-rolled-serialization)
    * [Tari message formats](#tari-message-formats)
      * [Wire message format](#wire-message-format)
      * [Other serialization formats](#other-serialization-formats)
* [Change Log](#change-log)
<!-- TOC -->

## Message Serialization

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77) [Stanley Bondi](https://github.com/sdbondi)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2019 The Tari Development Community

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

The aim of this Request for Comment (RFC) is to describe the message serialization formats for message payloads used in the Tari network.

## Related Requests for Comment

[RFC-0710: Tari Communication Network and Network Communication Protocol](RFC-0170_NetworkCommunicationProtocol.md)

## Description

One way of interpreting the Tari network is that it is a large peer-to-peer messaging application. The entities chatting
on the network include:

* Wallets
* Base nodes
* Validator nodes
* Other client applications (e.g. chat)

The types of messages that these entities send might include:

* Text messages
* Transaction messages
* Block propagation messages
* Asset creation instructions
* Asset state change instructions
* State Checkpoint messages

For successful communication to occur, the following needs to happen:

* The message is translated from its memory storage format into a standard payload format that will be transported over
  the wire.
* The communication module wraps the payload into a message format, which may entail any/all of
  * adding a message header to describe the type of payload;
  * encrypting the message;
  * signing the message;
  * adding destination/recipient metadata.
* The communication module then sends the message over the wire.
* The recipient receives the message and unwraps it, possibly performing any/all of the following:
  * decryption;
  * verifying signatures;
  * extracting the payload;
  * passing the serialized payload to modules that are interested in that particular message type.
* The message is deserialized into the correct data structure for use by the receiving software

This document only covers the first and last steps, i.e. serializing data from in-memory objects to a format that can
be transmitted over the wire. The other steps are handled by the Tari communication protocol.

In addition to machine-to-machine communication, we also standardize on human-to-machine communication. Use cases for
this include:

* Handcrafting instructions or transactions. The ideal format here is a very human-readable format.
* Copying transactions or instructions from cold wallets. The ideal format here is a compact but easy-to-copy format.
* Peer-to-peer text messaging. This is just a special case of what has already been described, with the message
  structure containing a unicode `message_text` field.

When sending a message from a human to the network, the following happens:

* The message is deserialized into the native structure.
* Additional validation can be performed.
* The usual machine-to-machine process is followed, as described above.

### Binary Serialization Formats

The ideal properties for binary serialization formats are:

* widely used across multiple platforms and languages, but with excellent Rust support;
* compact binary representation; and
* serialization "Just Works"(TM) with little or no additional coding overhead.

Several candidates fulfill these properties to some degree.

#### [bincode](https://docs.rs/bincode/latest/bincode/)

* Pros:
  * Fast and compact
  * Serde support
* Cons:
  * (Almost) any type changes result in incompatibilities
  * language support outside of rust is limited

#### [Message Pack](http://msgpack.org/)

* Pros:
  * Compact
  * Fast
  * Multiple language support
  * Good Rust/Serde support
  * Native byte encoding (compared to JSON)
* Cons:
  * No metadata support
  * Self-describing overhead
  
MessagePack has almost the exact same characteristics as JSON, without the syntactical overhead.
It is also self-describing, which can be a pro and a con. Like JSON, field names are encoded as strings 
which adds significant overhead over p2p comms. However, when used in conjunction with [msgpack-schemas](https://github.com/Idein/msgpack-schema)
this overhead is removed and binary representations become characteristically similar to protobuf.

#### [Protobuf](https://code.google.com/p/protobuf/)
[protobuf]: #protobuf "Protobuf"

Protobuf is a widely-used binary serialization format that was developed by Google and has excellent Rust support. 
The Protobuf byte format encodes tag numbers as varints that map to a known schema fields. 

* Pros:
  * Compact
  * Fast
  * Multiple language support
  * Good Rust/Serde support
  * Some schema changes are backward compatible
* Cons
  * Schema must be defined for each message type
  * Does not fit into the serde ecosystem, meaning it is hard to swap out later.

In the latest protoV3 spec, all fields are optional. 
which forces the implementation to check for the presence of required data
and allows for. This means that you can change your schema significantly and there is a 

It's fairly easy to reason about backwards-compatibility for schema changes once you understand [protobuf encoding]. 
Essentially, since all fields in protov3 are optional, a message will usually be able to successfully decode even if
message tags are added/changed/removed. It therefore depends on the application whether changes are backward-compatible.

Generally, the following rules apply:
- you should not change existing field types to a non-compatible type. For example, changing a `uint32` to a `uint64` is fine, but changing a `uint32` to a `string` is not.
- you should not change existing tag numbers should not be changed, field names may change as needed since they are not included in the byte format.
- you may delete optional or repeated fields
- you may add new optional or repeated fields as long as you use a new field number 

#### [Cap'n Proto](http://kentonv.github.io/capnproto/)

Similar to Protobuf, but claims to be much faster. Rust is supported.

#### Hand-rolled Serialization

[Hintjens recommends](http://zguide.zeromq.org/py:chapter7#Serialization-Libraries) using hand-rolled serialization for
bulk messaging. While Pieter usually offers sage advice, I'm going to argue against using custom serializers at this
stage for the following reasons:

* We're unlikely to improve hugely over existing serialization formats.
* Since Serde does 95% of our work for us, there's a significant development overhead (and new bugs)
  involved with a hand-rolled solution.
* We'd have to write de/serializers for every language that wants Tari bindings; whereas every major language has
  a protobuf implementation.

### Tari message formats

#### Wire message format 

The decision was taken to use [Protobuf](#protobufhttpscodegooglecompprotobuf) encoding for messages on the Tari peer-to-peer wire protocol, as it ticks these boxes:
- it is possible to modify message schemas in future versions without breaking network communication with previous versions of node software,
- de/encoding is compact and fast, and
- it has great Rust support through the [prost] crate.

#### Other serialization formats

For human-readable formats, it makes little sense to deviate from JSON. For copy-paste semantics, the extra compression
that Base64 offers over raw hex or Base58 makes it attractive.

The standard binary representation used in databases (e.g. blockchain storage, wallets) will make use of `bincode`. 
In these cases, a straightforward `#[derive(Deserialize, Serialize)]` is all that is required to implement de/encoding 
for the data structure. 

However, other structures might need fine-tuning, or hand-written serialization procedures. To capture both use cases,
it is proposed that a `MessageFormat` trait be defined:

```rust,compile_fail
pub trait MessageFormat: Sized {
    fn to_binary(&self) -> Result<Vec<u8>, MessageFormatError>;
    fn to_json(&self) -> Result<String, MessageFormatError>;
    fn to_base64(&self) -> Result<String, MessageFormatError>;

    fn from_binary(msg: &[u8]) -> Result<Self, MessageFormatError>;
    fn from_json(msg: &str) -> Result<Self, MessageFormatError>;
    fn from_base64(msg: &str) -> Result<Self, MessageFormatError>;
}
```

This trait will have default implementations to cover most use cases (e.g. a simple call through to `serde_json`). Serde
also offers significant ability to tweak how a given struct will be serialized through the use of
[attributes](https://serde.rs/attributes.html).

[msgpack schema]: https://github.com/Idein/msgpack-schema
[protobuf encoding]: https://developers.google.com/protocol-buffers/docs/encoding
[prost]: https://github.com/tokio-rs/prost

# Change Log

| Date        | Change            | Author  |
|:------------|:------------------|:--------|
| 29 Mar 2019 | First draft       | CjS77   |
| 24 Jul 2019 | Technical editing | anselld |
| 13 Oct 2022 | Update            | sdbondi |
| 26 Oct 2022 | Stabilise RFC     | CjS77   |
