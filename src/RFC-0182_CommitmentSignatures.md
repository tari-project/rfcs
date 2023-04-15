# RFC-0182/CommitmentSignatures

## Commitment and public key signatures

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Aaron Feickert](https://github.com/AaronFeickert)

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

This Request for Comment (RFC) describes signatures relating to commitments and public keys that are useful for Tari transaction authorization.

## Related Requests for Comment

* [RFC-0120: TariScript](./RFC-0120_TariScript.md)

## Introduction

A commitment and public key signature ([CAPK signature]) is used in Tari protocols as part of transaction authorization.
Given a commitment $C = aH + xG$ and public key $P = yG$, a CAPK signature asserts knowledge of the openings $(a,x)$ and $y$ in zero knowledge.
Optionally, the value $a$ may be disclosed as part of the signature.

Structurally, a CAPK signature is a conjunction of Schnorr-type representation proofs for $C$ and $P$.
While it is defined as an interactive protocol, the (strong) Fiat-Shamir technique is used to make it non-interactive and bind arbitrary message data, effectively transforming the proof into a signature.

## Value-hiding protocol

We first describe the version of the protocol that does not reveal the commitment value.
The interactive form of this protocol proceeds as follows:
- The prover samples scalar nonces $r_a, r_x, r_y$ uniformly at random.
- The prover computes ephemeral values $C_{eph} = r_a H + r_x G$ and $P_{eph} = r_y G$, and sends these values to the verifier.
- The verifier samples a nonzero scalar challenge $e$ uniformly at random, and sends it to the prover.
- The prover computes $u_a = r_a + ea$ and $u_x = r_x + ex$ and $u_y = r_y + ey$, and sends these values to the verifier.
- The verifier accepts the proof if and only if $u_a H + u_x G = C_{eph} + eC$ and $u_y G = P_{eph} + eP$.

The strong Fiat-Shamir technique can transform this into a non-interactive protocol.
To do so, the prover and verifier both use a domain-separated cryptographic hash function to compute the challenge $e$, carefully binding $C$, $P$, $C_{eph}$, $P_{eph}$, and any arbitrary message data.
In this non-interactive format, the public statement data is the tuple $(C, P)$ and the proof data is the tuple $(C_{eph}, P_{eph}, u_a, u_x, u_y)$.

Verification can be made more efficient by reducing to a single linear combination evaluation.
To do this, the verifier samples a nonzero scalar weight $w$ uniformly at random (not using Fiat-Shamir!) and accepts the proof if and only if the following holds:
\\[
u_a H + (u_x + wu_y)G - C_{eph} - wP_{eph} - eC - weP = 0
\\]

### Security proof

We require that the (interactive) protocol be correct, special sound, and special honest-verifier zero knowledge.
While the proof technique is standard, we present it here for completeness.

Correctness follows immediately by inspection.

To show the protocol is special sound, consider a rewinding argument with two distinct challenges $e \neq e'$ on the same statement $(C, P)$ and initial transcript $(C_{eph}, P_{eph})$.
We must produce extracted witnesses $a, x, y$ consistent with the statement.
Suppose the responses on these transcripts are $(u_a, u_x, u_y)$ and $(u_a', u_x', u_y')$, respectively.
The first verification equation applied to both transcripts yields $(u_a - u_a')H + (u_x - u_x')G = (e - e')C$, from which we obtain witness extractions
\\[
a = \frac{u_a - u_a'}{e - e'}
\\]
and
\\[
x = \frac{u_x - u_x'}{e - e'}
\\]
such that $C = aH + xG$, as required.
Similarly, the second verification equation yields $(u_y - u_y')G = (e - e')P$, so
\\[
y = \frac{u_y - u_y'}{e - e'}
\\]
is the remaining extracted witness, such that $P = yG$.
This shows the protocol is 2-special sound.

Finally, we show the protocol is special honest-verifier zero knowledge.
This requires us to simulate, for an arbitrary statement and challenge, a transcript distributed identically to that of a real proof.
Fix a statement $(C, P)$ and sample a challenge $e \neq 0$ uniformly at random.
Then, sample $u_a, u_x, u_y$ uniformly at random.
We then set $C_{eph} = u_a H + u_x G - eC$ and $P_{eph} = u_y G - eP$.
The resulting transcript is valid by construction.
Further, all proof elements are uniformly distributed at random in both the simulation and in real proofs.
This shows the protocol is special honest-verifier zero knowledge.

## Value-revealing protocol

We now describe a modified version of the protocol that reveals the commitment value.
While this protocol can be made more efficient than we list here (discussed later), this design is intended to be more closely compatible with the value-hiding protocol for easier implementation.
The interactive form of this protocol proceeds as follows:
- The prover samples scalar nonces $r_x, r_y$ uniformly at random.
- The prover computes ephemeral values $C_{eph} = r_x G$ and $P_{eph} = r_y G$, and sends these values to the verifier.
- The verifier samples a nonzero scalar challenge $e$ uniformly at random, and sends it to the prover.
- The prover computes $u_a = ea$ and $u_x = r_x + ex$ and $u_y = r_y + ey$, and sends these values to the verifier.
- The verifier accepts the proof if and only if $u_a = ea$ and $u_a H + u_x G = C_{eph} + eC$ and $u_y G = P_{eph} + eP$.

As in the value-hiding protocol, the strong Fiat-Shamir technique can transform this into a non-interactive protocol.
Crucially, in this version of the protocol, the prover and verifier must also bind the value $a$ into the challenge.
That is, they both use a domain-separated cryptographic hash function to compute the challenge $e$, carefully binding $C$, $P$, $a$, $C_{eph}$, $P_{eph}$, and any arbitrary message data.
In this non-interactive format, the public statement data is the tuple $(C, P, a)$ and the proof data is the tuple $(C_{eph}, P_{eph}, u_a, u_x, u_y)$.

The same weighting technique as above may be used to combine the second and third verification equations here.
However, the first verification equation must still be checked.

### Security proof

We require that the (interactive) protocol be correct, special sound, and special honest-verifier zero knowledge.
While the proof technique is standard, we present it here for completeness.

Correctness follows immediately by inspection.

To show the protocol is special sound, consider a rewinding argument with two distinct challenges $e \neq e'$ on the same statement $(C, P, a)$ and initial transcript $(C_{eph}, P_{eph})$.
We must produce extracted witnesses $x, y$ consistent with the statement.
Suppose the responses on these transcripts are $(u_a, u_x, u_y)$ and $(u_a', u_x', u_y')$, respectively.
The first verification equation gives that $u_a = ea$ and $u_a' = e'a$.
The second verification equation applied to both transcripts then yields $(e - e')aH + (u_x - u_x')G = (e - e')C$, from which we obtain witness extraction
\\[
x = \frac{u_x - u_x'}{e - e'}
\\]
such that $C = aH + xG$, as required.
Similarly, the third verification equation yields $(u_y - u_y')G = (e - e')P$, so
\\[
y = \frac{u_y - u_y'}{e - e'}
\\]
is the remaining extracted witness, such that $P = yG$.
This shows the protocol is 2-special sound.

Finally, we show the protocol is special honest-verifier zero knowledge.
This requires us to simulate, for an arbitrary statement and challenge, a transcript distributed identically to that of a real proof.
Fix a statement $(C, P)$ and sample a challenge $e \neq 0$ uniformly at random.
Then, fix $u_a = ea$ and sample $u_x, u_y$ uniformly at random.
We then set $C_{eph} = u_a H + u_x G - eC$ and $P_{eph} = u_y G - eP$.
The resulting transcript is valid by construction.
Further, all proof elements are either fixed by verification or uniformly distributed at random in both the simulation and in real proofs.
This shows the protocol is special honest-verifier zero knowledge.

### Simplification

This protocol may be simplified further.
To do so, the prover does not compute $u_a$ at all, instead sending only $u_x$ and $u_y$ as its post-challenge responses.
To account for this, the verifier accepts the proof if and only if $eaH + u_x G = C_{eph} + eC$ and $u_y G = P_{eph} + eP$.

However, this alters the proof format and verification, which may be undesirable for a more general implementation.


[Signature on Commitment values]: https://documents.uow.edu.au/~wsusilo/ZCMS_IJNS08.pdf
[Commitment Signature]: https://eprint.iacr.org/2020/061.pdf
[CAPK Signature]: Glossary.md#commitment-and-public-key-signature