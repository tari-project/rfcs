# RFC-0181/BulletproofsPlus

## Bulletproofs+ range proving

![status: stable](theme/images/status-stable.svg)

**Maintainer(s)**: [Aaron Feickert](https://github.com/AaronFeickert)

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

This Request for Comment (RFC) describes Tari-specific implementation details for Bulletproofs+ range proving and verifying.

## Related Requests for Comment

* [RFC-0150: Wallets](./RFC-0150_Wallets.md)
* [RFC-0180: BulletproofRewinding](./RFCD-0180_BulletproofRewinding.md)

## Introduction

The Tari implementation of the [Bulletproofs+](https://eprint.iacr.org/2020/735) range proving system makes several changes and optimizations that we describe here.
In particular, it supports the following useful features:
- Commitments can be _extended_; that is, they can commit to a value using multiple masks.
- Range proofs can be _aggregated_; that is, a single range proof can assert valid range for multiple commitments in an efficient way.
- A set of arbitrary range proofs can be verified in a _batch_; that is, the verifier can check the validity of all proofs in the set at once in an efficient way.
- The prover can assert a nonzero minimum value bound to a commitment.
- The prover can delegate to certain verifiers the ability to recover the masks used for the extended commitment in a non-aggregated proof.

The Bulletproofs+ preprint does not address extended commitments, as it only defines its range proving system using Pedersen commitments.
However, a later preprint for [Zarcanum](https://eprint.iacr.org/2021/1478) updates the algorithms and security proofs to accommodate one additional mask, and the reasoning extends generally.
Aggregation of range assertions using Pedersen commitments is described in the Bulletproofs+ preprint, and the Zarcanum preprint describes the corresponding changes for extended commitments.
Batch verification is described only informally in the Bulletproofs+ preprint, and in an incomplete fashion.
Minimum value assertion is not addressed in the preprint.
An approach to mask and value recovery was [used by Grin](https://github.com/mimblewimble/grin-wallet/issues/105) for the Bulletproofs range proving system, implemented as described by the deprecated [RFC-0180](RFCD-0180_BulletproofRewinding.md), and can be modified to support Bulletproofs+ range proofs with extended commitments.

## Notation

To reduce confusion in our description and more closely match implementation libraries, we use additive notation and uppercase letters for group elements, and otherwise assume notation from the preprints.
Denote the commitment value generator by $G\_c$ and the commitment mask generator vector by $\vec{H}\_c$.
We note that the terms of the vector $\vec{d}$ can be succinctly expressed by noting that for $0 \leq i < n$ and $0 \leq j < m$ we have $d\_{jn+i} = z^{2(j+1)} 2^i$, which can be efficiently defined iteratively.
Because the preprint uses the notation $A$ differently in the weighted inner product and range proving protocols, we rename it to $A'$ in the weighted inner product protocol.

Finally, we note one additional unfortunate notation change that applies to the implementation.
Both the Bulletproofs+ and Zarcanum preprints use $G$ as the commitment value generator, and either $H$ or $\vec{H}\_c$ (in our notation) for masking.
However, in the Tari protocol (as in other similar protocols), this notation is switched!
This is because of how generators are defined and used elsewhere in the protocol and elliptic curve library implementation.
The only resulting change is a switch in generator notation in the Tari implementation: $H$ for the value component generator, and $\vec{G}\_c$ (in our notation) for masking.

## Minimum value assertion
We first briefly note how to achieve minimum value assertion.
Let $0 \leq v\_{\text{min}} \leq v \leq v\_{\text{max}}$, where $v\_{\text{min}}$ is a minimum value specified by the prover, $v$ is the value bound to the prover's commitment $V$, and $v\_{\text{max}}$ is a globally-fixed maximum value.
When generating the proof, the prover uses $v - v\_{\text{min}}$ as the value witness, and additionally binds $v\_{\text{min}}$ into the Fiat-Shamir transcript.
When verifying the proof, the verifier uses $V - v\_{\text{min}} G_c$ as the commitment (but binds the original commitment $V$ in the transcript).
This asserts that $v\_{\text{min}} \leq v \leq v\_{\text{min}} + v\_{\text{max}}$.
While this approach modifies the upper bound allowed for value binding, it does not pose problems in practice, as the intent of range proving is to ensure no overflow when performing balance computations elsewhere in the Tari protocol.

## Extended commitments and aggregation

We now describe how to reduce verification of a single aggregated range proof using extended commitments to a single multiscalar multiplication operation.
A partial approach is described in the Bulletproofs+ preprint.
The single multiscalar multiplication used to verify an aggregated range proof (given in Section 6.1 of the Bulletproofs+ preprint) can be written more explicitly in our case by accounting for the extra steps used to support extended commitments, and by noting that the $P$ input term to the weighted inner product argument (given in Figure 1 of the Bulletproofs+ preprint and Figure D.1 of the Zarcanum preprint) is replaced by the term $\widehat{A}$ defined in the overall range proving protocol (given in Figure 3 of the Bulletproofs+ preprint and Figure D.3 of the Zarcanum preprint).

Suppose we index the inner product generator vectors $\vec{G}$ and $\vec{H}$ using $i$, the inner product recursion generator vectors $\vec{L}$ and $\vec{R}$ using $j$, the aggregated commitment vector $\vec{V}$ by $k$, and the extended commitment mask generator vector $\vec{H}\_c$ by $l$.
We assume indexing starts at zero unless otherwise noted.
Single aggregated proof verification reduces (by suitable modification of the equation given in Section 6.1 of the Bulletproofs+ preprint) to checking that the following equation holds:
\\[
\sum\_i (r'es\_i) G_i + \sum\_i (s'es\_i') H\_i + \sum\_l \delta\_l' H\_{c,l} = e^2 \widehat{A} + \sum\_j (e^2e\_j^2) L\_j + \sum\_j (e^2e\_j^{-2}) R\_j + e A' + B
\\]
But we also have (from suitable modification of the definition given in Figure 3 of the Bulletproofs+ preprint) that
\\[
\widehat{A} = A - \sum\_i z G\_i + \sum\_i (z + d\_iy^{mn-i}) H\_i + x G\_c + y^{mn+1}\sum\_k z^{2(k+1)} (V\_k - v\_{\text{min},k} G\_c)
\\]
defined by the range proving system outside of the inner product argument.
Here
\\[
\begin{align*}
x &= \langle \vec{1}^{mn}, \overrightarrow{y}^{mn} \rangle z - \langle \vec{1}^{mn}, \vec{d} \rangle y^{mn+1}z - \langle \vec{1}^{mn}, \overrightarrow{y}^{mn} \rangle z^2 \\\\
&= z\sum\_{i=1}^{mn} y^i - y^{mn+1}z\sum\_{i=0}^{mn-1}d\_i - z^2\sum_{i=1}^{mn} y^i
\end{align*}
\\]
is a scalar defined entirely in terms of constants and challenge values from the proof.
Grouping terms, we find that a single aggregated range proof can be verified by checking that the following equation holds:
\\[
\begin{multline*}
\sum\_i (r'es\_i + e^2z) G\_i + \sum\_i (s'es\_i' - e^2(z + d\_iy^{mn-i})) H\_i + \left( r'ys' - e^2x + e^2y^{mn+1}\sum\_k z^{2(k+1)}v\_{\text{min},k} \right) G\_c \\\\
\+ \sum\_l \delta\_l' H\_{c,i} - \sum\_k (y^{mn+1}z^{2(k+1)}e^2) V\_k - e^2 A - \sum\_j (e^2e\_j^2) L\_j - \sum\_j (e^2e\_j^{-2}) R\_j - e A' - B = 0
\end{multline*}
\\]

## Batch verification

To verify a batch of proofs, we apply a separate random multiplicative scalar weight $w \neq 0$ to each proof's verification equation, form a linear combination of these equations, and group like terms.
Because each equation receives a separate random weight, successful evaluation of the resulting linear combination means that each constituent equation holds with high probability, and therefore that all proofs in the set are valid.
If the linear combination evaluation fails, at least one included proof is invalid.
The verifier must then test each proof in turn, or use a more efficient approach like binary search to identify each failure.
This follows the general approach informally discussed in Section 6.1 of the Bulletproofs+ preprint.

The reason for this rather convoluted algebra is twofold.
First, grouping like terms means that each unique generator used across a batch is only evaluated in the resulting multiscalar multiplication once; since the generators $\vec{G}, \vec{H}, G\_c, \vec{H}_c$ are globally fixed, this provides significant efficiency improvement.
Second, the use of algorithms (like those of Straus and Pippenger and others) to evaluate the multiscalar multiplication scale slightly sublinearly, such that it is generally beneficial to minimize the number of multiscalar multiplications for a given set of generators.
This means our approach to batch verification is effectively optimal.

## Designated mask recovery

It is possible for the prover to perform careful modifications to a non-aggregated range proof in order to allow a designated verifier to recover the masks used in the corresponding extended commitment.
The construction we describe here does not affect the verification process for non-designated verifiers.
Note that this construction requires a non-aggregated proof that contains a range assertion for only a single commitment.
Unlike the approach used initially in [RFC-0180](RFCD-0180_BulletproofRewinding.md), it is not possible to embed additional data (like the commitment value) into a Bulletproofs+ range proof.

The general approach is that the prover and designated verifier share a common nonce seed.
The prover uses this value to determinstically derive and replace certain nonces used in the proof.
During the verification process, the designated verifier performs the same deterministic derivation and is able to extract the commitment masks from the proof.
Because the resulting proof is still special honest-verifier zero knowledge, as long as the nonce seed is sampled uniformly at random, a non-designated verifier is not able to gain any information about the masks.

After sampling a nonce seed, the prover passes it through an appropriate set of domain-separated hash functions with scalar output to generate the following nonces used in the proof:
\\[
\\{\eta\_k\\}, \\{\delta\_k\\}, \\{\alpha\_k\\}, \\{d\_{L,j,k}\\}, \\{d\_{R,j,k}\\}
\\]
Here, as before, $k$ is indexed over the number of masks used in the extended commitment, and $j$ is indexed over the weighted inner product argument rounds.

By doing this, the prover effectively defines the proof element set $\\{\delta\_k'\\}$ as follows:
\\[
\delta\_k' = \eta\_k + \delta\_ke + e^2 \left\( \alpha\_k + \gamma\_ky^{n+1}z^2 + \sum\_j(e\_j^2d\_{L,j,k} + e\_j^{-2}d\_{R,j,k}) \right\)
\\]

When verifying the proof, the designated verifier uses the nonce seed to perform the same nonce derivation as the prover.
It then computes the mask set $\\{\gamma\_k\\}$ as follows:
\\[
\gamma\_k = \left\( (\delta\_k' - \eta\_k - \delta\_ke)e^{-2} - \alpha\_k - \sum\_j(e\_j^2d\_{L,j,k} + e\_j^{-2}d\_{R,j,k}) \right\) y^{-(n+1)}z^{-2}
\\]
The recovered masks must then be checked against the extended commitment once the value is separately communicated to the verifier.
Otherwise, if the verifier uses a different nonce seed than the prover did (or if the prover otherwise did not derive the nonces using a nonce seed at all), it will recover incorrect masks.
If the verifier is able to construct the extended commitment from the value and recovered masks, the recovery succeeds; otherwise, the recovery fails.

## Comparative performance

As we moved from Bulletproofs [1] to Bulletproofs+ [2] in our
[blockchain project](https://github.com/tari-project), the natural benchmark comparison is with the experimental results
in [2] and Dalek's Bulletproofs [3]. Compared with Dalek's Bulletproofs, our average proof creation is 30% slower,
while verification is on par. Compared with the experimental results in [2], we could not recreate the 16% reduction in
prover time; however, our 1% increase in verification time is on par with their 3%. Immediate benefits are evident
when employing batch verification; exponential gains range from 37% to 79% for batch sizes from 2 to 256 proofs.

Extended commitments add virtually no overhead in single or aggregated range proof creation or verification time,
neither in batched verification time nor when compared to regular Pedersen commitments.

Mask/blinding factor recovery adds moderate (5% for single proof-verification with extension degree zero) to significant
(22% for 256 single batched proofs verification with extension degree two) overhead to verification performance;
comparisons below were made without activating the recovery feature. Deactivating proof verification for a
"mask-recovery-only" mode of operation is possible and omits the expensive multi-exponentiation multiplication,
resulting in linear performance (as opposed to exponential gains/cost). Batched "mask-recovery-only" is approximately
10% more costly on average when compared to non-batched recovery.

**Note:** The test results listed here are relative; the numbers are not absolute. The tests were run on an Intel(R)
Core(TM) i7-7820HQ CPU laptop without using the `simd_backend` feature.

### Aggregated 64-bit range proof creation

_**Notes:**_
- Median values are used for comparison.
- In the headings and legends:
   - `ed_0` means extension degree zero
   - `ed_1` means extension degree one
   - `ed_2` means extension degree two

#### BP vs. BP+ (creation)

BP+ creation is 30% slower than BP.

| Size | BP Med (ms) | BP+ Med (ms) | Diff Med (%) |
|------|-------------|--------------|--------------|
| 1    | 16.29       | 21.24        | 130%         |
| 2    | 31.63       | 41.08        | 130%         |
| 4    | 60.47       | 80.46        | 133%         |
| 8    | 119.18      | 156.56       | 131%         |
| 16   | 240.18      | 306.03       | 127%         |
| 32   | 460.67      | 598.57       | 130%         |
|      |             | Average      | 130%         |

<p align="center"><img src="assets/img_bp_vs_bp_plus_creation.png" width="550" /></p>

#### BP+ extension degrees (creation)

Extended commitments add virtually no overhead to creation time.

| Size | BP+ Med ed_0 (ms) | BP+ Med ed_1 (ms) | BP+ Med ed_2 (ms) | Diff Med ed_0-1 (%) | Diff Med ed_0-2 (%) |
|------|-------------------|-------------------|-------------------|---------------------|---------------------|
| 1    | 21.24             | 21.48             | 22.467            | 101.12%             | 105.77%             |
| 2    | 41.08             | 41.45             | 42.074            | 100.91%             | 102.43%             |
| 4    | 80.46             | 80.70             | 80.76             | 100.31%             | 100.38%             |
| 8    | 156.56            | 157.07            | 157.06            | 100.33%             | 100.32%             |
| 16   | 306.03            | 306.28            | 305.49            | 100.08%             | 99.82%              |
| 32   | 598.57            | 598.47            | 598.01            | 99.98%              | 99.91%              |
|      |                   |                   | Average           | 100%                | 101%                |

<p align="center"><img src="assets/img_bp_plus_creation_extension_degrees.png" width="550" /></p>

### Aggregated 64-bit range proof verification

#### BP vs. BP+ (verification)

BP+ verification showed gains for smaller aggregation sizes compared to BP, but is slower for larger aggregation sizes.

| Size | BP Med (ms) | BP+ Med (ms) | Diff Med (%) |
|------|-------------|--------------|--------------|
| 1    | 2.34        | 2.17         | 93%          |
| 2    | 3.76        | 3.71         | 99%          |
| 4    | 6.44        | 6.18         | 96%          |
| 8    | 11.10       | 10.96        | 99%          |
| 16   | 17.57       | 19.52        | 111%         |
| 32   | 33.69       | 36.97        | 110%         |
|      |             | Average      | 101%         |

<p align="center"><img src="assets/img_bp_vs_bpplus_verification.png" width="550" /></p>

#### BP+ extension degrees (verification)

Extended commitments add virtually no overhead to verification time.

| Size | BP+ Med ed_0 (ms) | BP+ Med ed_1 (ms) | BP+ Med ed_2 (ms) | Diff Med ed_0-1 (%) | Diff Med ed_0-2 (%) |
|------|-------------------|-------------------|-------------------|---------------------|---------------------|
| 1    | 2.17              | 2.20              | 2.20              | 102%                | 102%                |
| 2    | 3.71              | 3.74              | 3.76              | 101%                | 101%                |
| 4    | 6.18              | 6.26              | 6.28              | 101%                | 102%                |
| 8    | 10.96             | 11.05             | 10.97             | 101%                | 100%                |
| 16   | 19.52             | 19.66             | 19.51             | 101%                | 100%                |
| 32   | 36.97             | 36.99             | 36.87             | 100%                | 100%                |
|      |                   |                   | Average           | 101%                | 101%                |


<p align="center"><img src="assets/img_bp_plus_verification_extension_degrees.png" width="550" /></p>

### Batched 64-bit single range proof verification

Batched verification shows significant gains when compared to linear verification.

| Batch size | BP+ linear (ms) | BP+ ext_deg 0 (ms) | BP+ ext_deg 1 (ms) | BP+ ext_deg 2 (ms) | Diff (%) | Gains (%) |
|------------|-----------------|--------------------|--------------------|--------------------|----------|-----------|
| 1          | 2.17            | 2.17               | 2.18               | 2.20               | 100%     | 0%        |
| 2          | 4.34            | 2.73               | 2.73               | 2.76               | 63%      | 37%       |
| 4          | 8.68            | 3.82               | 3.82               | 3.80               | 44%      | 56%       |
| 8          | 17.36           | 5.74               | 5.76               | 5.75               | 33%      | 67%       |
| 16         | 34.72           | 9.57               | 9.60               | 9.74               | 28%      | 72%       |
| 32         | 69.44           | 17.10              | 17.06              | 17.05              | 25%      | 75%       |
| 64         | 138.89          | 32.04              | 32.06              | 31.85              | 23%      | 77%       |
| 128        | 277.77          | 60.56              | 60.75              | 60.71              | 22%      | 78%       |
| 256        | 555.55          | 118.55             | 118.69             | 119.15             | 21%      | 79%       |

<p align="center"><img src="assets/img_bp_plus_batched_zoomed.png" width="550" /></p>

<p align="center"><img src="assets/img_bp_plus_batched.png" width="550" /></p>

### Batched 64-bit single range proof mask recovery

Mask-recovery-only mode is linear and does not benefit from batched operations; batched recovery is suboptimal.

| Batch size | No mask ed_0 (ms) | Mask only ed_0 (ms) | Linear mask only (ms) | Linear vs. mask only (%) | No mask vs. mask only (%) |
|------------|-------------------|---------------------|-----------------------|--------------------------|---------------------------|
| 1          | 2.10              | 0.22                | 0.22                  | 100.0%                   | 10.4%                     |
| 2          | 2.59              | 0.43                | 0.44                  | 102.2%                   | 16.5%                     |
| 4          | 3.59              | 0.90                | 0.87                  | 97.0%                    | 25.0%                     |
| 8          | 5.46              | 1.87                | 1.74                  | 93.4%                    | 34.2%                     |
| 16         | 9.31              | 3.78                | 3.49                  | 92.3%                    | 40.6%                     |
| 32         | 16.54             | 9.31                | 6.97                  | 74.9%                    | 56.3%                     |
| 64         | 30.39             | 15.27               | 13.95                 | 91.3%                    | 50.3%                     |
| 128        | 58.25             | 30.60               | 27.90                 | 91.2%                    | 52.5%                     |
| 256        | 113.18            | 61.36               | 55.80                 | 90.9%                    | 54.2%                     |

<p align="center"><img src="assets/img_bp_plus_batched_masks.png" width="550" /></p>

| Date        | Change            | Author |
|:------------|:------------------|:-------|
| 7 Dec 2022  | First draft       | Aaron  |
| 13 Jan 2022 | Performan updates | brianp |

## References
- [1] [Bulletproofs: Short Proofs for Confidential Transactions and More](https://eprint.iacr.org/2017/1066/20220414:014622)
- [2] [Bulletproofs+: Shorter Proofs for Privacy-Enhanced Distributed Ledger](https://eprint.iacr.org/2020/735/20200618:154806)
- [3] [Dalek's Bulletproofs docs](https://doc-internal.dalek.rs/bulletproofs/index.html) 
- [4] [Bulletproofs+ Audit report](https://suyash67.github.io/homepage/assets/pdfs/bulletproofs_plus_audit_report_v1.1.pdf)
