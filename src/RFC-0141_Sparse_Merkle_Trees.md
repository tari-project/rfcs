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
   
<div style="line-height: 1em" class="hljs">
<pre>
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
</pre>
</div>

_Figure 1: An example sparse Merkle tree._

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
          
## Specification

Define the following constants:

| Name             | Type    | Value    |
|------------------|---------|----------|
| EMPTY_NODE_HASH  | bytes   | [0; 32]] |
| LEAF_PREFIX      | bytes   | b"V"     |
| BRANCH_PREFIX    | bytes   | b"B"     |
| KEY_LENGTH_BYTES | integer | 32       |
           
### Node types

Each `Node` in the tree is either, `Empty`, a `Leaf`, or a `Branch`. Every node in the tree is associated with a 
hash function, `H` that has a digest output length of `KEY_LENGTH_BYTES`.

Leaf nodes store the key and value in their data property. Leaf nodes are immutable, and MAY cache the hash value 
for efficiency.  

Branch nodes contain two `Node` instances, referring to the left and right child nodes respectively.  Branch nodes 
MAY store additional data, such as the height of the node in the tree, the key prefix and the node's hash value, for 
performance and efficiency purposes.

Default empty nodes always have a constant hash, `EMPTY_NODE_HASH`.  


In summary, the nodes are defined as:

```rust
pub struct LeafNode<H> {
    key: NodeKey,
    hash: NodeHash,
    value: ValueHash,
    hash_type: PhantomData<H>,
}

pub struct EmptyNode {}

impl EmptyNode {
    pub fn hash(&self) -> &'static NodeHash {
        &EMPTY_NODE_HASH
    }
}

pub struct BranchNode<H> {
    // The height of the branch. It is also the number of bits that all keys below this branch share.
    height: usize,
    // Only the first `height` bits of the key are relevant for this branch.
    key: NodeKey,
    hash: NodeHash,
    // Flag to indicate that the tree hash changed somewhere below this branch. and that the hash should be
    // recalculated.
    is_hash_stale: bool,
    left: Box<Node<H>>,
    right: Box<Node<H>>,
    hash_type: PhantomData<H>,
}
```

### Leaf node values

This specification outsources hashing the value data to an external service. 'Value' data in terms of the 
specification refers to the hash of the value data. The hashing algorithm used to hash the data SHOULD be different 
from `H`, to prevent second preimage attacks. 

The digest length of the value hashes does not need to be `KEY_LENGTH_BYTES`, but it MUST be a constant predefined 
length.

### Node hashes

#### Empty nodes

As described above, empty nodes always return `EMPTY_NODE_HASH` as the hash value.

#### Leaf nodes

The definition of a leaf node's hash is

    H::digest(LEAF_PREFIX || KEY(32-bytes) || VALUE_HASH)

The key MUST be included in the hash. Imagine every leaf node has the same value. If the key was not hashed, there 
would be many different tree structures that would yield the same tree root. Specifically, any tree could replace a 
leaf node with a different leaf node with the same key prefix corresponding to the height of the original leaf node 
without changing the root hash.  

#### Branch nodes

The definition of a branch node's hash is

    H::digest(BRANCH_PREFIX || height || key_prefix || left_child_hash || right_child_hash)

where

* `height` is the height of the branch in the tree, where the root node is height 0.
* `key_prefix` is the common prefix that the key of _every_ descendent node of this branch will begin with. 
  `key_prefix` is `KEY_LENGTH_BYTES` long, and every bit after the prefix MUST be set to zero. This means that key 
  prefixes are not unique. For example, every key prefix for the left-mode path down the tree will always have a 
  prefix of `[0; 32]`. The height parameter helps disambiguate this.
* `left_child_hash` and `right_child_hash` are the hashes of the left and right child noes respectively, and have 
  length `KEY_LENGTH_BYTES`. 

### Tree structure

The Merkle tree is built on top of an underlying dataset consisting of a set of (key, value) tuples. 
The key fixes the position of each dataset element in the tree: starting from the root, each digit in the binary 
expansion  indicates whether we should follow the left child (next digit is 0) or the right child (next digit is 1), 
see Figure 1. The length of the key (in bytes) is a fixed constant of the tree, `KEY_LENGTH_BYTES`, larger than 0.

Rather than explicitly creating a full tree, we simulate it by inserting only non-zero leaves into the tree whenever 
a new key-value pair is added to the dataset, using the two optimizations:

1. Each subtree with exactly one non-empty leaf is replaced by the leaf itself.
2. Each subtree containing only empty nodes is replaced by a constant node with hash value equal to `EMPTY_HASH`.

### Root Hash Calculation

The Merkle root of a dataset is computed as follows:

1. The Merkle root of an empty dataset is set to the constant value `EMPTY_HASH`.
2. The Merkle root of a dataset with a single element is set to the leaf hash of that element.
3. Otherwise, the Merkle root is the hash of the branch node occupying the root position. The child hashes are 
   calculated recursively using the definitions above.

### Adding or updating a key-value pair

Adding a new node or updating an existing one follows the same logic. Therefore, a single function, `upsert` is 
defined. The borrow semantics of Rust requires a slightly different approach to managing the tree than one might 
take in other languages (e.g. [LIP39]).

```rust
    pub fn upsert(&mut self, key: NodeKey, value: ValueHash) -> Result<UpdateResult, SMTError> {
        let new_leaf = LeafNode::new(key, value);
        if self.is_empty() {
            self.root = Node::Leaf(new_leaf);
            return Ok(UpdateResult::Inserted);
        } else if self.root.is_leaf() {
            return self.upsert_root(new_leaf);
        }
        // Traverse the tree until we find either an empty node or a leaf node.
        let mut terminal_branch = self.find_terminal_branch(new_leaf.key())?;
        let result = terminal_branch.insert_or_update_leaf(new_leaf)?;
        Ok(result)
    }
    
    /// Look at the height-th most significant bit and returns Left of it is a zero and Right if it is a one 
    fn traverse_direction(height: usize, child: &NodeKey) -> TraverseDirection {...}
    
    // Finds the branch node above the terminal node. The case of an empty or leaf root node must be handled elsewhere 
    fn find_terminal_branch(&mut self, child_key: &NodeKey) -> Result<TerminalBranch<'_, H>, SMTError> {
        let mut parent_node = &mut self.root;
        let mut empty_siblings = Vec::new();
        if !parent_node.is_branch() {
            return Err(SMTError::UnexpectedNodeType);
        }
        let mut done = false;
        let mut traverse_dir = TraverseDirection::Left;
        while !done {
            let branch = parent_node.as_branch_mut().unwrap();
            traverse_dir = traverse_direction(branch.height(), child_key)?;
            let next = match traverse_dir {
                TraverseDirection::Left => {
                    empty_siblings.push(branch.right().is_empty());
                    branch.left()
                },
                TraverseDirection::Right => {
                    empty_siblings.push(branch.left().is_empty());
                    branch.right()
                },
            };
            if next.is_branch() {
                parent_node = match traverse_dir {
                    TraverseDirection::Left => parent_node.as_branch_mut().unwrap().left_mut(),
                    TraverseDirection::Right => parent_node.as_branch_mut().unwrap().right_mut(),
                };
            } else {
                done = true;
            }
        }
        let terminal = TerminalBranch {
            parent: parent_node,
            direction: traverse_dir,
            empty_siblings,
        };
        Ok(terminal)
    }
```

```rust
struct TerminalBranch<'a, H> {
    parent: &'a mut Node<H>,
    direction: TraverseDirection,
    empty_siblings: Vec<bool>,
}

impl<'a, H: Digest<OutputSize = U32>> TerminalBranch<'a, H> {
    /// Returns the terminal node of the branch
    pub fn terminal(&self) -> &Node<H> {
        let branch = self.parent.as_branch().unwrap();
        branch.child(self.direction)
    }

    // When inserting a new leaf node, there might be a slew of branch nodes to create depending on where the keys
    // of the existing leaf and new leaf node diverge. E.g. if a leaf node of key `1101` is being inserted into a
    // tree with a single leaf node of key `1100` then we must create branches at `1...`, `11..`, and `110.` with
    // the leaf nodes `1100` and `1101` being the left and right branches at height 4 respectively.
    //
    // This function handles this case, as well the simple update case, and the simple insert case, where the target
    // node is empty.
    fn insert_or_update_leaf(&mut self, leaf: LeafNode<H>) -> Result<UpdateResult, SMTError> {
        let branch = self.parent.as_branch_mut().ok_or(SMTError::UnexpectedNodeType)?;
        let height = branch.height();
        let terminal = branch.child_mut(self.direction);
        match terminal {
            Empty(_) => {
                let _ = [Set terminal to the new leaf (Insert)]
                Ok(UpdateResult::Inserted)
            },
            Leaf(old_leaf) if old_leaf.key() == leaf.key() => {
                let old_value = [Replace of leaf with new leaf (Update)]
                Ok(UpdateResult::Updated(old_value))
            },
            Leaf(_) => {
                let branch = // Create a new sub-tree with the old and new leaf being children of a branch at the height
                             // of the common key-prefixes
                Ok(UpdateResult::Inserted)
            },
            _ => unreachable!(),
        }
    }
```

### Removing a Leaf Node

A certain key-value pair can be removed from the tree by deleting the corresponding leaf node and rearranging the 
affected nodes in the tree. The following protocol can be used to remove a key `k` from the tree.

```rust
    /// Attempts to delete the value at the location `key`. If the tree contains the key, the deleted value hash is
    /// returned. Otherwise, `KeyNotFound` is returned.
    pub fn delete(&mut self, key: &NodeKey) -> Result<DeleteResult, SMTError> {
        if self.is_empty() {
            return Ok(DeleteResult::KeyNotFound);
        }
        if self.root.is_leaf() {
            return self.delete_root(key);
        }
        let mut path = self.find_terminal_branch(key)?;
        let result = match path.classify_deletion(key)? {
            PathClassifier::KeyDoesNotExist => DeleteResult::KeyNotFound,
            PathClassifier::TerminalBranch => {
                let deleted = // prune tree placing sibling at correct place upstream
                DeleteResult::Deleted(deleted)
            },
            PathClassifier::NonTerminalBranch => {
                let deleted_hash = path.delete()?;
                DeleteResult::Deleted(deleted_hash)
            },
        };
        Ok(result)
    }
```

### Proof Construction

Proofs are constructed in a straightforward manner. Unlike other SMT implementations (e.g. [LIP39]), if a
sibling node is empty, then `EMPTY_NODE_HASH` is included as the sibling hash, rather than building a bitmap of
non-empty siblings.

Both inclusion and exclusion proofs use a common algorithm, `build_proof_candidate` for traversing the tree to the 
desired proof key,  
collecting hashes of every sibling node. The terminal node for where the proof key should reside is also noted:

```rust
pub struct ExclusionProof<H> {
    siblings: Vec<NodeHash>,
    // The terminal node of the tree proof, or `None` if the the node is `Empty`.
    leaf: Option<LeafNode<H>>,
    phantom: std::marker::PhantomData<H>,
}

impl<H: Digest<OutputSize = U32>> SparseMerkleTree<H> {
    /// Construct the data structures needed to generate the Merkle proofs. Although this function returns a struct
    /// of type `ExclusionProof` it is not really a valid (exclusion) proof. The constructors do additional
    /// validation before passing the structure on. For this reason, this method is `private` outside of the module.
    pub(crate) fn build_proof_candidate(&self, key: &NodeKey) -> Result<ExclusionProof<H>, SMTError> {
        let mut siblings = Vec::new();
        let mut current_node = &self.root;
        while current_node.is_branch() {
            let branch = current_node.as_branch().unwrap();
            let dir = traverse_direction(branch.height(), key)?;
            current_node = match dir {
                TraverseDirection::Left => {
                    siblings.push(branch.right().hash().clone());
                    branch.left()
                },
                TraverseDirection::Right => {
                    siblings.push(branch.left().hash().clone());
                    branch.right()
                },
            };
        }
        let leaf = current_node.as_leaf().cloned();
        let candidate = ExclusionProof::new(siblings, leaf);
        Ok(candidate)
    }
}
```

#### Inclusion proof

An inclusion proof is valid if the terminal node found in `build_proof_candidate` matches the key and value provided 
in the proof request. Equivalently, the leaf node's hash must match the hash of a new leaf node generated with the 
key and value given in the proof request.

The final proof consists of the vector of sibling hashes. 

```rust
pub struct InclusionProof<H> {
    siblings: Vec<NodeHash>,
    phantom: std::marker::PhantomData<H>,
}

impl<H: Digest<OutputSize = U32>> InclusionProof<H> {
    /// Generates an inclusion proof for the given key and value hash from the given tree. If the key does not exist in
    /// tree, or the key does exist, but the value hash does not match, then `from_tree` will return a
    /// `NonViableProof` error.
    pub fn from_tree(tree: &SparseMerkleTree<H>, key: &NodeKey, value_hash: &ValueHash) -> Result<Self, SMTError> {
        let proof = tree.build_proof_candidate(key)?;
        match proof.leaf {
            Some(leaf) => {
                let node_hash = LeafNode::<H>::hash_value(key, value_hash);
                if leaf.hash() != &node_hash {
                    return Err(SMTError::NonViableProof);
                }
            },
            None => return Err(SMTError::NonViableProof),
        }
        Ok(Self::new(proof.siblings))
    }
}
```

#### Exclusion proof

An exclusion proof request only requires a key value. A proof is valid if the leaf node returned by 
`build_proof_candidate` does not have the same key as the proof request.

The proof consists of the sibling hashes and a copy of the terminal leaf node.

```rust
impl<H: Digest<OutputSize = U32>> ExclusionProof<H> {
    /// Generates an exclusion proof for the given key from the given tree. If the key exists in the tree then
    /// `from_tree` will return a `NonViableProof` error.
    pub fn from_tree(tree: &SparseMerkleTree<H>, key: &NodeKey) -> Result<Self, SMTError> {
        let proof = tree.build_proof_candidate(key)?;
        // If the keys match, then we cannot provide an exclusion proof, since the key *is* in the tree
        if let Some(leaf) = &proof.leaf {
            if leaf.key() == key {
                return Err(SMTError::NonViableProof);
            }
        }
        Ok(proof)
    }
```
### Proof Verification

To check an exclusion proof, the Verifier calls the `ExclusionProof::validate(&self, keys, root)` function. This 
function is not a method of the tree, and can be run just by holding the Merkle root.  

The function reconstructs the tree using the expected key and places the leaf node provided in the proof at the terminal 
position. It then calculates the root hash. 

Validation succeeds if the calculated root hash matches the given root hash, and the leaf node is
empty, or the existing leaf node has a different key to the expected key.

```rust
    pub fn validate(&self, expected_key: &NodeKey, expected_root: &NodeHash) -> bool {
        let leaf_hash = match &self.leaf {
            Some(leaf) => leaf.hash().clone(),
            None => (EmptyNode {}).hash().clone(),
        };
        let root = self.calculate_root_hash(expected_key, leaf_hash);
        // For exclusion proof, roots must match AND existing leaf must be empty, or keys must not match
        root == *expected_root &&
            match &self.leaf {
                Some(leaf) => leaf.key() != expected_key,
                None => true,
            }
    }
```

Verifying inclusion proofs is similar, except that the terminal leaf node will be constructed from the key and value 
hash provided by the verifier.

```rust
    pub fn validate(&self, expected_key: &NodeKey, expected_value: &ValueHash, expected_root: &NodeHash) -> bool {
        // calculate expected leaf node hash
        let leaf_hash = LeafNode::<H>::hash_value(expected_key, expected_value);
        let calculated_root = self.calculate_root_hash(expected_key, leaf_hash);
        calculated_root == *expected_root
    }
```

## Backwards Compatibility

If the UTXO merkle root is replaced by a sparse merkle tree, this change would require a **hard fork**, 
since it fundamentally alters how the UTXO merkle root is calculated. 

# References

[SMT]: https://eprint.iacr.org/2016/683.pdf "Original paper"
[LIP39]: https://github.com/LiskHQ/lips/blob/main/proposals/lip-0039.md "LIP-0039: Introduce sparse Merkle trees"

1. Dahlberg et. al., "Efficient Sparse Merkle Trees", [SMT]
2. A. Ricottone, "LIP-0039: Introduce sparse Merkle trees", [LIP39]

# Change Log

| Date        | Change      | Author |
|-------------|-------------|--------|
| 10 Jul 2023 | First draft | CjS77  |
