# RFC-0172/PeerToPeerMessaging

## Peer to Peer Messaging Protocol

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Stanley Bondi](https://github.com/sdbondi), [Cayle Sharrock](https://github.com/CjS77), [Yuko Roodt](https://github.com/neonknight64), [Stringhandler](https://github.com/stringhandler)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

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

The aim of this Request for Comment (RFC) is to describe the peer-to-peer messaging protocol for [communication node]s 
and [communication client]s on the Tari network.

## Related Requests for Comment

- [RFC-0170: NetworkCommunicationProtocol](rfc-0170_NetworkCommunicationProtocol.md)
- [RFC-0171: MessageSerialization](RFC-0171_MessageSerialisation.md)

## Description

### Assumptions

- All wire messages are de/serialized as per [RFC-0171: Message Serialisation].
- All peer's public identities are based on [Ristretto] [prime order elliptic curves](https://tlu.tarilabs.com/cryptography/elliptic-curves).

### Broad Requirements

Tari network peer communication must facilitate secure, private and efficient communication
between peers. Broadly, a [communication node] or [communication client] MUST be capable of:

- bidirectional communication between multiple connected peers;
- encrypted, authenticated over-the-wire communication;
- understanding and constructing Tari messages;
- gracefully reestablishing dropped connections; and (optionally)
- either: 
  - communicating to a SOCKS5 proxy (e.g. connections over Tor).
  - or have a static public IPv4 address.

Additionally, communication nodes MUST be capable of performing the following tasks:

- maintaining a list of known and available peers in the form of a peer list;
- forwarding directed messages to neighbouring peers; and
- broadcasting messages to neighbouring peers.

### Overall Architectural Design

The Tari communication layer has a modular design to allow for the various communicating nodes and clients to
use the same infrastructure code.

Peer connection state is monitored by the `ConnectionManager` component. The `ConnectionManager` emits events to allow 
other components to subscribe to connection state changes. 

- `ConnectionManager` - manages peer connections and connection state monitoring.
- `PeerConnection` - manages the sending and receiving of messages for a single peer connection.
- `NetAddress` - [multiaddr] describing the public address and transport for a peer-to-peer connection.
- `Messaging Protocol` - defines the Tari wire message format and message types.
- `Connection Multiplexer` - allows multiple substreams to be established over a single transport-level connection.

#### NetAddress

A `NetAddress` is a publicly-accessible address for a peer. A peer may have one or more `NetAddress`es. 

A good `NetAddress` format should:
- have an efficient binary representation;
- have a human-readable representation with a simple syntax;
- support many transport protocols; and
- be self-describing

For these reasons, we select the [multiaddr] format for all peer-to-peer addresses.

For example,
- `/ip4/123.123.123.123/tcp/12345` - IPv4 address with TCP transport on port 12345.
- `/onion3/abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrst:12345` - Tor onion address 

#### Supported Transports

The following transports are supported by the Tari communication layer:
- TCP/IP - A publicly accessible IPv4 address.
- SOCKS5 - Allows a SOCKS5 proxy to be configured for inbound and outbound connections.
- Tor - A specialisation of the SOCKS5 transport that facilitates connections over the Tor network.

#### Establishing a Connection

Every participating [communication node] SHOULD listen on at least one of the supported transports, accessible from a
public address, to allow remote peers to establish peer connections. 

A peer wishing to establish a peer connection should attempt a connection to one of the remote peer's public 
[NetAddresses][NetAddress] using the transport described in the [NetAddress]. 

The peer that is initiating the _outbound_ connection is referred to as _the initiator_ and the peer that accepts the
_inbound_ connection is referred to as _the responder_ for the remainder of this section. 

We describe the following socket upgrade procedures for an encrypted peer-to-peer connection on the Tari network.

1. The Wire Mode Byte

The wire mode indicates the intention of the initiator. It is up to the application domain to dictate what byte is acceptable
however a common configuration is to use the wire mode to indicate which network (mainnet, testnet etc) the initiator is 
attempting to use allowing the responder to accept/reject the connection early on in the connection procedure.

_The initiator_ MUST send a single byte indicating the wire mode within `WIRE_MODE_TIMEOUT`.
_The responder_ SHOULD to accept or reject (close) the connection based on the initiator's wire mode byte.
_The responder_ SHOULD reject (close) the connection if no byte is received within `WIRE_MODE_TIMEOUT`.

Once the byte is sent, the initiator may immediately proceed to the next procedure.

2. The [Noise Protocol]

The [Noise Protocol] framework is a set of related crypto protocols that support mutual authentication and ephemeral 
encryption key exchange amongst other features. 

We list the following characteristics and requirements for encrypted peer-to-peer connections on the Tari network:
- Mutual authentication of the initiator and responder;
- _the responder_ need not know _the initiator's_ public identity prior to the connection;
- the public identity of each participant is hidden to any observer; 
- forward secrecy; and,
- for efficiency, has a minimal round trip time.

For these reasons we select the single round-trip `Noise_IX_25519_ChaChaPoly_BLAKE2b` protocol, that is, the Noise IX 
handshake pattern using Curve25519 for ephemeral and static identities, ChaChaPoly encryption and a HKDF using BLAKE2b.

If successful, an authenticated encrypted socket connection is established between the peers.

3. Identity Exchange

At this point the initiator and responder are aware of each other's public identity keys, however, some additional
information is required to fully "introduce" the participants to each other.

Both the initiator and responder simultaneously transmit a message containing their up-to-date public addresses, 
the peer feature flags, protocols supported by the peer, a timestamp of the last time these details changed 
and a signature that signs the public addresses, feature flags and update timestamp. Peers may store and share 
these details with other peers, who can check the authenticity of the provided information by verifying the signature.

4. Multiplexing

Now that these procedures are complete, we have an active PeerConnection. There is no explicit protocol message required 
to initiate multiplexing as both sides implicitly agree to send [yamux] protocol messages. Light-weight [Yamux][yamux] 
substreams are opened lazily as/when required by the application.

Multiplexing allows a single socket connection to be used simultaneously by multiple components as if each had their own
dedicated channel, in a very similar way that your browser can perform many HTTP2 requests over a single server connection.
In [yamux], these dedicated channels are called substreams. The details of the [yamux] protocol are out of scope for this
RFC.

### Protocol Negotiation

To begin any protocol, an initiator MUST open a new [yamux] substream and begin protocol negotiation.
Protocol negotiation ensures that both sides of the exchange are speaking the same language. 
Protocols are identified by a unique string identifier given by the author of the protocol.
A protocol name can technically be any string, but it is defined in the Tari protocol as `t/{protocol-ident}/{version}`,
where `t` is short for Tari, for example the messaging protocol is `t/msg/0.1`.

To begin, the initiator MUST send a protocol negotiation message consisting of 1 length byte, 
1 bitflag byte and the protocol identifier string. The length byte MUST be equal to the length of the protocol identifier.

The bitflags are defined as follows:
- `0x01` - `OPTIMISTIC`
- `0x02` - `TERMINATE`
- `0x04` - `PROTOCOL_NOT_SUPPORTED` (response)
- `0x08 - 0x128` - Future use (ignored)

If the `OPTIMISTIC` flag is set, the initiator considers the negotiation complete as it is optimistic that the responder 
supports it. It can assume this because the peer gave a list of supported protocols in the [Identity Exchange](#identity-exchange) 
procedure. If the responder does not support the protocol, it can simply close the substream.

In general, peers will use `OPTIMISTIC` negatation and never wait for a response, as they have a full list of supported 
protocols. However, if the initiator wishes to negotiate a protocol not in the protocol list, it may leave the `OPTIMISTIC` 
flag unset in the initial message.

If the responder supports the protocol, it SHOULD respond with the name of the supported protocol and all flags unset and
immediately proceed with the agreed upon protocol.
If not, it SHOULD respond with the `PROTOCOL_NOT_SUPPORTED` flag set and an empty protocol name and wait for more messages.
The initiator MAY send another protocol negotiation message or close the substream.

A responder MAY set the `TERMINATE` flag at any time and close the substream. In practise, this is used to indicate to the 
initiator that it has exceeded the maximum number of protocol negotiation queries (5) and should give up.

#### Peer

A single peer that can communicate on the Tari network.

Fields include:

- `public_key` - The [Ristretto] public key identity of the peer.
- `addresses` - a list of [NetAddress]es associated with the peer, perhaps accompanied by some bookkeeping metadata, such
  as preferred address;
- `peer_features` - bitflags with the following flags
  - `MESSAGE_PROPAGATION = 0x01` - peer is able to propagate/route messages
  - `DHT_STORE_FORWARD = 0x02` - peer provides message storage and can respond to `SafRequestMessages`
  - A `COMMUNICATION_NODE` is defined as `0x03` (`MESSAGE_PROPAGATION | DHT_STORE_FORWARD`)
  - A `COMMUNICATION_CLIENT` is defined as `0x00`
- `last_seen` - a timestamp of the last time a message has been sent/received from this peer;
- `banned_until` - an optional timestamp indicating the peer is banned;
- `offline_at` - an optional timestamp indicating at which time a peer was marked as offline due to multiple failed attempts to contact the peer.

A peer may also contain reputation metrics (e.g. rejected_message_count, avg_latency) to be used to decide
if a peer should be banned. This mechanism is yet to be decided.

#### PeerManager

The PeerManager is responsible for managing the list of peers with which the node has previously interacted.
This list is called a routing table and is made up of [Peer]s.

The PeerManager can

- add a peer to the routing table;
- search for a peer given a node ID, public key or [NetAddress];
- delete a peer from the list;
- persist the peer list using a storage backend;
- restore the peer list from the storage backend;
- maintain lightweight views of peers, using a filter criterion, e.g. a list of peers that have been banned, i.e. a denylist; and
- prune the routing table based on a filter criterion, e.g. last date seen.

### General-purpose Messaging Protocol

The messaging protocol is a simple fire-and-forget protocol where arbitrary messages can be sent between peers.
If Alice wants to send a message to Bob, she will open a new [yamux] substream and [negotiate](#protocol-negotiation) the 
`t/msg/0.1` protocol. If Bob wants to send a message to Alice, he will do the same. This means that two substreams (one per direction)
are open for bi-directional message sending as required. 

Message frames are length delimited (see [Tokio's LengthDelimitedCodec](https://docs.rs/tokio-util/latest/tokio_util/codec/length_delimited/)).
At this level, no structure apart from the length-delimited framing is imposed on the message protocol allowing that 
to be fully determined by domain-level components.

#### Tari DHT and Base-Layer Messaging Protocol

The following illustrates the structure of a Tari message:

```text
+----------------------------------------+
|              DhtEnvelope               |
|  +----------------------------------+  |
|  |             DhtHeader            |  |
|  +----------------------------------+  |
|  +----------------------------------+  |
|  |         EnvelopeBody             |  |
|  | (multipart, optionally encrypted)|  |
|  | +------------------------------+ |  |
|  | |   +-----------------------+  | |  |
|  | |   |    1. MessageHeader   |  | |  |
|  | |   +-----------------------+  | |  |
|  | |   +-----------------------+  | |  |
|  | |   |    2. MessageBody     |  | |  |
|  | |   +-----------------------+  | |  |
|  | +------------------------------+ |  |
|  +----------------------------------+  |
+----------------------------------------+
```

Each Tari message is wrapped in a `DhtEnvelope` which contains a `DhtHeader` and an `EnvelopeBody`.

The `DhtHeader` is a protobuf message with these fields:
- `version: u32` 

  The major message header version. A peer MAY discard the message if the version is not supported.

- `message_signature: 64 bytes` 

  The raw representation of a Schnorr signature committing to: 
  - sender public key
  - signature public nonce
  - and Blake2b hash of:
    - "comms.dht.v1.message_signature"
    - version 
    - destination 
    - msg_type 
    - flags 
    - expiry 
    - ephemeral_public_key 
    - body 
  
  This is required if the `ENCRYPTED` flag is set.

- `ephemeral_public_key: 32 bytes`

  Ephemeral public key component of the ECDH shared key. MUST be specified if the ENCRYPTED flag is set.

- `dht_message_type: i32`

  Enumeration of the type of message.    
  - None = 0 - Domain-level message
  - Join = 1 - Join/Announce
  - Discovery = 2 - Discovery request
  - DiscoveryResponse = 3 - Response to a discovery request
  - SafRequestMessages = 20 - Request stored messages from a node
  - SafStoredMessages = 21 - Stored messages response

- `flags: u32` - bitflags `0x01 - ENCRYPTED` 
- `message_tag: u64` - Message trace ID. This can be omitted or any value and is used for debug tracing.
- `expires: Option<prost_types::Timestamp>`

  Expiry timestamp for the message, if any. If specified any peer receiving the message after this time MAY discard it.

- `destination: Option<dht_header::Destination>`

  Enumeration of the message destination:
  - `UNKNOWN = 0` - the destination was not specified, this indicates that the message is destined for the receiver.
  - `PUBLICKEY(XXXXX) = 1` - destination is the specified public key. This MUST be provided when the `ENCRYPTED` flag is set.

##### Inbound Message Validation

The following validation rules MUST be applied to all incoming messages:

- If `ENCRYPTED` is set
  - The `destination` MUST be `PUBLICKEY(XXXXX)`
  - The `ephemeral_public_key` MUST be specified
  - The `message_signature` MUST be non-empty
  - If able to decrypt the message signature:
    - the signature MUST be valid
    - the destination public key MUST match the local public key
- If the `ENCRYPTED` flag is not set, indicating a cleartext message
  - The `message_signature` MAY be specified. If it is, it MUST be valid.
  - Other fields relating to encryption e.g. `ephemeral_public_key` MAY be set but SHOULD be ignored.

If any of these rules fail the message SHOULD be discarded.

##### Outbound Messaging

The protocol provides for the following outbound message broadcast strategies:

- `Direct(Identity)` - Send the message directly to the destination peer. 
- `Flood(exclude)` - Send to all connected peers excluding `exclude` peers. If no peers are connected, no messages are sent.
- `Random(n, exclude)` - Send to a random set of peers of size n that are Communication Nodes, excluding `exclude` peers.
- `ClosestNodes({node_id, exclude, connected_only})` - Send to all n nearest Communication Nodes to the given node_id.
- `DirectOrClosestNodes({node_id, exclude, connected_only})` - Send directly to destination if connected but otherwise send to all n nearest Communication Nodes
- `Broadcast(excludes)`- Send to a random set of _connected_ peers, excluding `excludes` peers. The number of peers selected at most equal to `propagation_factor`.
- `SelectedPeers(peers)` - Send to the specified peers.
- `Propagate(NodeDestination, Vec<NodeId>)` - Propagate to a set of _connected_ peers closer to the destination. The number of peers selected at most equal to `propagation_factor`.

A peer's node_id is defined as the 13-byte variable-length Blake2b hash of the public key. To determine if a peer identity 
is "closer" to another peer we compare the XOR distance between peers as proposed by the [kademlia] paper.

##### DHT Messages

- `Join`

Announces a peer's availability to the network. A routing node SHOULD propagate this message closer to the destination. 
As it travels through the network, the peer information is stored in the peer list. Peers close to the newly 
joined node MAY attempt to dial the node on receipt of this message.

- `Discovery`

An encrypted discovery request containing the sender's contact details. A routing node SHOULD propagate this message closer to the destination.
The destination peer will attempt to contact the sender and send a `DiscoveryResponse` message to reciprocate with its peer information.

- `DiscoveryResponse`

Sent in response to a `Discovery` message. 

- `SafRequestMessages` / `SafStoredMessages`

Request and response messages for stored messages destined for the requester.

##### EnvelopeBody

The `EnvelopeBody` is the "payload" of the message and consists of an arbitrary number of ordered opaque BLOBs.
It may be encrypted for a particular destination. The contents of these BLOBs are decided by domain-level requirements.

The Tari protocol inserts a `MessageHeader` at index 0 and `MessageBody` at index 1.

A zero-sized encoding of `EnvelopeBody` is permitted as that is a valid proto3 encoding. When applying [message encryption](#message-encryption), 
the body MUST be padded and, therefore, a message SHOULD be discarded if the encoded `EnvelopeBody` is zero-sized.

##### MessageHeader

Every Tari message MUST have a payload header containing the following fields at index 0 in the `EnvelopeBody`:

| Name         | Type  | Description                                                                   |
|--------------|-------|-------------------------------------------------------------------------------|
| message_type | `u8`  | An enumeration of the message type of the body. Refer to message types below. |
| nonce        | `u32` | The optional message nonce.                                                   |

MessageTypes are represented as an unsigned eight-bit integer denoting the expected contents of the `MessageBody`.

| Category   | Name                            | Value | Description                                                                                 |
|------------|:--------------------------------|-------|---------------------------------------------------------------------------------------------|
| Network    | PingPong                        | 1     | A PongPong message.                                                                         |
| Blockchain | NewTransaction                  | 65    | Transaction submitted by a wallet or propagated by a base node.                             |
| Blockchain | NewBlock                        | 66    | Block propagated by a base node.                                                            |
| Wallet     | SenderPartialTransaction        | 67    | A partial MimbleWimble transaction submitted by a sender wallet to the receiver.            |
| Wallet     | ReceiverPartialTransactionReply | 68    | Reply to SenderPartialTransaction submitted by a receiver wallet to the sender.             |
| Blockchain | BaseNodeRequest                 | 69    | Base node request message.                                                                  |
| Blockchain | BaseNodeResponse                | 70    | Base node response in reply to a BaseNodeRequest message.                                   |
| Blockchain | MempoolRequest                  | 71    | Base node mempool request message.                                                          |
| Blockchain | MempoolResponse                 | 72    | Base node response in reply to a MempoolRequest message.                                    |
| Wallet     | TransactionFinalized            | 73    | Finalized transaction message sent by a sender to receiver wallet.                          |
| Wallet     | TransactionCancelled            | 74    | A courtesy message sent by a wallet to inform the other that the transaction is cancelled.  |

All other message types are reserved for future use.

##### Message Encryption

Encrypted messages may be routed across the Tari network such that only the destination node is able to decipher the 
contents of the message. An encrypted message reveals to recipient but keeps the sender and contents private.

To route an encrypted message, the following requirements MUST be met:
- The destination public key MUST be specified.
- The `message_signature` MUST be non-empty and SHOULD be encrypted.
- The `ephemeral_public_key` MUST be a valid [Ristretto] public key.
- The `EnvelopeBody` MUST be non-empty, as message padding (described below) is required.
- If the message `expiry` is specified, a routing node MAY discard the message if the expiry time has passed.

A message is encrypted using the following procedure:
- The `DhtEnvelopBody` is containing the `MessageHeader` and `MessageBody` is serialized using [protobuf].
- A CSRNG is used to generate the cipher nonce and this is prepended onto the message.
- The plaintext message is padded with '0x00' to a multiple of 6000 bytes.
- The message encryption key is generated as follows:
  - Key material `dh_key` is generated by Diffie-Hellman of the recipient public key and the ephemeral private key.
  - The final message key is constructed: `message_key = Blake2b("comms.dht.v1.key_message" || dh_key)` to produce a 32-byte key.
- The message Schnorr signature is generated as follows:
  - A domain-separated Blake2b hash is generated with the challenge `message_challenge = Blake2b("comms.dht.v1.challenge" || protocol_version || destination || dht_message_type || le_bytes(flags) || expiry || ephemeral_public_key || message_body)`.
  - The signer signs the hashed challenge `"comms.dht.v1.message_signature" || signer_public_key || public_nonce || message_challenge` with the sender secret key.
  - The signature is serialized and encrypted using the [ChaCha20Poly1305] AEAD cipher and the same `dh_key` constructed earlier.
    - The final signature key is constructed: `Blake2b("comms.dht.v1.key_signature" || dh_key)` to produce a 32-byte key.
- The `DhtEnvelopBody` is encrypted using the [ChaCha20Poly1305] AEAD cipher and `message_key`.
- The final message is a `DhtEnvelope` containing the plaintext `DhtHeader` and encrypted `DhtEnvelopeBody`.

##### Message Routing

On receipt of a valid message with destination set to `PUBLIC_KEY(xxxx)`, a node SHOULD forward a message either
directly to the peer, if able, or closer to the peer as per the XOR metric. If the message is invalid, the node
SHOULD discard it.

##### Store and Forward

Sometimes it may be desirable for messages to be sent without a destination node/client being online. This
is especially important for a modern chat/messaging application as well as interactive Mimblewimble transactions.

Each [communication node] SHOULD allocate some disk space for storage of messages for offline recipients.
A sender sends a message destined for a particular public identity to its closest peers, which forward the message
to their closest peers, and so on. A peer is considered close enough by finding the farthest peer from the `n` closest 
online and available peers to the storage node and comparing that to the XOR distance of the message destination.

Eventually, the message will reach nodes that either know the destination or are very close to the destination.
These nodes SHOULD store the message in some pending message storage for the destination. The maximum number of
buckets and the size of each bucket SHOULD be sufficiently large as to be unlikely to overflow, but not so
large as to approach disk space problems. Individual messages should be small and responsibilities for
storage spread over the entire network.

On receipt of a valid message with destination set to `PUBLIC_KEY(xxxx)`, and if the peer is sufficiently close to the destination,
a node SHOULD store the message for a time and return it later to the peer in response to a `SafRequestMessages` message.

If the [DhtEnvelopeBody] is encrypted, the type and contents of the message remain private.

##### Message Deduplication

A peer propagating/routing a message may receive the same message after propagation from another peer as there is no way 
for routing node to know which peers have seen the message before. To prevent infinite message propagation, message contents 
should be hashed and stored in a _dedup cache_. On receiving a message, if the message hash is found, the message SHOULD be
discarded and not propagated further.

# Change Log

| Date        | Change                        | Author        |
|:------------|:------------------------------|:--------------|
| 13 Jun 2022 | Moved from tari repo          | sdbondi       |
| 9 Nov 2022  | Removed I2P and ZeroMQ        | stringhandler |
| 17 Jan 2023 | Implementation parity updates | sdbondi       |
| 25 Jan 2023 | Clarify empty body rules      | sdbondi       |

[communication client]: Glossary.md#communication-client
[communication node]: Glossary.md#communication-node
[netaddress]: #netaddress
[node id]: Glossary.md#node-id
[outboundconnection]: #outboundconnection
[peer]: #peer
[peerconnection]: #peerconnection
[rfc-0171: message serialisation]: RFC-0171_MessageSerialisation.md#wire-message-format
[multiaddr]: https://multiformats.io/multiaddr/
[Noise Protocol]: http://www.noiseprotocol.org/
[yamux]: https://github.com/hashicorp/yamux/blob/master/spec.md
[kademlia]: https://www.scs.stanford.edu/~dm/home/papers/kpos.pdf
[Ristretto]: https://ristretto.group/