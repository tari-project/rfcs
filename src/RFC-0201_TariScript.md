# RFC-0201/TariScript

## TariScript

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77), [Stringhandler](https://github.com/stringhandler)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2020 The Tari Development Community

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
SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT
RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all
capitals, as shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update without
notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

This Request for Comment (RFC) presents a proposal for introducing [TariScript] into the Tari base layer protocol. Tari
Script aims to provide a general mechanism for enabling further extensions such as side-chains, the DAN, one-sided
payments and atomic swaps.

## Related Requests for Comment

- [RFC-0200: Base Layer Extensions](BaseLayerExtensions.md)
- [RFC-0202: TariScript Opcodes](RFC-0202_TariScriptOpcodes.md)
- [RFC-0204: TariScript Examples](RFC-0204_TariScriptExamples.md)
- [RFC-0250: Covenants](RFC-0250_Covenants.md)

$$
\newcommand{\script}{\alpha} % utxo script
\newcommand{\input}{ \theta }
\newcommand{\cat}{\Vert}
\newcommand{\so}{\gamma} % script offset
\newcommand{\hash}[1]{\mathrm{H}\bigl({#1}\bigr)}
$$

## Introduction

It is hopefully clear to anyone reading these RFCs that the ambitions of the Tari project extend beyond a
Mimblewimble-clone-coin.
It should also be fairly clear that vanilla Mimblewimble does not have the feature set to provide functionality such as:

- One-sided payments
- Multiparty side-chain peg outs and peg-ins
- Generalised smart contracts

Extensions to [Mimblewimble] have been proposed for most of these features, for example, David Burkett's one-sided payment
proposal for LiteCoin ([LIP-004]) and this project's [HTLC RFC](RFC-0230_HTLC.md).

Some smart contract features are possible, or partly possible in vanilla [Mimblewimble] using [Scriptless script], such as

- Atomic swaps 
- Hash time-locked contracts

This RFC makes the case that if Tari were to implement a scripting language similar to Bitcoin script, then all of these
use cases will collapse and can be achieved under a single set of (relatively minor) modifications and additions to the
current Tari and Mimblewimble protocol.

## Scripting on Mimblewimble

Other than Beam, none of existing [Mimblewimble] projects have not employed a scripting language. 
 
[Grin](https://github.com/mimblewimble/grin) styles itself as a "Minimal implementation of the Mimblewimble protocol",
so one might infer that this status is unlikely to change soon.

Beam [does have a smart contract](https://github.com/BeamMW/beam/wiki/Beam-Smart-Contracts)
protocol, which allows users to execute arbitrary code (shaders) in a sandboxed Beam VM and have the results of that 
code interact with transactions.

[Mimblewimble coin](https://github.com/mwcproject/mwc-node/blob/master/doc/roadmap.md) is a fork of Grin and "considers
the protocol ossified".

Litecoin has included Mimblewimble as a
[side-chain through MWEB](https://github.com/litecoin-project/lips/blob/master/lip-0003.mediawiki). As of 2022, there appears
to be no plans to include general scripting into the protocol.

### Scriptless scripts

[Scriptless script] is a wonderfully elegant technology and inclusion of [TariScript] does not preclude the use of
Scriptless script in Tari. However, scriptless scripts have some disadvantages:

- They are often difficult to reason about, with the result that the development of features based on scriptless scripts
  is essentially in the hands of a very select group of cryptographers and developers.
- The use case set is impressive considering that the "scripts" are essentially signature wrangling, but is still 
  somewhat limited.
- Every feature must be written and implemented separately using the specific and specialised protocol designed for that
  feature. That is, it cannot be used as a dynamic scripting framework on a running blockchain.

## TariScript - a brief motivation

The essential idea of [TariScript] is as follows:

Given a standard Tari UTXO, we add _additional restrictions_ on whether that UTXO can be included as a valid input in a
transaction.

As long as those conditions are suitably committed to, are not malleable throughout the existence of the UTXO, and one
can prove that the script came from the UTXO owner, then these conditions are not that different to the 
requirement of having range proofs attached to UTXOs, which require that the value of Tari commitments is non-negative.

This argument is independent of the nature of the additional restrictions. Specifically, if these restrictions are
manifested as a script that provides additional constraints over whether a UTXO may be spent, the same arguments apply.

This means that in a very hand-wavy sort of way, there ought to be no reason that TariScript is not workable.

Note that range proofs can be discarded after a UTXO is spent. This entails that the global security guarantees of
Mimblewimble are not that every transaction in history was valid from an inflation perspective, but that the net effect
of all transactions lead to zero spurious inflation. This sounds worse than it is, since locally, every individual
transaction is checked for validity at the time of inclusion in the blockchain.

If it somehow happened that two illegal transactions made it into the blockchain (perhaps due to a bug), and the two
cancelled each other out such that the global coin supply was still correct, one would never know this when doing a
chain synchronisation in pruned mode.

But if there was a steady inflation bug due to invalid range proofs making it into the blockchain, a pruned mode sync
would still detect that _something_ was awry, because the global coin supply balance acts as another check.

With TariScript, once the script has been pruned away, and then there is a re-org to an earlier point on the chain,
then there's no way to ensure that the script was honoured unless you run an archival node.

This is broadly in keeping with the Mimblewimble security guarantees that, in pruned-mode synchronisation, individual 
transactions are not necessarily verified during chain synchronisation.

However, the guarantee that no additional coins are created or destroyed remains intact.

Put another way, the blockchain relies on the network _at the time_ to enforce the TariScript spending rules. 
This means that the scheme may be susceptible to certain _horizon attacks_.

Incidentally, a single honest archival node would be able to detect any fraud on the same chain and provide a simple 
proof that a transaction did not honour the redeem script.

### Additional requirements

The assumptions that broadly equate scripting with range proofs in the above argument are:

- The script must be committed to the blockchain.
- The script must not be malleable in any way without invalidating the transaction. This restriction extends to all 
  participants, including the UTXO owner.
- We must be able to prove that the UTXO originator provides the script and no-one else.
- The scripts and their redeeming inputs must be stored on the block chain. In particular, the input data must not be
  malleable.

### Preventing Cut-through
A major issue with many Mimblewimble extension schemes is that miners are able to cut-through UTXOs if an output is 
spent in the same block it was created. This makes it so that the intervening UTXO never existed; along with any checks 
and balances carried in that UTXO. It's also impossible to prove without additional information that cut-through even 
occurred (though one may suspect, since the "one" transaction would contribute two kernels to the block).

In particular, cut-through is devastating for an idea like TariScript which relies on conditions present in the UTXO 
being enforced. For example, say there is a UTXO in the mempool that everyone knows the blinding factor to, but is 
restricted to a single public key via the TariScript. A malicious user can spend the UTXO in a zero conf transaction, 
and send the cut-through transaction to the mempool. Since the miner only sees the resulting aggregate transaction, it 
cannot know that there was a TariScript on the removed UTXO. The solution to this problem is described later in this RFC.

In contrast range proofs are still valid if they are cut-through, because the resulting UTXOs must have
valid range proofs. 

## Protocol modifications

Please refer to [Notation](#notation), which provides important pre-knowledge for the remainder of the report.

At a high level, TariScript works as follows:

- The spending _script_ \\((\script)\\) is recorded in the transaction UTXO.
- Although scripts are included on the UTXO, they are only executed when the UTXO is **spent**, and in most cases, will require additional
 input data to be provided at this time. 
- The _script input data_ is recorded in the transaction inputs.
- When validating a transaction, the _script_ is executed using the _script input data_.
- After the _script_ \\((\script)\\) is executed, the execution stack must contain exactly one value that will be 
  interpreted as the _[script public key]_ \\((K\_{S})\\). 
- The _[script public key]_ and commitment must match the _script signature_ on the input, which prevents malleability of the data in the input.
- To prevent a script from being removed from a UTXO, a new field  _[sender offset] public key_ \\((K\_{O})\\) has been added.
- The _sender offset private keys_ \\((k\_{O})\\) and _script private keys_ \\((k\_{S})\\) are used in conjunction to 
  create a _script offset_ \\((\so)\\), which are used in the consensus balance to prevent a number of attacks.

> NOTE: One can prove ownership of a UTXO by demonstrating knowledge of both the commitment _blinding factor_ \\((k\\)), _and_ the _[script private key]_ \\((k_\{S})\\) for a valid script input.

### UTXO data commitments

The script, as well as other UTXO metadata, such as the output features are signed for with the [sender offset] private 
key to prevent malleability. As we will describe later, the notion of a [script offset] is introduced to prevent 
cut-through and forces the preservation of these commitments until they are recorded into the blockchain.
 
There are two changes to the protocol data structures that must be made to allow this scheme to work. 

The first is a relatively minor adjustment to the transaction output definition.
The second is the inclusion of script input data and an additional public key in the transaction input field.

### Commitment and public key signature

The Commitment and Public Key signature ([CAPK Signature]) is used in Tari protocols as part of transaction authorization. 
It can be thought of as a combination (not addition) of a commitment signature ([Signature on Commitment values] by F. 
Zhang et. al. and [Commitment Signature] by G. Yu.) and a Schnorr Signature. Given a commitment 
\\( C  = a \cdot H  + x \cdot G \\) and group element \\( PK = y \cdot G \\)\, a CAPK Signature is based on a 
representation proof of both openings \\( (a, x) \\) and \\( y \\). It additionally binds to arbitrary message data 
\\( m \\) via the challenge to produce a signature construction. 

The construction works as follows:
- Sample scalar nonces \\( (r_a, r_x, r_y) \\) uniformly at random.
- Compute ephemeral values \\( C_{eph} = r_a \cdot H + r_x \cdot G \\) and \\( PK_{eph} = r_y \cdot G \\) where
  \\( C_{eph} \\) is the ephemeral commitment and \\( PK_{eph} \\) is the ephemeral public key.
- Use strong Fiat-Shamir to produce a challenge \\( e \\). If \\( e \overset{?}{=} 0 \\) (this is unlikely), abort and 
  start over.
- Compute the responses \\( u_a = r_a + e \cdot a \\) and \\( u_x = r_x + e \cdot x \\) and \\( u_y = r_y + e \cdot y\\) 
  where \\( e \\) is the challenge scalar.

A commitment signature tuple has the form \\( (u_a, u_x, C_{eph}) \\) where \\( u_a \\) and \\( u_x \\) are the first  
second commitment signature scalars respectively. A Schnorr signature tuple has the form \\( (u_y, PK_{eph}) \\) where 
\\( u_y \\) is the public key signature scalar. The CAPK Signature therefor has the combined form 
\\( (u_a, u_x, C_{eph}, u_y, PK_{eph}) \\). Note that in this context a signature scalar is also a private key. 

To verify:
- The verifier computes the challenge \\( e \\) and rejects the signature if \\( e \overset{?}{=} 0 \\) (this is 
  unlikely).
- Verification succeeds if and only if the following equations hold:

$$
\begin{aligned}
u_a \cdot H + u_x \cdot G &\overset{?}{=} C_{eph} + e \cdot C \\\\
u_y \cdot G &\overset{?}{=} PK_{eph} + e \cdot PK
\end{aligned}
\tag{1}
$$

We note that it is possible to make verification slightly more efficient by reducing calculation of the number of 
group elements by one. To do so, the verifier selects a nonzero scalar weight \\( w \\) uniformly at random (not 
through Fiat-Shamir!) and accepts the signature if and only if the following equation holds:

$$
\begin{aligned}
u_a \cdot H + (u_x + w \cdot u_y) G  - C_{eph} - w \cdot PK_{eph} - e \cdot C - (w \cdot e) PK \overset{?}{=} 0
\end{aligned}
\tag{2}
$$


### Transaction output changes

The definition of a Tari _script-less_ UTXO would be:

```rust,ignore
pub struct TransactionOutput {
    /// Options for an output's structure or use
    features: OutputFeatures,
    /// The homomorphic commitment representing the output amount
    commitment: Commitment,
    /// A proof that the commitment is in the right range
    proof: RangeProof,
}
```

_Note:_ With a Tari _script-less_ UTXO, the output features would be malleable, but TariScript fixes this.

Under TariScript, this definition changes to accommodate the script and the [sender offset] public keys:

```rust,ignore
pub struct TransactionOutput {
    /// Options for an output's structure or use
    features: OutputFeatures,
    /// The homomorphic commitment representing the output amount
    commitment: Commitment,
    /// A proof that the commitment is in the right range
    proof: RangeProof,
    /// The serialised script
    script: Vec<u8>,
    /// The sender offset pubkey, K_O
    sender_offset_public_key: PublicKey
    /// UTXO signature signing the transaction output data and the homomorphic commitment with a combination 
    /// of the homomorphic commitment private values (amount and blinding factor) and the sender offset private key.
    metadata_signature: CommitmentAndPublicKeySignature,
}
```

The [metadata signature] is a [CAPK Signature] (as described [here](#commitment-and-public-key-signature)) signed with 
the commitment value, \\( v_i \\), known by the sender and receiver, the spending key, \\( k_i \\), known by the 
receiver and the sender offset private key, \\(k\_{Oi}\\), known by the sender. (_Note that \\( k\_{Oi} \\) should be 
treated as a nonce._) The CAPK Signature is effectively an aggregated CAPK Signature between the sender and receiver, 
and the challenge consists of all the transaction output metadata, effectively forming a contract between the sender and 
receiver, making all those values non-malleable and ensuring only the sender and receiver can enter into this contract.

For purposes of this RFC we denote the metadata signature terms as follows:
- \\( R_{MRi} \\) is the ephemeral commitment, 
- \\( R_{MSi} \\) is the ephemeral public key, 
- \\( a_{MRi} \\) and \\( b_{MRi} \\) are the first and second commitment signature scalars,
- \\( b_{MSi} \\) is the public key signature scalar. 

<u>Sender:</u>

The sender's ephemeral public key is:

$$
\begin{aligned}
R_{MSi} &= r_{MSi_b} \cdot G
\end{aligned}
\tag{3}
$$

The sender sends \\( (K\_{Oi}, R_{MSi}) \\) along with the other partial transaction information 
\\( (\script_i, F_i) \\) to the receiver, who now has all the required information to calculate the final challenge.

<u>Reciver:</u>

The commitment definition is unchanged:

$$
\begin{aligned}
C_i = v_i \cdot H  + k_i \cdot G
\end{aligned}
\tag{4}
$$

The receiver's ephemeral commitment is:

$$
\begin{aligned}
R_{MRi} &= r_{MRi_a} \cdot H + r_{MRi_b} \cdot G
\end{aligned}
\tag{5}
$$

The final challenge is:

$$
\begin{aligned}
e &= \hash{ R_{MSi} \cat R_{MRi} \cat \script_i \cat F_i \cat K_{Oi} \cat C_i} \\\\
\end{aligned}
\tag{6}
$$

The receiver can now calculate their portion of the aggregated CAPK Signature as:

$$
\begin{aligned}
a_{MRi} &= r_{MRi_a} + e \cdot v_{i} \\\\
b_{MRi} &= r_{MRi_b} + e \cdot k_i
\end{aligned}
\tag{7}
$$

The receiver sends \\( s_{MRi} = (a_{MRi}, b_{MRi}, R_{MRi} ) \\) along with the other partial transaction information
\\( (C_i) \\) to the sender.

<u>Sender:</u>

The sender starts by calculating the final challenge \\( e \\) (6) and then completes their part of the aggregated CAPK 
Signature.

$$
\begin{aligned}
b_{MSi} &= r_{MSi_b} + e \cdot k\_{Oi}
\end{aligned}
\tag{8}
$$

The final CAPK Signature is combined as follows:

$$
\begin{aligned}
s_{Mi} = (a_{MRi}, b_{MRi}, R_{MRi}, b_{MSi}, R_{MSi} )
\end{aligned}
\tag{9}
$$


<u>Verifier:</u>

This is verified by the following:

$$
\begin{aligned}
a_{MRi} \cdot H + b_{MRi} \cdot G &\overset{?}{=} R_{MRi} + e \cdot C \\\\
b_{MSi} \cdot G &\overset{?}{=} R_{MSi} + e \cdot K\_{Oi}
\end{aligned}
\tag{10}
$$

Note that:
- The UTXO has a positive value \\( v \\) like any normal UTXO.
- The script and the output features can no longer be changed by the miner or any other party. This includes the sender 
  and receiver; they would need to cooperate to enter into a new contract to change any metadata, otherwise the 
  metadata signature will be invalidated.
- We provide the complete script on the output.

### Transaction input changes

The definition of a Tari _script-less_ input would be:

```rust,ignore
pub struct TransactionInput {
    /// The features of the output being spent. We will check maturity for all outputs.
    pub features: OutputFeatures,
    /// The commitment referencing the output being spent.
    pub commitment: Commitment,
}
```

In standard Mimblewimble, an input is the same as an output _sans_ range proof. The range proof doesn't need to be 
checked again when spending inputs, so it is dropped. 

The updated input definition is:

```rust,ignore
pub struct TransactionInput {
    /// Options for an output's structure or use
    features: OutputFeatures,
    /// The homomorphic Pedersen commitment representing the output amount
    commitment: Commitment,
    /// The serialised script
    script: Vec<u8>,
    /// The script input data, if any
    input_data: Vec<u8>,
    /// Signature signing the script, input data, [script public key] and the homomorphic commitment with a combination 
    /// of the homomorphic commitment private values (amount and blinding factor) and the [script private key].
    script_signature: CommitmentAndPubKeySignature,
    /// The sender offset pubkey, K_O
    sender_offset_public_key: PublicKey
}
```

The [script signature] is a [CAPK Signature]  using a combination of the output commitment private values 
\\( (v\_i \\, , \\, k\_i )\\) and [script private key] \\(k\_{Si}\\) to prove ownership thereof. It signs the script, 
the script input, [script public key] and the commitment.

For purposes of this RFC we denote the script signature terms as follows:
- \\( R_{SCi} \\) is the ephemeral commitment,
- \\( R_{SPi} \\) is the ephemeral public key,
- \\( a_{SCi} \\) and \\( b_{SCi} \\) are the first and second commitment signature scalars,
- \\( b_{SPi} \\) is the public key signature scalar.

<u>Sender:</u>

The script signature is given by  

$$
\begin{aligned}
s_{Si} = (a_{SCi}, b_{SCi}, R_{SCi}, b_{SPi}, R_{SPi} )
\end{aligned}
\tag{11}
$$

where

$$
\begin{aligned}
R_{SCi} &= r_{SCi_a} \cdot H + r_{SCi_b} \cdot G \\\\
a_{SCi}  &= r_{SCi_a} +  e \cdot v_i \\\\
b_{SCi} &= r_{SCi_b} +  e \cdot k_i \\\\
R_{SPi} &= r_{SPi_b} \cdot G \\\\
b_{SPi} &= r_{SPi_b} +  e \cdot k_{Si} \\\\
\end{aligned}
\tag{12}
$$

with the challenge being

$$
\begin{aligned}
e &= \hash{ R_{SCi} \cat R_{SPi} \cat \alpha_i \cat \input_i \cat K_{Si} \cat C_i} \\\\
\end{aligned}
\tag{13}
$$

<u>Verifier:</u>

This is verified by the following:

$$
\begin{aligned}
a_{SCi} \cdot H + b_{SCi} \cdot G &\overset{?}{=} R_{SCi} + e \cdot C \\\\
b_{SPi} \cdot G &\overset{?}{=} R_{SPi} + e \cdot K_{Si}
\end{aligned}
\tag{14}
$$


The script public key \\(K\_{Si}\\) needed for the script signature verification is not stored with the 
TransactionInput, but obtained by executing the script with the provided input data. Because this signature is signed 
with the script private key \\(k\_{Si}\\), it ensures that only the owner can provide the input data \\(\input_i\\) to 
the TransactionInput. 

### Script Offset

For every transaction an accompanying [script offset] \\( \so \\) needs to be provided. This is there to prove that every  
script public key \\( K\_{Sj} \\) and every sender offset public key \\( K\_{Oi} \\) supplied with the UTXOs are the 
correct ones. The sender will know and provide sender offset private keys \\(k_{Oi} \\) and script private keys 
\\(k_{Si} \\); these are combined to create the script offset \\( \so \\), which is calculated as follows:

$$
\begin{aligned}
\so = \sum_j\mathrm{k_{Sj}} - \sum_i\mathrm{k_{Oi}} \\; \text{for each input}, j,\\, \text{and each output}, i
\end{aligned}
\tag{15}
$$

Verification of (15) will entail:

$$
\begin{aligned}
\so \cdot G = \sum_j\mathrm{K_{Sj}} - \sum_i\mathrm{K_{Oi}} \\; \text{for each input}, j,\\, \text{and each output}, i
\end{aligned}
\tag{16}
$$

We modify the transactions to be:

```rust,ignore
pub struct Transaction {
    
    ...
    
    /// A scalar offset that links outputs and inputs to prevent cut-through, enforcing the correct application of
    /// the output script.
    pub script_offset: BlindingFactor,
}
```

All script offsets (\\(\so\\)) from (15) contained in a block is summed together to create a total [script offset] (17) 
so that algorithm (15) still holds for a block.

$$
\begin{aligned}
\so_{total} = \sum_k\mathrm{\so_{k}}\\; \text{for every transaction}, k
\end{aligned}
\tag{17}
$$

Verification of (17) will entail:

$$
\begin{aligned}
\so_{total} \cdot G = \sum_j\mathrm{K_{Sj}} - \sum_i\mathrm{K_{Oi}} \\; \text{for each input}, j,\\, \text{and each output}, i
\end{aligned}
\tag{18}
$$

As can be seen all information required to verify (17) is contained in a block's inputs and outputs. One important 
distinction to make is that the Coinbase output in a coinbase transaction does not count towards the script offset. 
This is because the Coinbase UTXO already has special rules accompanying it and it has no input, thus we cannot generate 
a script offset \\( \so \\). The coinbase output can allow any script \\(\script_i\\) and sender offset public key 
\\( K\_{Oi} \\) as long as it does not break any of the rules in [RFC 120](RFC-0120_Consensus.md) and the script is 
honored at spend. If the coinbase is used as in input, it is treated exactly the same as any other input.

We modify Blockheaders to be:
```rust,ignore
pub struct BlockHeader {
    
    ...
    
    /// Sum of script offsets for all kernels in this block.
    pub total_script_offset: Scalar,
}
```

This notion of the script offset \\(\so\\) means that the no third party can remove any input or output from a 
transaction or the block, as that will invalidate the script offset balance equation, either (16) or (18) depending on 
whether the scope is a transaction or block. It is important to know that this also stops 
[cut&#8209;through](#cut-through) so that we can verify all spent UTXO scripts. Because the script private key and  
sender offset private key is not publicly known, its impossible to create a new script offset.

Certain scripts may allow more than one valid set of input data. Users might be led to believe that this will allow a 
third party to change the script keypair \\((k\_{Si}\\),\\(K\_{Si})\\). If an attacker can change the \\(K\_{Si}\\) 
keys of the input then he can take control of the \\(K\_{Oi}\\) as well, allowing the attacker to change the metadata of 
the UTXO including the script. But as shown in [Script offset security](#script-offset-security), this is not possible.

If equation (16) or (18) balances then we know that every included input and output in the transaction or block has its 
correct script public key and sender offset public key. Signatures (9) & (11) are checked independently from script 
offset verification (16) and (18), and looked at in isolation those could verify correctly but can still be signed by 
fake keys. When doing verification in (16) and (18) you know that the signatures and the message/metadata signed by the 
private keys can be trusted.

### Consensus changes

The Mimblewimble balance for blocks and transactions stays the same.

In addition to the changes given above, there are consensus rule changes for transaction and block validation.

Verify that for every valid transaction or block:

1. The [metadata signature] \\( s\_{Mi} \\) is valid for every output.
2. The script executes successfully using the given input script data.
3. The result of the script is a valid script public key, \\( K\_S \\).
4. The script signature, \\( s\_{Si} \\), is valid for every input.
5. The script offset is valid for every transaction and block.

### Preventing Cut-through with the Script Offset

Earlier, we described that cut-through needed to be prevented. This is achieved by the script offset in the TariScript proposal. It mathematically links all inputs 
and outputs of all the transactions in a block and that tallied up to create the script offset. Providing the script 
offset requires knowledge of keys that miners do not possess; thus they are unable to produce the necessary script 
offset when attempting to perform cut-through on a pair of transactions.

Lets show by example how the script offset stops cut-through, where Alice spends to Bob who spends to Carol. Ignoring 
fees, we have: 

$$
C_a \Rightarrow  C_b \Rightarrow  C_c
$$

For these two transactions, the total script offset is calculated as follows:

$$
\begin{aligned}
\so_1 = k_{Sa} - k_{Ob}\\\\
\so_2 = k_{Sb} - k_{Oc}\\\\
\end{aligned}
\tag{19}
$$

$$
\begin{aligned}
\so_t = \so_1 + \so_2 =  (k_{Sa} + k_{Sb}) - (k_{Ob} + k_{Oc})\\\\
\end{aligned}
\tag{20}
$$

In standard Mimblewimble [cut-through] can be applied to get:

$$
C_a \Rightarrow  C_c
$$

After cut-through the total script offset becomes: 

$$
\begin{aligned}
\so'\_t = k\_{Sa} - k\_{Oc}\\\\
\end{aligned}
\tag{21}
$$

As we can see:

$$
\begin{aligned}
\so\_t\ \neq \so'\_t \\\\
\end{aligned}
\tag{22}
$$

A third party cannot generate a new script offset as only the original owner can provide the script private key \\(k\_{Sa}\\) 
to create a new script offset. 

### Script offset security

If all the inputs in a transaction or a block contain scripts such as just `NOP` or `CompareHeight` commands, then the 
hypothesis is that it is possible to recreate a false script offset. Lets show by example why this is not possible. In 
this Example we have Alice who pays Bob with no change output:

$$
C_a \Rightarrow  C_b
$$

Alice has an output \\(C\_{a}\\) which contains a script that only has a `NOP` command in it. This means that the 
script \\( \script\_a \\) will immediately exit on execution leaving the entire input data \\( \input\_a \\)on the 
stack. She sends all the required information to Bob as per the [standard mw transaction](#standard-mw-transaction), who 
creates an output \\(C\_{b}\\). Because of the `NOP` script \\( \script\_a \\), Bob can change the script public key 
\\( K\_{Sa}\\) contained in the input data. Bob can now use his own \\(k'\_{Sa}\\) as the script private key. He 
replaces the sender offset public key with his own \\(K'\_{Ob}\\) allowing him to change the script 
\\( \script\_b \\) and generate a new signature as in (9). Bob can now generate a new script offset with 
\\(\so' = k'\_{Sa} - k'\_{Ob} \\). Up to this point, it all seems valid. No one can detect that Bob changed the script 
to \\( \script\_b \\).

But what Bob also needs to do is generate the signature in (13). For this signature Bob needs to know 
\\(k\_{Sa}, k\_a, v\_a\\). Because Bob created a fake script private key, and there is no change in this transaction, 
he does know the script private key and the value. But Bob does not know the blinding factor \\(k\_a\\) of Alice's 
commitment and thus cannot complete the signature in (13). Only the rightful owner of the commitment, which in 
Mimblewimble terms is the  person who knows \\( k\_a, v\_a\\), can generate the signature in (13).


### Script lock key generation

At face value, it looks like the burden for wallets has tripled, since each UTXO owner has to remember three private 
keys, the spend key, \\( k_i \\), the sender offset key \\( k_{O} \\) and the script key \\( k_{S} \\). In practice, the 
script key will often be a static key associated with the user's node or wallet. Even if it is not, the script and 
sender offset keys can be deterministically derived from the spend key. For example, \\( k_{S} \\) could be 
\\( \hash{ k_i \cat \alpha} \\).

### Blockchain bloat

The most obvious drawback to TariScript is the effect it will have on blockchain size. UTXOs are substantially larger,
with the addition of the script, script signature, and a public key to every output.

These can eventually be pruned, but will increase storage and bandwidth requirements.

Input size of a block will now be much bigger as each input was previously just a commitment and output features.
Each input now includes a script, input_data, the script signature and an extra public key. This could be compacted by
just broadcasting input hashes along with the missing script input data and signature, instead of the full input in
transaction messages, but this will still be larger than inputs are currently.

Every header will also be bigger as it includes an extra blinding factor that will not be pruned away.

### Fodder for chain analysis

Another potential drawback of TariScript is the additional information that is handed to entities wishing to perform 
chain analysis. Having scripts attached to outputs will often clearly mark the purpose of that UTXO. Users may wish to 
re-spend outputs into vanilla, default UTXOs in a mixing transaction to disassociate Tari funds from a particular 
script.

## Notation


Where possible, the "usual" notation is used to denote terms commonly found in cryptocurrency literature. Lower case 
characters are used as private keys, while uppercase characters are used as public keys. New terms introduced by 
TariScript are assigned greek lowercase letters in most cases. 

| Symbol                    | Definition                                                                                                                                                                                                                             |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| \\( \script_i \\)         | An output script for output _i_, serialised to binary.                                                                                                                                                                                 |
| \\( F_i \\)               | Output features for UTXO _i_.                                                                                                                                                                                                          |
| \\( f_t \\)               | Transaction fee for transaction _t_.                                                                                                                                                                                                   |
| \\( (k_{Oi}\, K_{Oi}) \\) | The private - public keypair for the UTXO sender offset key. Note that \\( k_{Oi} \\) should be treated as a nonce.                                                                                                                    |
| \\( (k_{Si}\, K_{Si}) \\) | The private - public keypair for the script key. The script, \\( \script_i \\) resolves to \\( K_S \\) after completing execution.                                                                                                     |
| \\( \so_t \\)             | The script offset for transaction _t_, see (15)                                                                                                                                                                                        |
| \\( C_i \\)               | A Pedersen commitment to a value \\( v_i \\), see (4)                                                                                                                                                                                 |
| \\( \input_i \\)          | The serialised input for script \\( \script_i \\)                                                                                                                                                                                      |
| \\( s_{Si} \\)            | A script signature for output \\( i \\), see (11 - 13). Additional the capital letter subscripts, _C_ and _P_ refer to the _ephemeral commitment_ and _ephemeral public key_ portions respectively (exmple \\( s_{SCi}, s_{SPi} \\)) . |
| \\( s_{Mi} \\)            | A metadata signature for output \\( i \\), see (3 - 10). Additional the capital letter subscripts, _R_ and _S_ refer to a UTXO _receiver_ and _sender_ respectively (exmple \\( s_{MRi}, s_{MSi} \\)) .                                |

## Extensions

### Lock-time malleability

The current Tari protocol has an issue with Transaction Output Maturity malleability. This output feature is enforced in
the consensus rules, but it is actually possible for a miner to change the value without invalidating the transaction.

With TariScript, output features are properly committed to in the transaction and verified as part of the script offset
validation.

### Credits

- [@CjS77](https://github.com/CjS77)
- [@hansieodendaal](https://github.com/hansieodendaal)
- [@philipr-za](https://github.com/philipr-za) 
- [@SWvheerden](https://github.com/SWvheerden)

Thanks to David Burkett for proposing a method to prevent cut-through and willingness to discuss ideas.

# Change Log

| Date        | Change                                                 | Author                        |
|:------------|:-------------------------------------------------------|:------------------------------|
| 17 Aug 2020 | First draft                                            | CjS77                         |
| 11 Feb 2021 | Major update                                           | CjS77, SWvheerden, philipr-za |
| 26 Apr 2021 | Clarify one sided payment rules                        | SWvheerden                    |
| 31 May 2021 | Including full script in transaction outputs           | philipr-za                    |
| 04 Jun 2021 | Remove beta range-proof calculation                    | SWvheerden                    |
| 22 Jun 2021 | Change script_signature type to ComSig                 | hansieodendaal                |
| 30 Jun 2021 | Clarify Tari Script nomenclature                       | hansieodendaal                |
| 06 Oct 2022 | Minor improvemnts in legibility                        | stringhandler                 |
| 11 Nov 2022 | Update ComAndPubSig and move out examples              | stringhandler                 |
| 22 Nov 2022 | Added `metadata_signature` and `script_signature` math | hansieodendaal                |

[data commitments]: https://phyro.github.io/grinvestigation/data_commitments.html
[LIP-004]: https://github.com/DavidBurkett/lips/blob/master/lip-0004.mediawiki
[Scriptless script]: https://tlu.tarilabs.com/cryptography/scriptless-scripts/introduction-to-scriptless-scripts.html
[cut-through]: https://tlu.tarilabs.com/protocols/grin-protocol-overview/MainReport.html#cut-through
[standard Mimblewimble protocol]: https://tlu.tarilabs.com/protocols/mimblewimble-1/MainReport.html
[bitcoin transaction]: https://en.bitcoin.it/wiki/Transaction

[TariScript]: Glossary.md#tariscript
[metadata signature]: Glossary.md#metadata-signature
[script signature]: Glossary.md#script-signature
[Signature on Commitment values]: https://documents.uow.edu.au/~wsusilo/ZCMS_IJNS08.pdf
[Commitment Signature]: https://eprint.iacr.org/2020/061.pdf
[CAPK Signature]: Glossary.md#commitment-and-public-key-signature
[script private key]: Glossary.md#script-keypair
[script public key]: Glossary.md#script-keypair
[sender offset]: Glossary.md#sender-offset-keypair
[script offset]: Glossary.md#script-offset
[m-of-n script]: RFC-0202_TariScriptOpcodes.md#checkmultisigverifyaggregatepubkeym-n-public-keys-msg
[NoOp script]: RFC-0202_TariScriptOpcodes.md#noop
[Mimblewimble]: Glossary.md#mimblewimble
