# RFC-03XX/PreventingReplayOfInstructions

## Preventing Replay Attacks on Instructions

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [stringhandler](https://github.com/stringhandler)

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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals


## Related Requests for Comment

None

## Glossary

* Transaction - A second layer transaction, consisting of a multiple Instructions
* Instructions - A single instruction to execute on the second layer, using inputs and outputs. Common examples are CallFunction, CallMethod

## Description

### Problem

When submitting a transaction to the Tari second layer, it will consist of a number of instructions. It is also signed by the caller, which will be 
used when validating access. For example, a transaction with instructions to withdraw funds from an account would be rejected by the network if the 
transaction signer does not have access to this account, or if the signature is not valid.

These transactions are safe from replay attacks where a malicious actor copies the instructions into their own transactions, using a different signer.

However, there are some cases where there is another signature present in the instruction. For example, claiming funds from another chain or proof of knowledge
other than the transaction's signer.

In this template, an unknowing developer allows creating funds if the signature provided is valid:

```rust 
  fn claim_reward(&self, signature: RistrettoSchnorrSignature) -> Bucket { 
    if signature.verify(/* construct challenge */) {
        return Bucket(1000, self.reward_resource);
    }
    
    panic!("Signature is not valid")
  }
  ```

  On face value this seems fine. When we look at the instructions to call this method, we see the signature provided:

  ```rust
  instructions.extend([
      
        Instruction::CallMethod {
            component_address: component_address,
            method: "claim_reward".to_string(),
            args: args!["<signature>"],
        },
        Instruction::PutLastInstructionOutputOnWorkspace {
            key: b"claim_bucket".to_vec(),
        },
        Instruction::CallMethod {
            component_address: account_address,
            method: "deposit".to_string(),
            args: args![Workspace("claim_bucket")],
        },
    ]);

 ```   

The problem here is that a malicious actor can copy these instructions and replay them, or try snipe the original caller, stealing the reward. Also, if the template 
developer does not have any other protection to prevent it, this method may be called infinitely, generating buckets of resources until the supply is finished.


### Possible Solutions

#### Force the developer to use a specific Signature API
To address this, we can make a signature verification API or challenge generation API that the developer finds easily (or alternatively make it difficult to use a custom signature API).
Doing this means we can add data to the challenge that locks it to this call of the instruction. 

For example we could add a `ReplayNonce : RistrettoPublicKey` field to the transaction that must be non-zero. Every challenge that is generated in a Tari template should then automatically 
include this field.

> NOTE: Using an integer or other data type is not helpful here, because the attacker can simply copy this field. 
> NOTE: You also can't use the transaction hash in this instance, since the caller would never be able to create the challenge before generating the signature.

Finally, the caller must also provide proof of the replay nonce's secret. This can be added as a new field to the transaction.

#### Other approaches?
Open to ideas here



# Change Log

| Date        | Change        | Author |
|:------------|:--------------|:-------|
| 10 Apr 2023  | First draft   | stringhandler  |


