# A-TIP-RFC-MT-0004: MinoTari PoW difficulty changes

| TIP             | [A-TIP-RFC-MT-0004](#/RFC/MinoTari/TIP-RFC-MT-0004_MinoTari_PoW_Difficulty_changes.md)                  |
|-----------------|---------------------------------------------------------------------------|
| Title           | MinoTari PoW difficulty changes                                           |
| Last Modified   | 2026-07-28                                                                |
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

Tari does not compute the full geometric mean: the final n-th root step
is omitted to avoid floating-point operations. Because the protocol only
needs to order two values rather than compute an exact mean, the root is
unnecessary --- multiplying the accumulated difficulties preserves the
same ordering.

Tari currently supports four PoW algorithms:

-   RxM
-   RxT
-   Sha3x
-   C29

To compare two competing chain tips, Tari calculates:

```text
RxM * RxT * Sha3x * C29
```

The chain with the larger product is considered to have more accumulated
PoW.

### Example

Assume the total accumulated difficulties for the four algorithms are:

```text
RxM, RxT, Sha3x, C29
```

Now consider two competing new blocks:

-   One mined on RxM with difficulty `x`
-   One mined on Sha3x with difficulty `y`

We compare:

```text
(RxM + x) * RxT * Sha3x * C29
RxM * RxT * (Sha3x + y) * C29
```

After cancelling common terms, this comparison reduces to evaluating:

```text
x / RxM  vs  y / Sha3x
```

Whichever ratio is larger represents the larger relative increase in
accumulated PoW.

### Problem

This approach works while hash rate is balanced across the algorithms.
If one algorithm (for example Sha3x) sees a large hash rate increase ---
say because ASIC hardware becomes dominant relative to GPU mining --- its
relative contribution can dominate the comparison.

As accumulated difficulty grows, terms such as `x / RxM` converge toward
zero unless `x` scales proportionally with `RxM`. If one algorithm's
difficulty grows much faster than the others, its blocks consistently
produce larger relative increases.

One algorithm can therefore reorg blocks mined by the other algorithms
disproportionately often, which undermines the original design goal of
using multiple PoW algorithms for decentralization and hardware
diversity.

## Proposed Change 1

Tari currently calculates target difficulty using an LWMA (Linearly
Weighted Moving Average) over the last 90 blocks. The LWMA uses:

-   Target block time
-   Header timestamps
-   Historical target difficulties

to compute the next target difficulty.

This RFC introduces an exponential backoff for consecutive blocks mined
by the same PoW algorithm:

-   If a block is mined using algorithm A and the previous block was
    also mined using algorithm A, the target time for algorithm A is
    doubled.
-   The doubling compounds for each further consecutive block of the
    same algorithm.
-   If a block of a different algorithm is mined, the target time for
    algorithm A resets to its base consensus value.

The current difficulty calculation is:

```text
next_target_difficulty = ave_difficulty * k / weighted_times

where k = block_window * (block_window + 1) * target_time / 2
```

Because the penalty enters the formula only through `target_time`, it
can be expressed as a single multiplier:

```text
adjusted_next_target_difficulty = next_target_difficulty * m

where m = the penalty modifier
```

The `adjusted_next_target_difficulty` is used only as the target
difficulty that the mined block must meet. It is not counted when
calculating the total accumulated PoW of the chain --- the unadjusted
difficulty is used there.

The modifier applied to each block in the window must also be fed back
into the next difficulty calculation. The weighted times are currently
the sum over the window of:

```text
weighted_times = sum( solve_time[i] * (i + 1) )

where i = index of the block within the window
```

Each solve time is normalized by the modifier that was in force for that
block, so that a block mined against an inflated target is not read as a
drop in hash rate:

```text
weighted_times = sum( solve_time[i] / m[i] * (i + 1) )

where
i    = index of the block within the window
m[i] = modifier applied to block i
```

This mechanism:

-   Does not alter the underlying hash rate.
-   Does not directly manipulate accumulated difficulty.
-   Makes selfish mining exponentially more expensive for any single
    algorithm attempting to dominate.
-   Encourages natural interleaving of algorithms.

### Example

Assume the base target time for Sha3x is **8 minutes**.

-   If the previous block was Sha3x, the next Sha3x target time becomes
    **16 minutes**.
-   If another Sha3x block is mined consecutively, the target time
    becomes **32 minutes**.
-   If a different algorithm mines a block, the Sha3x target time resets
    to **8 minutes**.

## Consequences 1

### Positive

-   Significantly increases the cost of selfish mining.
-   Reduces the ability of a single algorithm to reorg multiple blocks.
-   Preserves the multi-algorithm decentralization objective.

### Negative

-   Requires a hard fork.
-   Changes block-time dynamics under certain hash rate distributions.
-   May introduce more short-term variance in block intervals.
-   Does not prevent pools from switching between RxT and RxM.

### Neutral

-   Does not change the geometric-mean comparison logic directly.
-   Does not modify the LWMA formula itself --- only its target-time
    input.

## Proposed Change 2

Tari currently uses a block window of 90 blocks for the LWMA. This gives
a stable difficulty, but it takes several blocks to respond to a change
in hash rate. When large miners switch on and off, the resulting hash
rate swings produce correspondingly large swings in solve time, so a
faster response is desirable. Given Tari's long target block time, the
window should be reduced to 45 blocks.

## Consequences 2

### Positive

-   Responds faster to an increase or decrease in hash power.

### Negative

-   Can cause more oscillation in the difficulty.

## References

-   https://github.com/zawy12/difficulty-algorithms/issues/3#issuecomment-442129791
-   https://github.com/zcash/zcash/issues/4021


## Change History

### 2026-06-11

* Document Created.
