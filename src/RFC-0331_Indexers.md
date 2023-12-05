# RFC-0304/Consensus

## The Tari Network Consensus Layer

![status: raw](theme/images/status-raw.svg)

**Maintainer(s)**: [stringhandler](https://github.com/stringhandler), [Stanley Bondi](https://github.com/sdbondi)

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

This Request for Comment (RFC) describes operation of Tari network Indexers. Indexers are a key actor in providing 
rapid, up-to-date and accurate information about the state of Tari contracts to client applications.

## Related Requests for Comment

* [RFC-303: Digital Assets Network](./RFC-0303_DanOverview.md)

## Introduction

Since the Tari network is designed to scale to hundreds of thousands of contracts, and millions of transactions per
hours, having a global state tracking system, like Etherscan, is neither feasible nor advisable. Instead, client 
applications (wallets, ticket apps, exchange front-ends etc) will run an _Indexer_ that follows the state of a 
finite set of contracts of interest all across the shard-space. 

You can think of Validator nodes staying in position and managing the state of a fixed set of addresses, possibly 
having to operate instructions for thousands of different contracts, while Indexers are constantly hopping around the 
shard-space, following the progress of a fixed set of contracts wherever their state goes.

Figure 1 illustrates this dynamic:

![Figure 1: Validator and Indexer](./assets/indexer_vs_vn.jpg)

<div class="note">
This specification is incomplete.
</div>

# Change Log

| Date        | Change      | Author |
|:------------|:------------|:-------|
| 23 Oct 2023 | First draft | CjS77  |


