# RFC-0174/Chat Metadata

## Versioning

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [brianp](https://github.com/brianp)

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
SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",
"NOT RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all
capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

The aim of this Request for Comment (RFC) is to describe the various types of versioning that nodes on the Tari network
will use during interaction with other nodes.

## Related Requests for Comment

- [RFC-0712: PeerToPeerMessagingProtocol](RFC-0172_PeerToPeerMessagingProtocol.md)

## Description

The chat protocol incorporates metadata within messages to support various message types, such as Replies,
TokenRequests, Gifs, and Links. This metadata-driven approach enhances the technical flexibility of chat,
allowing for the structured handling of distinct content and interactions within the messaging framework.

Chat metadata is transmitted simply as a length checked byte array allowing for flexbility of future content. Content is
unvalidated in the protocol and requires clients to ensure standardized formatting for specific types.

### Types & Formats

#### Reply:
MetadataType int: `0`  
Data format: `String message_id`
A reply metadata should be a single String element matching the UUID of the message being replied to.  
Example: `06703dbfeabc43b98ceff16de2e104bc`

### TokenRequest:
MetadataType int: `1`  
Data format: `double micro_minotari_amount`  
A double (reaL) number representing the request amount in MicroMinoTari.  
Example: `14000.87`

### Gif:  
MetadataType int: `2`  
Data format: `String giphy_url`  
A url to a giphy hosted image  
Example: `https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjN0dmR2aWNjbTluNGZ3ZHlubHNqajIwcmlqazdtYXExNWp4aG94NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VIPdgcooFJHtC/giphy.gif`

### Links:
MetadataType int: `3`  
Data format: `String uri`  
A uri in string format  
Example: `https://www.tari.com/`  

# Change Log

| Date        | Change         | Author |
|:------------|:---------------|:-------|
| 21 Dec 2023 | Proposal draft | brianp |
