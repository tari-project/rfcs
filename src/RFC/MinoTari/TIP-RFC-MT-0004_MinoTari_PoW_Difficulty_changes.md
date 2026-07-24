# A-TIP-RFC-MT-0004: MinoTari PoW difficulty changes

| TIP             | [A-TIP-RFC-MT-0004](#/RFC/MinoTari/TIP-RFC-MT-0004_MinoTari_PoW_Difficulty_changes.md)                  |
|-----------------|---------------------------------------------------------------------------|
| Title           | MinoTari PoW difficulty changes                                           |
| Last Modified   | 2026-06-24                                                                |
| Authors         | SW van Heerden                                                            |
| Status          | Accepted                                                                  |
| Type            | Architecture                                                              |
| Created         | 2026-06-11                                                                |
| References      |                                                                           |

## Overview

Tari Core currently uses a geometric-mean-style comparison to determine
the best chain tip across multiple Proof-of-Work (PoW) algorithms.

The geometric mean is a measure of central tendency calculated by
multiplying a set of values together and then taking the n-th root
(where n is the number of values). Unlike the arithmetic mean, the
geometric mean is well suited to comparing values that span multiple
orders of magnitude.

Tari does not compute the full geometric mean. Specifically, the final
n-th root step is omitted to avoid floating-point operations. Since the
protocol only needs to compare two values (rather than compute the exact
geometric mean), the root operation is unnecessary --- multiplying the
accumulated difficulties is sufficient for ordering purposes.

Tari currently supports four PoW algorithms:

-   Rx
-   RxT
-   Sha3x
-   C29

To compare two competing chain tips, Tari calculates:

    Rx * RxT * Sha3x * C29

The chain with the larger product is considered to have more accumulated
PoW.

### Example

Assume the total accumulated difficulties for the four algorithms are:

    Rx, RxT, Sha3x, C29

Now consider two competing new blocks:

-   One mined on Rx with difficulty `x`
-   One mined on Sha3x with difficulty `y`

We compare:

    (Rx + x) * RxT * Sha3x * C29
    Rx * RxT * (Sha3x + y) * C29

After cancelling common terms, this comparison reduces to evaluating:

    x / Rx  vs  y / Sha3x

Whichever ratio is larger represents the larger relative increase in
accumulated PoW.

### Problem

This approach works under balanced hash rate conditions. However, if one
algorithm (e.g., Sha3x) experiences a significant hash rate increase ---
for example due to ASIC hardware becoming dominant relative to GPU
mining --- its relative contribution can dominate the comparison.

As accumulated difficulty grows, terms such as `x / Rx` converge toward
zero unless `x` scales proportionally with `Rx`. If one algorithm's
difficulty grows much faster than the others, its blocks will
consistently produce larger relative increases.

This creates a situation where one algorithm can disproportionately
reorg blocks mined by other algorithms. That outcome undermines the
original design goal of including multiple PoW algorithms for
decentralization and hardware diversity.


## Proposed Change

Tari currently calculates target difficulty using LWMA (Linearly
Weighted Moving Average) over the last 90 blocks. The LWMA uses:

-   Target block time
-   Header timestamps
-   Historical target difficulties

to compute the next target difficulty.


Introduce an exponential backoff mechanism for consecutive blocks mined
by the same PoW algorithm:

-   If a block is mined using algorithm A, and the previous block was
    also mined using algorithm A, then the target time for algorithm A
    is doubled.
-   This doubling continues for each consecutive block of the same
    algorithm.
-   If a block of a different algorithm is mined, the target time for
    algorithm A resets to its base consensus value.

### Example

Assume the base target time for Sha3x is **8 minutes**.

-   If the previous block was Sha3x → the next Sha3x target time becomes
    **16 minutes**.
-   If another Sha3x block is mined consecutively → target time becomes
    **32 minutes**.
-   If a different algorithm mines a block → Sha3x target time resets to
    **8 minutes**.

This mechanism:

-   Does not alter the underlying hash rate.
-   Does not directly manipulate accumulated difficulty.
-   Makes selfish mining exponentially more expensive for any single
    algorithm attempting to dominate.
-   Encourages natural interleaving of algorithms.

## Consequences 1

### Positive

-   Significantly increases the cost of selfish mining.
-   Reduces the ability of a single algorithm to reorg multiple blocks.
-   Preserves the multi-algorithm decentralization objective.

### Negative

-   Requires a hard fork.
-   Changes block-time dynamics under certain hash rate distributions.
-   May introduce more short-term variance in block intervals.

### Neutral

-   Does not change the geometric-mean comparison logic directly.
-   Does not modify the LWMA formula itself --- only its target-time
    input.

## Proposed Change 2

Tari currently uses a block window of 90 for the LWMA. While this provides stability to the mining power, it takes a few blocks to respond to hash rate changes. If exchanges jump on and off, this can lead to large hash rate differences that come with large changes in the solvetime. Having the LWMA respond quicker to these will be helpful. This should be changed to a 45-block window, given the large target time per block that we have.

## Consequences 2

### Positive

-   Faster response on blocks with an increase or decrease in hash power

### Negative

-   Can cause some oscillation in the difficulty

## References

-   https://github.com/zawy12/difficulty-algorithms/issues/3#issuecomment-442129791
-   https://github.com/zcash/zcash/issues/4021


## Change History

### 2026-06-11

* Document Created.
