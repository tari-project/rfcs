# The Tari Base Layer

The Tari Base Layer network comprises the following major pieces of software:

- Base Layer full node implementation. The base layer full nodes are the consensus-critical pieces of software for the
  Tari base layer and cryptocurrency. The base nodes validate and transmit transactions and blocks, and maintain
  consensus about the longest valid proof-of-work blockchain.
- Peer-to-peer communications network. All blockchain systems need a messaging mechanism. The Tari project has 
  built its own peer-to-peer, end-to-end encrypted, DHT-based communications platform. It utilises the 
  [Noise protocol](https://noiseprotocol.org/) and [Tor](https://www.torproject.org/)  to be highly secure and 
  anonymous. Devices behind NATs and firewalls can use Tari's communication tools with ease.
- Mining software. Miners perform proof-of-work to secure the base layer and compete to submit the
  next valid block into the Tari blockchain. Tari uses two Proof of Work (PoW) algorithms, the first is 
  [merge-mined](RFC-0132_Merge_Mining_Monero.md) 
  with Monero, and the second is the native [SHA3x](RFC-0131_Mining.md) algorithm.
  The Tari source provides three alternatives for Tari miners:
  - A standalone miner for SHA3 mining
  - A merge-mining proxy to be used with XMRig to merge mine Tari with Monero
- Wallet software. Client software and Application Programming Interfaces (APIs) offering means to construct 
  transactions, query nodes for information and maintain personal private keys. The reference design includes a 
  wallet library, an C FFI interface, gRPC client and server code, a multi-platform console text-based wallet, and 
  Aurora, the mobile wallet. 

The RFCs in this section go into great describing how the various components work, and how they fit together to 
provide the backbone of the Tari ecosystem.
