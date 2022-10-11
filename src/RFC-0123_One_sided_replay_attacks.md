
# RFC-0123/ReplayAttacks

## Mitigating One-sided payment replay attacks

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77) and [S W van heerden](https://github.com/SWvheerden)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2021 The Tari Development Community

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

The aim of this Request for Comment (RFC) is to describe ways we can block replay attacks related to one-sided payments using TariScript.

## Related Requests for Comment

* [RFC-0120: Base Layer Consensus](RFC-0120_consensus.md)
* [RFC-0201: TariScript](RFC-0201_TariScript.md)

## Replay attack

Replay attacks are "replaying" old messages to deceive the receiver about the message's authenticity. 
With TariScript, a vulnerability exists where a replay attack can occur under certain conditions, even with the current consensus rules. 

For this attack to work, we need Alice and Charlie to collude to steal some of Bob's funds:

* Alice sends a one-sided transaction to Bob. 
* Bob spends this UTXO to Charlie. 
  * Bob has to spend this and only this UTXO alone to Charlie with **zero change**.
* Alice sends a new one-sided transaction to Bob, creating the exact same output as before
* Alice shares the Blinding factor of the UTXO with Charlie
* Charlie can now claim this UTXO by replaying his old transaction 
  * Charlie has the signatures to spend the scripts, sign for the changes, etc. 
  * Because the previous transaction contains no other inputs, Charlie only has to provide signatures for this one UTXO.
  * Because there is no change UTXO, Charlie has the keys for all the outputs in the transactions and can thus add another transaction or input
     /output to make sure the kernel excess signature is unique.

This does not work if Bob includes another UTXO in the transaction to Charlie due to the [script offset]. Although Charlie has the 
blinding factor, for the one UTXO, he does not have the [script offset]. Charlie can create a new kernel signature unique for blockchain consensus with the blinding factor. Still, because the [script offset] needs to balance as well, and he does not know the private keys for this, he needs
to use this as is, meaning he needs to use an exact copy of the transaction. If the transaction includes any UTXO that he does not know the 
blinding factor of, he cannot create a new kernel excess signature. Meaning it won't pass consensus rules. 

## Solutions

This is a very niche attack that will only be useful under certain circumstances, but never less still needs to be addressed. 

### Sign with chain information

If we require as part of the [script signature] challenge that we sign the mined block height of that UTXO, it will ensure that Charlie cannot replay the signatures that
Bob provided on the Input to spend the output, as each duplicate commitment will have its own block height. This is ensured as we currently have a limit that a commitment
must be unique in the unspent set. 

#### advantages
This method has the following advantages:
* Does not require any more on-chain information

#### disadvantages
This method has the following disadvantages:
* Reorged transactions cannot be put back in if the inputs are now spent at different heights


### Enforce global commitment uniqueness

Alice cannot send the same one-sided UTXO to Bob if we require the commitment to be globally unique. This does mean that pruned nodes needs 
to track the spent TXO set's commitment and the UTXO set.

#### advantages
This method has the following advantages:
* Safely reorg transactions

#### disadvantages
This method has the following disadvantages:
* Pruned node needs to save extra data about the spent set.
* Syncing pruned nodes need to provide extra info to ensure that the downloaded list of commitments is correct
  * Without requiring extra information in the header, pruned nodes need to download the entire TXO set and compare this to the output_mmr root.




[script offset]: Glossary.md#script-offset
[script signature]: RFC-0201_TariScript.md#transaction-input-changes

