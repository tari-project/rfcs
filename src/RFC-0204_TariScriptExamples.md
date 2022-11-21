# RFC-0204/TariScriptExamples

## TariScript Examples

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77)

<!-- TOC -->
  * [TariScript Examples](#tariscript-examples)
    * [Standard MW transaction](#standard-mw-transaction)
      * [Transaction validation](#transaction-validation)
    * [One sided payment](#one-sided-payment)
    * [HTLC-like script](#htlc-like-script)
    * [Multi-party considerations](#multi-party-considerations)
      * [Multi-party transaction output](#multi-party-transaction-output)
      * [Multi-party transaction input](#multi-party-transaction-input)
      * [Multi-party script offset](#multi-party-script-offset)
<!-- TOC -->

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

## TariScript Examples

### Standard MW transaction

For this use case we have Alice who sends Bob some Tari.
Bob's wallet is  online and is able to countersign the transaction.

Alice creates a new transaction spending \\( C\_a \\) to a new output containing the commitment \\( C\_b \\) (ignoring 
fees for now).

To spend \\( C\_a \\), she provides:

- An input that contains \\( C\_a \\).
- The script input, \\( \input_a \\).
- A valid script signature, \\( s\_{Si} \\) as per (13),(14) proving that she owns the commitment 
  \\( C\_a \\), knows the private key, \\( k_{Sa} \\), corresponding to \\( K_{Sa} \\), the public key left on the stack 
  after executing \\( \script_a \\) with \\( \input_a \\).
- A sender offset public key, \\( K_{Ob} \\).
- The sender portion of the public nonce, \\( R_{MSi} )\\, as per (10).  
- The script offset, \\( \so\\) with:
$$
\begin{aligned}
\so  = k_{Sa} - k_{Ob}
\end{aligned}
\tag{20}
$$

Alice sends the usual first round data to Bob, but now because of TariScript also includes \\( K_{Ob} \\) and 
\\( R_{MSi} \\). Bob can then complete his side of the transaction as per the [standard Mimblewimble protocol] 
providing the commitment \\(C\_b\\), its public blinding factor, its rangeproof and the partial transaction signature.
In addition, Bob also needs to provide a partial metadata signature as per (5) where he commits to all the transaction 
output metadata with a commitment signature. Because Alice is creating the transaction, she can suggest the script 
\\( \script_b \\) to use for Bob's output, similar to a [bitcoin transaction], but Bob can choose a different script 
\\(\script\_b\\). However, in most cases the parties will agree on using something akin to a `NOP` script 
\\(\script\_b\\). Bob has to return this consistent set of information back to Alice.     

Alice verifies the information received back from Bob, check if she agrees with the script \\( \script_b \\) Bob signed, 
and calculates her portion of the [metadata signature] \\( s\_{Mb} \\) with: 

$$
\begin{aligned}
s_{Mb} = r_{mb} + k_{Ob} \hash{ \script_b \cat F_b \cat R_{Mb} }
\end{aligned}
\tag{21}
$$

Alice then constructs the final aggregated metadata signature \\(s_{Mb}\\) as per (12) and replaces Bob's partial 
metadata signature in Bob's TransactionOutput.

She completes the transaction as per [standard Mimblewimble protocol] and also adds the script offset \\( \so \\), after 
which she sends the final transaction to Bob and broadcasts it to the network.

#### Transaction validation

Base nodes validate the transaction as follows:

- They check that the usual Mimblewimble balance holds by summing inputs and outputs and validating against the excess
  signature. This check does not change nor do the other validation rules, such as confirming that all inputs are in
  the UTXO set etc.
- The metadata signature \\(s_{Ma}\\) on Bob's output,
- The input script must execute successfully using the provided input data; and the script result must be a valid 
  public key,
- The script signature on Alice's input is valid by checking:

$$
\begin{aligned}
a_{Sa} \cdot H + b_{Sa} \cdot G = R_{Sa} + (C_a + K_{Sa})* \hash{ R_{Sa} \cat \alpha_a \cat \input_a \cat K_{Sa} \cat C_a}
\end{aligned}
\tag{22}
$$
  
- The script offset is verified by checking that the balance holds:
  
$$
\begin{aligned}
\so \cdot{G} = K_{Sa} - K_{Ob}
\end{aligned}
\tag{23}
$$

Finally, when Bob spends this output, he will use \\( K\_{Sb} \\) as his script input and sign it with his script 
private key \\( k\_{Sb} \\). He will choose a new sender offset public key \\( K\_{Oc} \\) to give to the recipient, and 
he will construct the script offset, \\( \so_b \\) as follows:

$$
\begin{aligned}
\so_b = k_{Sb} - k_{Oc}
\end{aligned}
\tag{24}
$$

### One sided payment

In this example, Alice pays Bob, who is not available to countersign the transaction, so Alice initiates a one-sided 
payment,

$$
C_a \Rightarrow  C_b
$$

Once again, transaction fees are ignored to simplify the illustration.

Alice owns \\( C_a \\) and provides the required script to spend the UTXO as was described in the previous cases.

Alice needs a public key from Bob, \\( K_{Sb} \\) to complete the one-sided transaction. This key can be obtained
out-of-band, and might typically be Bob's wallet public key on the Tari network.

Bob requires the value \\( v_b \\) and blinding factor \\( k_b \\) to claim his payment, but he needs to be able to 
claim it without asking Alice for them.

This information can be obtained by using Diffie-Hellman and Bulletproof rewinding. If the blinding factor \\( k\_b \\) 
was calculated with Diffie-Hellman using the sender offset keypair, (\\( k\_{Ob} \\),\\( K\_{Ob} \\)) as the sender 
keypair and the script keypair, \\( (k\_{Sb} \\),\\( K\_{Sb}) \\) as the receiver keypair, the blinding factor 
\\( k\_b \\) can be securely calculated without communication.

Alice uses Bob's public key to create a shared secret, \\( k\_b \\) for the output commitment, \\( C\_b \\), using
Diffie-Hellman key exchange.

Alice calculates \\( k_b \\) as

$$
\begin{aligned}
k_b = k_{Ob} * K_{Sb}
\end{aligned}
\tag{25}
$$

Next Alice uses Bulletproof rewinding, see [RFC 180](RFC-0180_BulletproofRewinding.md), to encrypt the value 
\\( v_b \\) into the the Bulletproof for the commitment \\( C_b \\). For this she uses 
\\( k_{rewind} =  \hash{k_{b}} \\) as the rewind_key and \\( k_{blinding} =  \hash{\hash{k_{b}}} \\) as the blinding 
key.

Alice knows the script-redeeming private key \\( k_{Sa}\\) for the transaction input.

Alice will create the entire transaction, including generating a new sender offset keypair and calculating the 
script offset,

$$
\begin{aligned}
\so = k_{Sa} - k_{Ob}
\end{aligned}
\tag{26}
$$

She also provides a script that locks the output to Bob's public key, `PushPubkey(K_Sb)`.
This will only be spendable if the spender can provide a valid signature as input that demonstrates proof
of knowledge of \\( k_{Sb}\\) as well as the value and blinding factor of the output \\(C_b\\). Although Alice knowns 
the value and blinding factor of the output \\(C_b\\) only Bob knows \\( k_{Sb}\\).

Any base node can now verify that the transaction is complete, verify the signature on the script, and verify the 
script offset.

For Bob to claim his commitment he will scan the blockchain for a known script because he knowns that the script will 
be `PushPubkey(K_Sb)`. In this case, the script is analogous to an address in Bitcoin or Monero. Bob's wallet can scan 
the blockchain looking for scripts that he would know how to resolve.

When Bob's wallet spots a known script, he requires the blinding factor, \\( k_b \\) and the value \\( v_b \\). First he 
uses Diffie-Hellman to calculate \\( k_b \\). 

Bob calculates \\( k_b \\) as

$$
\begin{aligned}
 k_b = K_{Ob} * k_{Sb}
\end{aligned}
\tag{27}
$$

Next Bob's wallet calculates \\( k_{rewind} \\), using \\( k_{rewind} = \hash{k_{b}}\\) and 
(\\( k_{blinding} = \hash{\hash{k_{b}}} \\), using those to rewind the Bulletproof to get the value \\( v_b \\). 

Because Bob's wallet already knowns the script private key \\( k_{Sb} \\), he now knows all the values required to 
spend the commitment \\( C_b \\)

For Bob's part, when he discovers one-sided payments to himself, he should spend them to new outputs using a traditional
transaction to thwart any potential horizon attacks in the future.

To summarise, the information required for one-sided transactions are as follows:

| Transaction input        | Symbols                               | Knowledge                                                                                      |
|--------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| commitment               | \\( C_a = k_a \cdot G + v \cdot H \\) | Alice knows the blinding factor and value.                                                     |
| features                 | \\( F_a \\)                           | Public                                                                                         |
| script                   | \\( \alpha_a \\)                      | Public                                                                                         |
| script input             | \\( \input_a \\)                      | Public                                                                                         |
| script signature         | \\( s\_{Sa} \\)                       | Alice knows \\( k_{Sa},\\, r_{Sa} \\) and \\( k_{a},\\, v_{a} \\) of the commitment \\(C_a\\). |
| sender offset public key | \\( K_{Oa} \\)                        | Not used in this transaction.                                                                  |


| Transaction output       | Symbols                               | Knowledge                                                           |
|--------------------------|---------------------------------------|---------------------------------------------------------------------|
| commitment               | \\( C_b = k_b \cdot G + v \cdot H \\) | Alice and Bob know the blinding factor and value.                   |
| features                 | \\( F_b \\)                           | Public                                                              |
| script                   | \\( \script_b \\)                     | Script is public; only Bob knows the correct script input.          |
| range proof              |                                       | Alice and Bob know opening parameters.                              |
| sender offset public key | \\( K_{Ob} \\)                        | Alice knows \\( k_{Ob} \\).                                         |
| metadata signature       | \\( s\_{Mb} \\)                       | Alice knows \\( k_{Ob} \\), \\( (k_{b},\\, v) \\) and the metadata. |


### HTLC-like script

In this use case we have a script that controls where it can be spent. The script is out of scope for this example, but
has the following rules:

- Alice can spend the UTXO unilaterally after block _n_, **or**
- Alice and Bob can spend it together.

This would be typically what a lightning-type channel requires.

Alice owns the commitment \\( C_a \\). She and Bob work together to create \\( C_s\\). But we don't yet know who can 
spend the newly created \\( C_s\\) and under what conditions this will be.

$$
C_a \Rightarrow  C_s \Rightarrow  C_x
$$

Alice owns \\( C_a\\), so she knows the blinding factor \\( k_a\\) and the correct input for the script's spending 
conditions. Alice also generates the sender offset keypair, \\( (k_{Os}, K_{Os} )\\).

Now Alice and Bob proceed with the standard transaction flow.

Alice ensures that the sender offset public key \\( K_{Os}\\) is part of the output metadata that contains commitment 
\\( C_s\\). Alice will fill in the script with her \\( k_{Sa}\\) to unlock the commitment \\( C_a\\). Because Alice 
owns \\( C_a\\) she needs to construct \\( \so\\) with:

$$
\begin{aligned}
\so = k_{Sa} - k_{Os}
\end{aligned}
\tag{28}
$$

The blinding factor, \\( k_s\\) can be generated using a Diffie-Hellman construction. The commitment \\( C_s\\) needs to 
be constructed with the script that Bob agrees on. Until it is mined, Alice could modify the script via double-spend and 
thus Bob must wait until the transaction is confirmed before accepting the conditions of the smart contract between 
Alice and himself.

Once the UTXO is mined, both Alice and Bob possess all the knowledge required to spend the \\( C_s \\) UTXO. It's only
the conditions of the script that will discriminate between the two.

The spending case of either Alice or Bob claiming the commitment \\( C_s\\) follows the same flow described in the 
previous examples, with the sender proving knowledge of \\( k_{Ss}\\) and "unlocking" the spending script.

The case of Alice and Bob spending \\( C_s \\) together to a new multiparty commitment requires some elaboration.

Assume that Alice and Bob want to spend  \\( C_s \\) co-operatively. This involves the script being executed in such a 
way that the resulting public key on the stack is the sum of Alice and Bob's individual script keys, \\( k_{SsA} \\) and 
\\( k_{SaB} \\).

The script input needs to be signed by this aggregate key, and so Alice and Bob must each supply a partial signature 
following the usual Schnorr aggregate mechanics, but one person needs to add in the signature of the blinding factor and 
value.

In an analogous fashion, Alice and Bob also generate an aggregate sender offset private key \\( k_{Ox}\\), each using
their own \\( k_{OxA} \\) and \\( k_{OxB}\\).

To be specific, Alice calculates her portion from

$$
\begin{aligned}
\so_A = k_{SsA} - k_{OxA}
\end{aligned}
\tag{29}
$$

Bob will construct his part of the \\( \so\\) with:

$$
\begin{aligned}
\so_B = k_{SsB} - k_{OxB}
\end{aligned}
\tag{30}
$$

And the aggregate \\( \so\\) is then:

$$
\begin{aligned}
\so = \so_A + \so_B
\end{aligned}
\tag{31}
$$

Notice that in this case, both \\( K_{Ss} \\) and \\( K_{Ox}\\) are aggregate keys.

Notice also that because the script resolves to an aggregate key \\( K_s\\) neither Alice nor Bob can claim the 
commitment \\( C_s\\) without the other party's key. If either party tries to cheat by editing the input, the script 
validation will fail.

If either party tries to cheat by creating a new output, the script offset will not validate correctly as it locks 
the output of the transaction.

A base node validating the transaction will also not be able to tell this is an aggregate transaction as all keys are 
aggregated Schnorr signatures. But it will be able to validate that the script input is correctly signed, thus the 
output public key is correct and that the \\( \so\\) is correctly calculated, meaning that the commitment \\( C_x\\) is 
the correct UTXO for the transaction.

To summarise, the information required for creating a multiparty UTXO is as follows:

| Transaction input                  | Symbols                               | Knowledge                                                                                      |
|------------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| commitment                         | \\( C_a = k_a \cdot G + v \cdot H \\) | Alice knows the blinding factor and value.                                                     |
| features                           | \\( F_a \\)                           | Public                                                                                         |
| script                             | \\( \alpha_a \\)                      | Public                                                                                         |
| script input                       | \\( \input_a \\)                      | Public                                                                                         |
| script signature                   | \\( s\_{Sa} \\)                       | Alice knows \\( k_{Sa},\\, r_{Sa} \\) and \\( k_{a},\\, v_{a} \\) of the commitment \\(C_a\\). |
| sender offset&nbsp;public&nbsp;key | \\( K_{Oa} \\)                        | Not used in this transaction.                                                                  |

<br>

| Transaction output                 | Symbols                               | Knowledge                                                                                                                           |
|------------------------------------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| commitment                         | \\( C_s = k_s \cdot G + v \cdot H \\) | Alice and Bob know the blinding factor and value.                                                                                   |
| features                           | \\( F_s \\)                           | Public                                                                                                                              |
| script                             | \\( \script_s \\)                     | Script is public; Alice and Bob only knows their part of the  correct script input.                                                 |
| range proof                        |                                       | Alice and Bob know opening parameters.                                                                                              |
| sender offset&nbsp;public&nbsp;key | \\( K_{Os} = K_{OsA} + K_{OsB}\\)     | Alice knows \\( k_{OsA} \\), Bob knows \\( k_{OsB} \\), neither party knows \\( k_{Os} \\).                                         |
| metadata&nbsp;signature            | \\( (a_{Ms} , b_{Ms} , R_{Ms}) \\)    | Alice knows \\( k_{OsA} \\), Bob knows \\( k_{OsB} \\), both parties know \\( (k_{s},\\, v) \\). Neither party knows \\( k_{Os}\\). |

When spending the multi-party input:

| Transaction input                  | Symbols                                 | Knowledge                                                                                                                                                           |
|------------------------------------|-----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| commitment                         | \\( C_s = k_s \cdot G + v_s \cdot H \\) | Alice and Bob know the blinding factor and value.                                                                                                                   |
| features                           | \\( F_s \\)                             | Public                                                                                                                                                              |
| script                             | \\( \alpha_s \\)                        | Public                                                                                                                                                              |
| script input                       | \\( \input_s \\)                        | Public                                                                                                                                                              |
| script&nbsp;signature              | \\( (a_{Ss} ,b_{Ss} , R_{Ss}) \\)       | Alice knows \\( (k_{SsA},\\, r_{SsA}) \\), Bob knows \\( (k_{SsB},\\, r_{SsB}) \\), both parties know \\( (k_{s},\\, v_{s}) \\), neither party knows \\( k_{Ss}\\). |
| sender offset&nbsp;public&nbsp;key | \\( K_{Os} \\)                          | As above, Alice and Bob each know part of the sender offset key.                                                                                                    |


### Multi-party considerations

Multi-party in this context refers to `n-of-n` parties creating a single combined transaction output and `m-of-n` 
parties spending a single combined transaction input. We have some options to do this:
- using the [m-of-n script] TariScript without sharding the spending key;
- combination of the [m-of-n script] TariScript and sharding the spending key;
- sharding the spending key combined with the [NoOp script] TariScript;

If the spending key \\( k_i \\) is sharded for any of these options the commitment definition changes to:

$$
\begin{aligned}
C_i = v_i \cdot H  + \sum_\psi (k_{i\_\psi} \cdot G) \\; \\; \\; \text{ for each receiver party } \psi
\end{aligned}
\tag{1b}
$$

The sender-receiver interaction can be categorized as follows, however, for simplicity we can assume that each
multi-party side will have a single party acting as the dealer:
- Multi-party senders can create the single output and send it to a single receiver.
- A single sender can create the single output and send it to multi-party receivers.
- Multi-party senders can create the single output and send it to multi-party receivers.

The multi-party impact on the transaction output, transaction input and script offset is discussed below.

#### Multi-party transaction output

If multiple senders and receiver parties need to create an aggregate `metadata_signature` for a single multi-party
transaction output, there are two secrets that warrant our attention; the script offset private key \\( k\_{Oi} \\)
controlled by the senders and the spending key \\( k_i \\) controlled by the receivers. Depending on the protocol
design, one or both secrets may be sharded amongst all parties. 

<u>Sharding the script offset private key:</u>

If the script offset private key \\( k\_{Oi} \\) is sharded, the aggregate sender terms in (10) and (11) collected by 
the sender's dealer change to:

$$
\begin{aligned}
R_{MSi} &= \sum_\omega (r_{{MSi_b}\_\omega} \cdot G) \\; \\; \\; \text{ for each sender party } \omega
\end{aligned}
\tag{10b}
$$

$$
\begin{aligned}
a_{MSi} &= 0 \\\\
b_{MSi} &= \sum_\omega (r_{{MSi_b}\_\omega} + e \cdot k\_{{Oi}_\omega}) \\; \\; \\; \text{ for each sender party } \omega
\end{aligned}
\tag{11b}
$$

<u>Sharding the spending key:</u>

If the spending key \\( k_i \\) is sharded, the receiver's dealer needs to collect shards and combine them. The
aggregate receiver terms in (3) and (5) collected by the receiver's dealer change to:

$$
\begin{aligned}
R_{MRi} &= r_{MRi_a} \cdot H + \sum_\psi ( r_{{MRi_b}\_\psi} \cdot G ) \\; \\; \\; \text{ for each receiver party } \psi
\end{aligned}
\tag{3b}
$$

$$
\begin{aligned}
a_{MRi} &= r_{MRi_a} + e(v_{i}) \\\\
b_{MRi} &= \sum_\psi ( r_{{MRi_b}\_\psi} + e \cdot k_{i\_\psi} ) \\; \\; \\; \text{ for each receiver party } \psi
\end{aligned}
\tag{5b}
$$

#### Multi-party transaction input

If multiple senders need to create an aggregate `script_signature` for a multi-party transaction input, again, there are
two secrets that warrant our attention, the script private key \\( k_{Si} \\) and the spending key \\( k_i \\).
Depending on the protocol design, one or both secrets may be sharded amongst all parties, with some limitations:
- Sharding the script private key will always be applicable for an [m-of-n script] TariScript.
- Sharding the script private key will never be applicable for a [NoOp script] TariScript.

<u>Sharding only the script private key:</u>

If only the script private key \\( k_{Si} \\) will be sharded the aggregate terms in (14) collected by the sender's 
dealer change to:

$$
\begin{aligned}
R_{Si} &= r_{Si_a} \cdot H + \sum_\omega ( r_{{Si_b}\_\omega} \cdot G ) \\; \\; \\; \text{ for each sender party } \omega \\\\
a_{Si}  &= r_{Si_a} +  e(v_{i}) \\\\
b_{Si} &= \sum_\omega ( r_{{Si_b}\_\omega} + e \cdot k_{{Si}\_\omega} ) + e \cdot  k_i \\; \\; \\; \text{ for each sender party } \omega \\\\
e &= \hash{ R_{Si} \cat \alpha_i \cat \input_i \cat K_{Si} \cat C_i} \\\\
\end{aligned}
\tag{14b}
$$

<u>Sharding the script private key and the spending key:</u>

If both the script private key \\( k_{Si} \\) and the spending key \\( k_i \\) will be sharded the aggregate terms
in (14) collected by the sender's dealer change to:

$$
\begin{aligned}
R_{Si} &= r_{Si_a} \cdot H + \sum_\omega ( r_{{Si_b}\_\omega} \cdot G ) \\; \\; \\; \text{ for each sender party } \omega \\\\
a_{Si}  &= r_{Si_a} +  e(v_{i}) \\\\
b_{Si} &= \sum_\omega ( r_{{Si_b}\_\omega} + e \cdot (k_{{Si}\_\omega} +  k_{i\_\omega}) ) \\; \\; \\; \text{ for each sender party } \omega \\\\
e &= \hash{ R_{Si} \cat \alpha_i \cat \input_i \cat K_{Si} \cat C_i} \\\\
\end{aligned}
\tag{14c}
$$

It is worth noting that `m-of-n` treatment of the script private key \\( k_{Si} \\) and the spending key \\( k_i \\)
differs slightly. Only `m` of the original `n` parties need to create the script input, and the script will resolve to
the correct \\( K_{Si} \\), but all `n` parties need to be present to recreate the original \\( k_i \\). This can be
done with Pedersen Verifiable Secret Sharing (PVSS), similar to
[**this example**](https://tlu.tarilabs.com/protocols/mimblewimble-mb-bp-utxo#mimblewimble--mtext-of-n--multiparty-bulletproof-utxo).
The dealer will reconstruct the \\( k_{i\_j} \\) shards of the missing parties and add them to their shard before
combining.

<u>Sharding only the spending key:</u>

If only the spending key \\( k_i \\) will be sharded the aggregate terms in (14) collected by the sender's dealer 
change to:

$$
\begin{aligned}
R_{Si} &= r_{Si_a} \cdot H + \sum_\omega ( r_{{Si_b}\_\omega} \cdot G ) \\; \\; \\; \text{ for each sender party } \omega \\\\
a_{Si}  &= r_{Si_a} +  e(v_{i}) \\\\
b_{Si} &= \sum_\omega ( r_{{Si_b}\_\omega} + e \cdot  k_{i\_\omega} ) + e \cdot k_{Si} \\; \\; \\; \text{ for each sender party } \omega \\\\
e &= \hash{ R_{Si} \cat \alpha_i \cat \input_i \cat K_{Si} \cat C_i} \\\\
\end{aligned}
\tag{14d}
$$


#### Multi-party script offset

For multiple senders, aggregate terms are collected by the sender's dealer and (16) changes according to which of the
secrets have been sharded:

<u>Sharding only the script private key:</u>

$$
\begin{aligned}
\so = \sum_\omega \left( \sum_j\mathrm{k_{Sj}} \right) \_\omega - \sum_i\mathrm{k_{Oi}} \\; \\; \text{for each input}, j,\\, \text{and each output}, i \\; \text{ for each sender party } \omega
\end{aligned}
\tag{16b}
$$

<u>Sharding only the script offset private key:</u>

$$
\begin{aligned}
\so = \sum_j\mathrm{k_{Sj}} - \sum_\omega \left( \sum_i\mathrm{k_{Oi}} \right) \_\omega \\; \\; \text{for each input}, j,\\, \text{and each output}, i \\; \text{ for each sender party } \omega
\end{aligned}
\tag{16c}
$$

<u>Sharding the script private key and the script offset private key:</u>

$$
\begin{aligned}
\so = \sum_\omega \left( \sum_j\mathrm{k_{Sj}} - \sum_i\mathrm{k_{Oi}} \right) \_\omega \\; \\; \text{for each input}, j,\\, \text{and each output}, i \\; \text{ for each sender party } \omega
\end{aligned}
\tag{16d}
$$


| Date        | Change               | Author                        |
|:------------|:---------------------|:------------------------------|
| 11 Nov 2022 | Move out of RFC 0201 | stringhandler |


[TariScript]: Glossary.md#tariscript
[metadata signature]: Glossary.md#metadata-signature
[script private key]: Glossary.md#script-keypair
[script public key]: Glossary.md#script-keypair
[sender offset]: Glossary.md#sender-offset-keypair
[script offset]: Glossary.md#script-offset
[m-of-n script]: RFC-0202_TariScriptOpcodes.md#checkmultisigverifyaggregatepubkeym-n-public-keys-msg
[NoOp script]: RFC-0202_TariScriptOpcodes.md#noop
[Mimblewimble]: Glossary.md?#mimblewimble
