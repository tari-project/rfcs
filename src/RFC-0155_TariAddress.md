# RFC-0155/TariAddress

## TariAddress specification

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**:[SW van Heerden](https://github.com/swvheerden)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2024. The Tari Development Community

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

This document outlines the specification for Tari Address, which are encoded wallet addresses used to verify wallet addresses, features, and networks. 
The address should have human-readable network and feature identification and contain all information required to send transactions to a wallet owning an address.

## Related Requests for Comment

None

## Description
Wallet addresses should contain all the necessary information for sending transactions to the corresponding wallet. Initially, a wallet must declare its supported features and the network it
operates on. To maintain readability, distinct identifiers are required for both the features and the network.

For typical interactive Mimblewimble (MW) transactions, a public key is necessary for communication. The private key associated with this MUST BE securely stored by the node to prevent spoofing.
This private key functions as the spend key for deriving the actual spend key for the Unspent Transaction Output (UTXO).

However, when non-interactive transactions are initiated, the process becomes more complex. If the receiving wallet is a standard one, it possesses all the essential information for spending
the transaction. Yet, if the recipient utilizes a hardware device like a ledger, the spending information is inaccessible to the wallet. Thus, a secondary view key becomes necessary.
While the wallet can share the private key of this view key with another party for UTXO viewing purposes, it cannot be used for spending.

Additionally, a checksum can be included to detect errors when encoding the address as bytes. Emojis can also be easily incorporated into the encoding process by assigning each u8 an emoji.

## The specification

### Address

Each address consists of four parts: View key, Spend key, Network, and Features.

#### View key
This key allows a node to grant view access to its transactions. Possession of the private key in this key pair SHOULD enable an entity to view all transactions associated with a wallet.

#### Spend key
Utilized to compute the spend key of a UTXO and communicate with the node over the network. The private key associated with this key pair must be securely kept hidden.

#### Features
Indicates the supported features of the wallet, such as interactive and one-sided transactions. Currently, this is represented by an encoded u8, with each bit denoting a specific feature.

| **Feature**                          | **Emoji** | **Hex** | **Base58** |
|--------------------------------------|-----------|---------|------------|
| one_sided only                       | 📟        | 01      | 2          |
| interactive only                     | 🌈        | 02      | 3          |
| onesided + interactive               | 🌊        | 03      | 4          |
| one_sided + payment_id               | 🐋        | 05      | 6          |
| interactive + payment_id             | 🌙        | 06      | 7          |
| onesided + interactive + payment_id | 🤔        | 07      | 8          |


#### Network
Specifies the Tari network the wallet operates on, e.g., Esmeralda, Nextnet, etc.

| **Network** | **Emoji** | **Hex** | **Base58** |
|-------------|-----------|---------|------------|
| Mainnet     | 🐢        | 00      | 1          |
| Stagenet    | 📟        | 01      | 2          |
| Nextnet     | 🌈        | 02      | 3          |
| Localnet    | 🌹        | 10      | H          |
| Igor        | 🍔        | 24      | d          |
| Esme        | 🍗        | 26      | f          |

#### Checksum
The checksum is only included when encoding the address as bytes, hex, or emojis. For the checksum, the: [DammSum](https://github.com/cypherstack/dammsum) algorithm is employed,
with `k = 8` and `m = 32`, resulting in an 8-bit checksum.

### Encoding 
#### Bytes
When generating a byte representation of the wallet, the following format is used:
- [0]: Network encoded as u8
- [1]: Raw u8 representing features
- [2..33]: Public view key encoded as u8
- [35..65]: Public spend key encoded as u8
- [66-N]: (Optional) Payment ID, encoded as u8
- [N+1]: DammSum checksum

For nodes lacking a distinct view key, where the view key and spend key are identical, their addresses can be encoded as follows:
- [0]: Network encoded as u8
- [1]: Raw u8 representing features
- [2..33]: Public spend key encoded as u8
- [34]: DammSum checksum

#### Hex
Each byte in the byte representation is encoded as two hexadecimal characters.

#### Emoji Encoding
An emoji alphabet of 256 characters has been selected, each assigned a unique index from 0 to 255 inclusive.
The list of chosen emojis is as follows:

| | | | | | | | | | | | | | | | |
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 🐢 | 📟 | 🌈 | 🌊 | 🎯 | 🐋 | 🌙 | 🤔 | 🌕 | ⭐ | 🎋 | 🌰 | 🌴 | 🌵 | 🌲 | 🌸 |
| 🌹 | 🌻 | 🌽 | 🍀 | 🍁 | 🍄 | 🥑 | 🍆 | 🍇 | 🍈 | 🍉 | 🍊 | 🍋 | 🍌 | 🍍 | 🍎 |
| 🍐 | 🍑 | 🍒 | 🍓 | 🍔 | 🍕 | 🍗 | 🍚 | 🍞 | 🍟 | 🥝 | 🍣 | 🍦 | 🍩 | 🍪 | 🍫 |
| 🍬 | 🍭 | 🍯 | 🥐 | 🍳 | 🥄 | 🍵 | 🍶 | 🍷 | 🍸 | 🍾 | 🍺 | 🍼 | 🎀 | 🎁 | 🎂 |
| 🎃 | 🤖 | 🎈 | 🎉 | 🎒 | 🎓 | 🎠 | 🎡 | 🎢 | 🎣 | 🎤 | 🎥 | 🎧 | 🎨 | 🎩 | 🎪 |
| 🎬 | 🎭 | 🎮 | 🎰 | 🎱 | 🎲 | 🎳 | 🎵 | 🎷 | 🎸 | 🎹 | 🎺 | 🎻 | 🎼 | 🎽 | 🎾 |
| 🎿 | 🏀 | 🏁 | 🏆 | 🏈 | ⚽ | 🏠 | 🏥 | 🏦 | 🏭 | 🏰 | 🐀 | 🐉 | 🐊 | 🐌 | 🐍 |
| 🦁 | 🐐 | 🐑 | 🐔 | 🙈 | 🐗 | 🐘 | 🐙 | 🐚 | 🐛 | 🐜 | 🐝 | 🐞 | 🦋 | 🐣 | 🐨 |
| 🦀 | 🐪 | 🐬 | 🐭 | 🐮 | 🐯 | 🐰 | 🦆 | 🦂 | 🐴 | 🐵 | 🐶 | 🐷 | 🐸 | 🐺 | 🐻 |
| 🐼 | 🐽 | 🐾 | 👀 | 👅 | 👑 | 👒 | 🧢 | 💅 | 👕 | 👖 | 👗 | 👘 | 👙 | 💃 | 👛 |
| 👞 | 👟 | 👠 | 🥊 | 👢 | 👣 | 🤡 | 👻 | 👽 | 👾 | 🤠 | 👃 | 💄 | 💈 | 💉 | 💊 |
| 💋 | 👂 | 💍 | 💎 | 💐 | 💔 | 🔒 | 🧩 | 💡 | 💣 | 💤 | 💦 | 💨 | 💩 | ➕ | 💯 |
| 💰 | 💳 | 💵 | 💺 | 💻 | 💼 | 📈 | 📜 | 📌 | 📎 | 📖 | 📿 | 📡 | ⏰ | 📱 | 📷 |
| 🔋 | 🔌 | 🚰 | 🔑 | 🔔 | 🔥 | 🔦 | 🔧 | 🔨 | 🔩 | 🔪 | 🔫 | 🔬 | 🔭 | 🔮 | 🔱 |
| 🗽 | 😂 | 😇 | 😈 | 🤑 | 😍 | 😎 | 😱 | 😷 | 🤢 | 👍 | 👶 | 🚀 | 🚁 | 🚂 | 🚚 |
| 🚑 | 🚒 | 🚓 | 🛵 | 🚗 | 🚜 | 🚢 | 🚦 | 🚧 | 🚨 | 🚪 | 🚫 | 🚲 | 🚽 | 🚿 | 🧲 |


These emojis are selected to ensure:

* Exclusion of similar-looking emojis to avoid confusion.
* Only the "base" emoji are considered; modified emojis (e.g., skin tones, gender modifiers) are excluded.
* Match emoji's used by Yat.

Each byte is encoded using the emoji listed at the corresponding index.

## Change Log

| Date         | Change                   | Author        |
|:-------------|:-------------------------|:--------------|
| 2024-05-31   | Initial stable           | SWvHeerden    |

[Communication Node]: Glossary.md#communication-node
[Node ID]: Glossary.md#node-id