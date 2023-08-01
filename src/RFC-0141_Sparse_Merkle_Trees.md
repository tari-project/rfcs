# RFC-0141/SparseMerkleTrees

## Sparse Merkle Trees: A mutable data structure for TXO commitments

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [CjS77](https://github.com/CjS77)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as 
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

This Request for Comment (RFC) proposes replacing the current Mutable Merkle Mountain Range (MMMR) data structure 
used for tracking the commitment to the UTXO set, with a Sparse Merkle tree (SMT).

## Related Requests for Comment

* [RFC-0110: Base Nodes](RFC-0110_BaseNodes.md)

## Description

### Sparse Merkle trees

A sparse Merkle tree ([SMT]) is a Merkle-type structure, except the contained data is indexed, and each datapoint is 
placed at the leaf that corresponds to that datapoint’s index. Empty nodes are represented by a predefined "null" value.

Since every empty node has the same hash, and the tree is sparse, it is possible to prune the tree in a way such 
that only the non-zero leaf nodes and placeholders marking the empty sub-trees are stored. Therefore, SMTs are 
relatively compact. 

A major feature of SMTs is that they are truly mutable. The current UTXO Merkle root in Tari is calculated using a 
Merkle Mountain Range (MMR). This has some drawbacks: 

1. MMRs are _immutable_ data structures,and therefore as a workaround (some would say, hack), a bitmap is appended 
   to the MMR to mark the spent outputs. In Tari's implementation, a roaring bitmap is used, which takes 
   advantage of compression, but even so, it is still fairly large and will grow indefinitely.
2. The Merkle tree must keep a record of all TXOs forever, and mark them as they are spent. The blockchain cannot 
   prune STXOs from the set.
3. The root is path-dependent. Let's say that the UTXO merkle root currently has a value `R1`. When you add a UTXO 
   to the set, to giving a new Merkle root `R2`, say, and then immediately remove the UTXO, the Merkle root will now be 
   some `R3` and _not_ `R1` as you might expect. This path dependence also extends to the order of adding UTXOs. 
   Adding UTXO `A` then `B` yields a different root to `B` then `A`.

SMTs are true mutable data structures and do not have these drawbacks. 

1. No tracking bitmap is needed. When a UTXO is spent, it can be deleted from the tree.
2. It is possible to prune STXOs from the UTXO set to calculate the Merkle root.
3. Adding and removing UTXOs in any order will always yield the same Merkle root. Adding, and then deleting a UTXO 
   from the set will result in the same Merkle root as before the UTXO was added.

### Inclusion and exclusion proofs

Inclusion proofs for the current MMMR structure are possible but clunky, since the entire bitmap state must be 
included with the Merkle tree proof.

Exclusion proofs are not possible in the current MMMR implementation, unless an output happens to be a spent output. 
In this "STXO proof", the form of the proof is identical to the inclusion proof, with the verifier checking that 
the bit corresponding to the TXO is set, rather than unset.

SMTs support inclusion _and_ exclusion proofs, and they are both succinct, O(log n), representations of the tree.

### Space savings

In terms of space, the SMT is more efficient than MMMRs and the advantage grows with time.

For an SMT, to calculate the root of the UTXO set, all you need is the UTXO set itself, assuming the commitment is 
used as the tree index.

Consider some representative numbers:

Let's assume there are 1,000,000 UTXOs, with another 2,000,000 UTXOs having being spent over the lifetime of the
project. A busy blockchain might achieve this level of traffic in a few days.

If each commitment-UTXO hash pair is 64 bytes, you need serialize 64MB to recreate the merkle root for the SMT.

For the MMMR, even though you only need the UTXO hash, you need all 3,000,0000 values (96MB) plus approximately 1MB 
for every million hashes in a bitmap to indicate which hashes have  been deleted (3 MB) for a total of 99MB.

This only gets worse with time. Over a period of a year, a busy blockchain might have 100,000,000 spent transaction 
outputs. However, the UTXO set will grow far more slowly, and perhaps only 10x in size to 10 million outputs.

The SMT tree requires serialising 640MB of data to recreate the root, whereas the MMMR now requires 3.6GB of data.

## Implementation

The proposed implementation assumes that a key-value store for the data exists. The Merkle tree is only 
concerned with the index and the value hash, as opposed to the value itself.

When constructing a new tree, a hashing algorithm is specified. As 
indicated, the "values" provided to the tree must already be a hash, and should have been generated from a different 
hashing algorithm to the one driving the tree, in order to prevent second pre-image attacks.

To insert a new leaf, the key is used to derive a path through the tree. Starting with the most significant bit, you 
move down the left branch if the bit is zero, or take the right branch if the bit is equal to one. Once a terminal 
node is reached, the node is replaced with a new sub-tree with the existing terminal node and the new leaf node forming the 
children of the last branch node in the sub-tree. The depth of the sub-tree is determined by the number of matching 
bits of the respective keys of the two nodes.

To delete a node, the procedure above is reversed. This entails that a significant portion of the tree may be pruned 
when deleting a node in a highly sparse region of the tree.

The null hashes representing the empty sub-trees are treated identically to the leaf nodes. 
Thus branch hashes are calculated in the usual way, _inter alia_, `H_branch = H(Branch marker, H_left, H_right)`, 
irrespective of whether the left or right nodes are empty or not. 

Domain separation SHOULD be used to distinguish branch nodes from leaf nodes. This also mitigates second pre-image 
attacks if the advice above is not followed and the values are hashed with the same algorithm as the tree. 

For leaf node hashes, the key MUST be included in the hash. This prevents leaf node spoofing of the pruned tree. 
Therefore, leaf node hashes are of the form `H_leaf = H(Leaf marker, H_key, H_value)`.

A proof of concept implementation has been written and submitted for review in 
[PR #5457](https://github.com/tari-project/tari/pull/5457). The examples that follow assume this implementation.


#### Example
Let's create a SMT with four nodes.

If we insert the nodes at
 * A: 01001111 (79 in decimal)
 * B: 01011111 (95 in decimal)
 * C: 11100000 (224 in decimal)
 * D: 11110000 (240 in decimal)

you will notice that the first two diverge at the first bit, while the first and last pairs differ at the
fourth bit. This results in a SMT that looks like this:

```text
            ┌──────┐
      ┌─────┤ root ├─────┐
      │     └──────┘     │
     ┌┴┐                ┌┴┐1
  ┌──┤ ├──┐          ┌──┤ ├───┐
  │  └─┘  │          │  └─┘   │
 ┌┴┐     ┌┴┐        ┌┴┐10    ┌┴┐11
 │0│  ┌──┤ ├──┐     │0│    ┌─┤ ├─┐
 └─┘  │  └─┘  │     └─┘    │ └─┘ │
     ┌┴┐     ┌┴┐       110┌┴┐   ┌┴┐111
   ┌─┤ ├─┐   │0│          │0│ ┌─┤ ├─┐
   │ └─┘ │   └─┘          └─┘ │ └─┘ │
  ┌┴┐   ┌┴┐                  ┌┴┐   ┌┴┐
  │A│   │B│                  │D│   │C│
  └─┘   └─┘                  └─┘   └─┘
```

The merkle root is calculated by hashing nodes in the familiar way.

Of note is that when we _delete_ all the nodes, the SMT hash is `000...`, as expected. The MMMR
will never have a hash that's the same after adding, and then deleting the same node because of the bitmap tracking
deleted entries.

So even though the SMT is slower, it is still fast enough. The bandwidth
savings are substantial and the privacy benefits are significant.

### Benchmarks

### Details
The SMT implementation is faster than `MutableMMR` up to around 10,000 nodes, and then the average depth starts to 
affect it. By 1,000,000  nodes, it is significantly slower than MMR.
 
This makes sense since MMR is basically O(1) for inserts, while SMT is O(log(n)).
 
A rudimentary benchmark test yielded the following results
    
 ```text
 Starting: SMT: Inserting 1000000 keys
 Finished: SMT: Inserting 1000000 keys - 1.921310493s
 Starting: SMT: Calculating root hash
 Tree size: 1000000. Root hash: 3e42ca40df366db52464c19b6ba71428976a56d7b120bc3c882fc29bf05dc1d7
 Finished: SMT: Calculating root hash - 644.226062ms
 Starting: SMT: Deleting 500000 keys
 Finished: SMT: Deleting 500000 keys - 863.873761ms
 Starting: SMT: Calculating root hash
 Tree size: 500000. Root hash: 2a7b51f114a17c229f1067feb4ba5b6aad975689160a5eab0d90f89a3bcf09f8
 Finished: SMT: Calculating root hash - 207.30907ms
 Starting: SMT: Deleting another 500000 keys
 Finished: SMT: Deleting another 500000 keys - 850.606501ms
 Starting: SMT: Calculating root hash
 Tree size: 0. Root hash: 0000000000000000000000000000000000000000000000000000000000000000
 Finished: SMT: Calculating root hash - 3.892µs
 Starting: MMR: Inserting 1000000 keys
 Finished: MMR: Inserting 1000000 keys - 741.641704ms
 Starting: SMT: Calculating root hash
 Tree size: 1000000. Root hash: da6135ccaabf146024cae1b0e7ad6ba7e9dad79724fb9199b721d4cd243ba999
 Finished: SMT: Calculating root hash - 8.649µs
 Starting: MMR: Deleting 500000 keys
 Finished: MMR: Deleting 500000 keys - 6.525858ms
 Starting: SMT: Calculating root hash
 Tree size: 500000. Root hash: fd60e168f27acba374109de9b8231e7252f0cfdf385f87dbfd92873d4956c995
 Finished: SMT: Calculating root hash - 50.276µs
 Starting: MMR: Deleting another 500000 keys
 Finished: MMR: Deleting another 500000 keys - 6.862469ms
 Starting: SMT: Calculating root hash
 Tree size: 0. Root hash: 5d70f3177a0b46ea1b853c58d5e3f7d6e78cbc4149d71592bb6cea63d50ed96c
 Finished: SMT: Calculating root hash - 93.618µs
```

The SMT is taking 1.92s to insert 1 mil nodes, or 1.9us per node on average on a 2018 Intel i9 Macbook Pro.

This is still sufficiently fast for our purposes and the benefits of having a truly mutable data structure, succinct 
inclusion and exclusion proofs, and significant serialisation savings far outweigh the performance costs. 

# References

[SMT]: https://eprint.iacr.org/2016/683.pdf "Original paper"

1. Dahlberg et. al., "Efficient Sparse Merkle Trees", [SMT]


# Change Log

| Date        | Change      | Author |
|-------------|-------------|--------|
| 10 Jul 2023 | First draft | CjS77  |
