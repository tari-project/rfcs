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

### Threat model

The mechanism proposed here targets a miner whose hash power is
concentrated in a **single** PoW algorithm and who therefore has to mine
consecutive blocks with that one algorithm in order to build a competing
chain. The canonical case is Sha3x ASIC capacity growing until it can
routinely out-pace the GPU and CPU algorithms.

It does not defend against a miner who controls capacity in two or more
algorithms and can alternate between them. Such a miner never produces a
same-algorithm run and never incurs a penalty. This limitation is
inherent to a rule keyed on the previous block's algorithm, and is the
reason for the penalty classes defined below.

### Penalty classes

RxM and RxT are both RandomX variants and are mined by the same
hardware, so a miner can move between them at no cost. Treating them as
distinct algorithms for backoff purposes would leave the mechanism open
to trivial bypass: a RandomX farm alternating RxM and RxT would build an
unbroken chain with no penalty at all, while a Sha3x miner --- the party
this RFC is aimed at --- would pay in full.

Algorithms are therefore grouped into **penalty classes** for the
purposes of the backoff rule:

| Penalty class | Algorithms  |
|---------------|-------------|
| RandomX       | RxM, RxT    |
| Sha3x         | Sha3x       |
| C29           | C29         |

Penalty classes affect only the backoff rule. Accumulated difficulty is
still tracked per algorithm, and the chain comparison in the Overview is
unchanged.

### The backoff rule

This RFC introduces an exponential backoff for consecutive blocks mined
by the same penalty class:

-   If a block is mined in class A and the previous block was also mined
    in class A, the target time for class A is doubled.
-   The doubling compounds for each further consecutive block of the
    same class.
-   If a block of a different class is mined, the target time for class
    A resets to its base consensus value.

### Cap

The doubling is capped at **32x**. Writing `r` for the run length --- the
number of consecutive blocks of the same penalty class ending at and
including the block being mined --- the modifier is:

```text
m = min( 2^(r - 1), 32 )
```

| Run length `r` | Modifier `m` |
|----------------|--------------|
| 1              | 1            |
| 2              | 2            |
| 3              | 4            |
| 4              | 8            |
| 5              | 16           |
| 6              | 32           |
| 7 or more      | 32           |

The cap is a liveness requirement, not a tuning choice. The modifier
only resets when a block of a *different* penalty class is mined. If a
class is ever the sole active miner --- for example if the GPU and CPU
algorithms lose their miners after a fork --- there is nothing to reset
it, and an uncapped modifier would double indefinitely until the chain
stopped producing blocks, with no recovery path short of another fork.
The cap bounds that failure to a 32x slowdown: at an 8 minute base
target, a chain mined by a single class settles at roughly 4.3 hours per
block and resumes normal operation as soon as any other class mines.

The cap is reached after 5 doublings, i.e. on the **sixth** consecutive
block of a class.

### Difficulty calculation

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

#### Order of normalization and clamping

The existing LWMA clamps each solve time before use, to bound the
influence of manipulated timestamps. The normalization above interacts
with that clamp, and the order is consensus-critical.

Normalization is applied **first**, and the clamp is then applied to the
normalized value against the **unchanged** base bounds:

```text
solve_time[i] = clamp( raw_solve_time[i] / m[i], min_bound, max_bound )
```

Clamping the raw solve time against the base bounds and dividing
afterwards is incorrect. A block legitimately mined against a 32x target
takes roughly 32x longer, so the base upper bound would truncate a real
solve time and the subsequent division would yield a spuriously small
value, driving a false difficulty spike. Because `m[i]` is always
positive, clamping the normalized value against the base bounds is
exactly equivalent to clamping the raw value against bounds scaled by
`m[i]`, which is the intended behaviour.

#### Integer arithmetic

`solve_time[i] / m[i]` must not be evaluated as an integer division per
term: with `m = 32` a 15 second solve time truncates to zero, and the
error accumulates across every block in the window. Because every
modifier is a power of two dividing the 32x cap, the sum can be kept in
exact integer arithmetic by scaling every term by the cap:

```text
weighted_times = sum( raw_solve_time[i] * (i + 1) * (M_MAX / m[i]) )
k              = block_window * (block_window + 1) * target_time * M_MAX / 2

where M_MAX = 32
```

`M_MAX / m[i]` is an exact integer for every permitted modifier, and
scaling both `k` and `weighted_times` by the same factor leaves
`next_target_difficulty` unchanged.

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
-   After six consecutive Sha3x blocks the target time reaches **4 hours
    16 minutes** (32x) and stops growing.
-   If a block of a different penalty class is mined, the Sha3x target
    time resets to **8 minutes**.

An RxM block followed by an RxT block is a run of two within the RandomX
class, so the second block is mined at a 16 minute target. Switching
between the two RandomX variants does not reset the modifier.

## Consequences 1

### Positive

-   Significantly increases the cost of selfish mining. A private chain
    of depth 6 built by a single penalty class costs 63 units of work
    against 6 for an honest chain of the same depth.
-   Reduces the ability of a single algorithm to reorg multiple blocks.
-   Preserves the multi-algorithm decentralization objective.
-   Grouping RxM and RxT into one penalty class closes the cheapest
    bypass, since both are mined by the same hardware.

### Negative

-   Requires a hard fork.
-   Changes block-time dynamics under certain hash rate distributions.
-   May introduce more short-term variance in block intervals.
-   Does not prevent a miner holding capacity in two or more penalty
    classes from alternating between them to avoid the penalty
    entirely.
-   If a single penalty class is left as the only active miner, the
    chain runs at up to 32x the base target time until another class
    mines a block.
-   Penalizes a single-algorithm miner for a run that occurs by chance,
    not only for one produced deliberately.

### Neutral

-   Does not change the geometric-mean comparison logic directly.
-   Modifies the LWMA only through its target-time input and the
    corresponding normalization of solve times; the shape of the moving
    average is unchanged.
-   Requires no new header fields. The modifier for any block is derived
    from the PoW algorithms of the preceding blocks, so validators can
    recompute it from headers alone --- noting that this requires up to
    5 headers of lookback beyond the start of the LWMA window.

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
