# P-TIP-RFC-7: Spend-Time Scripts for Ootle Stealth UTXOs

| TIP           | [P-TIP-RFC-7](#p-tip-rfc-7-spend-time-scripts-for-ootle-stealth-utxos)            |
|---------------|----------------------------------------------------------------------------------|
| Title         | Spend-time scripts for Ootle stealth UTXOs (script-capable spend conditions)     |
| Last Modified | 2026-06-24                                                                       |
| Authors       | Stanley Bondi                                                                    |
| Status        | Proposed                                                                         |
| Type          | Architecture                                                                     |
| Created       | 2026-06-17                                                                       |
| References    | Migrated from [tari-project/tips#6](https://github.com/tari-project/tips/pull/6) |

> **Scope.** This proposal targets Tari Ootle (the programmable smart-contract layer); the
> "stealth UTXOs" it concerns are Ootle confidential outputs. All `crates/...` paths refer to
> the [tari-ootle repository](https://github.com/tari-project/tari-ootle); line numbers are
> indicative and may drift.

## Abstract

This TIP makes an Ootle stealth UTXO spendable under **programmable conditions** rather than on the
spender's credentials alone. It does two things. First, it adds a `TemplateFunction` spend
condition — a **stateless, restricted WASM predicate** that answers *"is this particular spend
valid?"* by introspecting the spending `StealthTransferStatement`: its inputs, its outputs
(including each output's own committed `SpendAuthorization`), and revealed amounts, together with the
current epoch. The predicate runs in a sandboxed execution mode that forbids state mutation,
cross-template calls and non-determinism, modelled directly on the engine's existing resource
`AuthHook` mechanism.

Second, it restructures how a condition is committed. The inline `SpendCondition` field is removed;
an output's `SpendAuthorization` is a **key path** (a one-time `spend_key`, the signature condition)
and/or a **condition tree** — a Merklized set (MAST) of alternative `SpendCondition` leaves committed
under a `condition_root`, of which a `TemplateFunction` predicate is one leaf kind alongside
`AccessRule`, native builtins, and native covenants (§9, §10). The spender reveals only the leaf they
exercise.

A `TemplateFunction` predicate can read the spending transaction's outputs and the `condition_root`
it was invoked under, so it *can* express covenants — a covenant is simply a predicate that asserts
properties of the outputs it produces, including (recursively) that an output commits the same
condition. The earlier draft of this proposal therefore deferred a dedicated covenant field and
delivered covenants only as `template_lib` helper patterns over a `TemplateFunction` leaf. **That
deferral has since been reversed**: the implemented design adds two native, declarative leaf kinds —
`BuiltinPredicate` (timelocks, hashlocks) and `Covenant` (output-preservation, value-routing,
value-conservation) — alongside `TemplateFunction`, because they are cheaper (no WASM cost),
off-chain analyzable, and engine-enforced. The `template_lib` covenant helpers remain for bespoke
WASM predicates (see [Rationale](#rationale)).

## Motivation

Before this proposal, an Ootle stealth UTXO supported exactly two spend conditions
(`crates/template_lib_types/src/stealth/unspent_output.rs`):

```rust,ignore
pub enum SpendCondition {
    Signed(RistrettoPublicKeyBytes),
    AccessRule(AccessRule),
}
```

Both are evaluated against the `AuthorizationScope` — the set of virtual-proof badges derived
from the transaction signers (`crates/engine/src/runtime/auth.rs:18`). They express *who* may
spend, never *under what conditions* or *to what effect*. Whole classes of standard UTXO
behaviour are therefore inexpressible at the output level:

- **Timelocks** — "spendable only at/after epoch N" (absolute) or relative to creation.
- **Hash/secret locks and atomic swaps** — "spendable by revealing a preimage / a signature
  over an agreed message", the building block for cross-chain and off-chain protocols.
- **Value-constrained spends** — "at most X may leave per spend", "change must return here".
- **Covenants** — "these funds may only be spent into outputs that carry this same condition"
  (vaults, congestion-control, non-transferable balances, recovery wallets).

Today the only way to approximate these is to route funds through a stateful component and
gate them with `AccessRule`/component methods. That forces a confidential UTXO to become (or
be escorted by) a public component, defeating the privacy and self-custody properties that
make stealth UTXOs valuable, and it cannot express constraints on the *spending transaction*
at all.

A spend script restores Bitcoin-/Simplicity-style programmability at the output level, while
reusing the WASM template toolchain authors already know, and without a new bytecode VM.

## Specification

### Overview of the spend-validation path (unchanged surface)

A stealth transfer is processed by `ResourceManager::stealth_transfer`
(`crates/template_lib/src/resource/manager.rs`) which the engine dispatches via
`ResourceAction::StealthTransfer`. Inside the engine this reaches
`WorkingState::validate_and_spend_stealth_utxos`
(`crates/engine/src/runtime/working_state.rs`), which locks each input UTXO and then runs the
per-input authorization check `verify_input_authorizations`
(`crates/engine/src/runtime/impl.rs`). For a script-path input that delegates to
`verify_script_path_authorization` → `evaluate_condition_leaf`, the sole enforcement point and
where a `TemplateFunction`, builtin or covenant condition is evaluated.

Critically, this path already holds the entire `StealthTransferStatement` — so all data a script
needs to introspect is in scope at the point of validation; no new plumbing of transaction data is
required.

### Technical Details

#### 1. The `SpendCondition` leaf (a flat conjunction of atomic conditions)

`crates/template_lib_types/src/stealth/unspent_output.rs`:

```rust,ignore
/// A spend condition is no longer an inline UTXO field; it is the v0 leaf payload of the
/// condition tree (§9). The key path (`spend_key`, §10) is the signature condition, so the
/// former `Signed` variant is removed.
///
/// A leaf is a flat, non-empty **conjunction** (logical AND): the spend is admissible only if
/// every atom holds. The condition tree itself is the disjunction (each leaf is an alternative
/// spend path), so AND is the only combinator a leaf needs. The conjunction is flat — atoms do
/// not nest — so evaluation depth is bounded by construction.
pub struct SpendCondition(Box<[AtomicCondition]>);

/// The atomic spend conditions a leaf may conjoin.
pub enum AtomicCondition {
    /// Spend is gated on a native access rule evaluated against the transaction's auth scope.
    #[n(0)]
    AccessRule(#[n(0)] AccessRule),
    /// Spend is gated on a stateless WASM predicate over the spending transfer.
    #[n(1)]
    TemplateFunction(#[n(0)] TemplateFunction),
    /// Spend is gated on a native, consensus-fixed local predicate (timelock or hashlock); no
    /// deployed template, evaluated natively.
    #[n(2)]
    Builtin(#[n(0)] BuiltinPredicate),
    /// Spend is gated on a native, consensus-fixed constraint over the spending transaction's
    /// outputs and value flow; no deployed template, evaluated natively.
    #[n(3)]
    Covenant(#[n(0)] Covenant),
}

pub struct TemplateFunction {
    /// The template providing the predicate. Templates are immutable substates, so the
    /// referenced code cannot change under the output once committed.
    #[n(0)]
    pub template: TemplateAddress,
    /// The stateless (`is_mut == false`) predicate function on that template.
    #[n(1)]
    pub function: FunctionName,
    /// Bound parameters, **positional — one CBOR-encoded value per leading (non-`SpendContext`)
    /// parameter**, matching the engine's `Vec<Bytes>` call ABI. Baked into the leaf at
    /// creation; the spender cannot alter them.
    #[n(2)]
    pub args: Vec<Bytes>,
}

/// A native, consensus-fixed local predicate. No deployed template; evaluated natively.
pub enum BuiltinPredicate {
    /// Absolute epoch lock: admissible once the current epoch is at or after `unlock_epoch`.
    #[n(0)] AfterEpoch(#[n(0)] u64),
    /// Absolute epoch deadline: admissible only while the current epoch is strictly before it.
    #[n(1)] BeforeEpoch(#[n(0)] u64),
    /// Hashlock: the witness `data` blob must be a preimage whose `alg` digest equals `hash`.
    #[n(2)] HashLock { #[n(0)] hash: Hash32, #[n(1)] alg: HashAlg },
}

/// A native, consensus-fixed constraint over the spending transaction's outputs. No deployed
/// template; evaluated natively.
pub enum Covenant {
    /// "Stay in the vault": every stealth output must preserve the invoking `condition_root`,
    /// and there must be at least one such output.
    #[n(0)] OutputPreservesCondition,
    /// Value-flow: at least one stealth output commits `condition_root` and promises `min_value`.
    #[n(1)] OutputTo { #[n(0)] condition_root: Hash32, #[n(1)] min_value: u64 },
    /// Value-conservation: the invoking partition's committed value is conserved into outputs
    /// carrying its `condition_root`, save for an exact cleartext outflow of at most `max_revealed`
    /// (zero = full conservation). Proven by a `CovenantBalanceClaim` (§8).
    #[n(2)] BalancePreserved(#[n(0)] u64),
}
```

A `TemplateFunction` condition fully commits `{template, function, args}`, so a spender cannot
substitute a different predicate. `args` lets one template function serve as a parameterised
predicate family (e.g. a single `timelock` function bound with different unlock epochs per output).
A `BuiltinPredicate` and a `Covenant` are likewise fully committed — a builtin is the cheap native
path for the common timelock/hashlock cases, and a covenant the cheap native path for the common
value-routing cases — so the bespoke `TemplateFunction` path is needed only when the standard library
does not already cover the constraint.

> **Committed output model (decided).** The output does not store an inline `SpendCondition`. The
> decided integration (§10) replaces that field with a single committed `SpendAuthorization` field —
> an enum that is a `spend_key` key path, a `condition_root` script path (the root of a condition
> tree, §9, whose leaves are `SpendCondition` values), or both. §1–§8 describe the per-predicate
> mechanism, which is unchanged; it applies to the leaf reached via the script-path witness. A leaf
> with `id = 0` carries a Borsh-encoded `SpendCondition` (this type).

#### 2. Predicate ABI (author-facing)

A spend script is an ordinary `is_mut == false` template **function** (no `&self`). It takes
its bound args plus a `SpendContext` handle, and rejects the spend by panicking (returning normally authorises it):

```rust,ignore
#[template(stateless)]
mod vault_covenant {
    pub fn enforce(unlock_epoch: u64, ctx: SpendContext) {
        // timelock: panic (reject the spend) until the unlock epoch
        assert!(ctx.current_epoch() >= unlock_epoch, "timelock not met");
        // covenant: every stealth output must commit to this same condition set
        ctx.require_output_preserves_condition();
    }
}
```

`SpendContext` is a thin `template_lib` wrapper over a new introspection host op (below). The
exact signature the engine requires — `is_mut == false`, a unit (`()`) return, and a trailing
`SpendContext` argument — and where it is enforced are specified in §3. (The `#[template(stateless)]`
form is an authoring convenience — implemented in `crates/template_macros` as a `stateless` template
option — that declares a component-less template of receiver-less `pub fn` items; the predicate can
equally be written as a receiver-less function on a normal `#[template]` struct.)

> Failure convention: a spend script signals rejection the way every Ootle template does — by
> **panicking** (e.g. `assert!`), never by returning a value or a `Result`. Returning normally
> authorises the spend; any panic aborts it. This matches the resource `AuthHook`, which
> likewise returns unit and denies by aborting. Deliberate rejections and script bugs (panic /
> out-of-gas) are indistinguishable by design — both simply invalidate the spend, exactly as a
> failed Bitcoin script does.

#### 3. Function signature requirements and validation timing

A spend script is matched against its `FunctionDef`
(`crates/template_abi/src/template_def.rs`) exactly as the resource auth hook is matched in
`check_resource_auth_hook` (`crates/engine/src/runtime/impl.rs:404`). The required shape:

| Requirement | Rule |
|---|---|
| Mutability | `func.is_mut == false` — a mutable predicate could take a write lock and cause side effects, defeating the read-only guarantee (see §6) |
| Return | `func.output == Type::Unit` — the predicate rejects by panicking, not by returning a value |
| Context arg | the **last** argument's type is `Type::Other { name: "SpendContext" }` (matched via `arg_type.other()`, just as the hook matches `"AuthHookCaller"`); the engine injects this argument |
| Bound args | the **leading** arguments (all but the last) are the bound parameters. `TemplateFunction.args` is **positional** — one CBOR-encoded value per leading parameter — so `args.len()` must equal `func.arguments.len() - 1`, and element `i` must decode to leading parameter `i` |

Putting `SpendContext` last lets one rule cover 0, 1 or N bound args. `Type::Unit` and
`Type::Other` already exist in the ABI (`template_def.rs:120,150`), so the match is a
straightforward extension of the existing hook validator:

```rust,ignore
fn validate_spend_script_signature(func: &FunctionDef) -> Result<(), RuntimeError> {
    if func.is_mut {
        return Err(/* spend script must not be mutable */);
    }
    if !matches!(func.output, Type::Unit) {
        return Err(/* spend script must return unit (it rejects by panicking) */);
    }
    let ctx = func.arguments.last().ok_or(/* missing SpendContext arg */)?;
    if ctx.arg_type.other() != Some("SpendContext") {
        return Err(/* last argument must be SpendContext */);
    }
    // the leading args (all but the last) are the bound-arg types `TemplateFunction.args` decodes to
    Ok(())
}
```

The signature is validated at **spend time only** (T2):

**(T2) Spend time — authoritative, mandatory.** Immediately before invoking, the engine
re-resolves the `LoadedTemplate`, fetches the `FunctionDef`, and runs
`validate_spend_script_signature` (`crates/engine/src/runtime/impl.rs`). This is the security gate
and cannot be skipped: a revealed leaf condition is untrusted data supplied by the spender, so the
engine must not assume it was validated earlier. Were this omitted, a malformed condition could drive
the engine to call an `is_mut == true` function (acquiring a write lock inside a supposedly read-only
predicate), call a non-existent function, or misinterpret a non-unit return. A failure here rejects
the spend (`SpendScriptRejected`); the output remains unspent.

**No creation-time (T1) validation of the predicate.** An earlier draft of this proposal mandated a
mirror check at output *creation*, rejecting the creating transaction if the committed
`TemplateFunction` named a missing/mutable/non-unit/wrong-arity function — so a malformed predicate
surfaced to the *creator* rather than to the *recipient* as permanently locked funds. The MAST
integration (§9, §10) **precludes this**: a created output commits only the `condition_root`, not its
leaves. The leaf (and hence the `TemplateFunction` it contains) is revealed only at spend, so the
engine has nothing to validate at creation — `validate_stealth_outputs_statement`
(`crates/engine_types/src/stealth/outputs.rs`) checks commitments, nonces and range/balance proofs
but is structurally blind to the hidden conditions. The locked-funds risk is therefore real and is
borne by whoever constructs the leaf set: it must be caught **wallet-side at construction**, not by
the engine. (Because templates are immutable, permanent, global substates — `SubstateId::Template` is
`is_read_only`/`is_global`, with no removal or deactivation path — a predicate that resolves and
validates once will keep validating, so a wallet-side check at construction is durable.)

> Limitation: at spend time the host can verify the function *shape*, the `args` element count, and
> that each element is well-formed CBOR, but it cannot fully type-check an element against its
> declared parameter type — that conformance is enforced at the WASM deserialization boundary (the
> dispatcher's `decode_exact::<T>` per arg, `crates/template_macros/src/template/dispatcher.rs`),
> where a mismatch panics and rejects the spend.

#### 4. Introspection host op (`SpendContext`)

Add one `EngineOp` (`crates/template_abi/src/ops.rs`), `SpendContextInvoke = 0x11`, dispatched to a
new `RuntimeInterface` method `spend_context_invoke(action: SpendContextAction) -> InvokeResult`.
**Scope: the current transfer statement only** (per design decision; see Rationale). The
`SpendContextAction` variants (`crates/template_lib/src/args/types.rs`):

| Action | Returns |
|---|---|
| `Inputs` | `Vec<StealthInputView>` — each input's `commitment` |
| `Outputs` | `Vec<StealthOutputView>` — each output's `commitment`, `minimum_value_promise`, `auth` (`SpendAuthorization`), `tag` |
| `CurrentInput` | `CurrentInputView` — index, commitment, and the committed `condition_root` of the input whose condition is executing (the `condition_root` enables recursive covenants, subsuming the dropped `InvokingCondition` action) |
| `RevealedInputAmount` | total cleartext amount being spent |
| `RevealedOutputAmount` | total cleartext amount being output |
| `AssertCovenantBalanced { max_revealed }` | verifies the current partition's `CovenantBalanceClaim` value-conservation proof (§8); backs the `require_balance_preserved*` helpers |
| `WitnessData` | the raw spender-supplied witness `data` blob (§10) the leaf may interpret |

The current epoch is **not** a `SpendContext` action; a script reads it via the existing
`Consensus::current_epoch()` host op (`consensus_invoke`). There is no `Signers` action — a spend
script reasons about the transfer, not the transaction's signer set.

These views expose only data already present in `StealthTransferStatement` + consensus context.
Confidential *values* remain hidden (only commitments and `minimum_value_promise` are visible),
preserving the privacy model — a script reasons about commitments and spend authorizations, not
plaintext amounts, exactly as the balance proof does.

#### 5. Invocation flow

Evaluation is hoisted to the `RuntimeInterfaceImpl` layer (`crates/engine/src/runtime/impl.rs`),
where the template provider (`self.template_provider`) and the re-entrant runtime pointer
already live — this is precisely how `invoke_resource_access_hook` works today. For a script-path
input (§10) the leaf to evaluate is the one named by the input's script-path witness, its inclusion
in the committed `condition_root` having been verified first (§9, `verify_inclusion`); the flow below
then runs for that single leaf's conjunction of atoms.

1. `verify_input_authorizations` resolves, per input, the spend path from its witness: a key-path
   witness is checked as a signature against the output's `spend_key`; a revealed `AccessRule` atom
   runs the existing authorization-scope check inline, and `Builtin`/`Covenant` atoms are evaluated
   natively (`evaluate_builtin` / `evaluate_covenant`) — all with no WASM cost.
2. For a revealed `TemplateFunction` atom, the engine resolves the `LoadedTemplate`, runs
   `validate_spend_script_signature` (the authoritative T2 check from §3), assembles the call
   arg list as `[ args[0], …, args[n-1], encode(SpendContext) ]` — the positional bound args
   followed by the engine-injected context, exactly as `invoke_resource_access_hook` appends
   `auth_caller` — and invokes the predicate via the existing `invoke_template_function` path
   inside a **read-only restricted frame** (§6). The generated dispatcher decodes each slot
   positionally with `decode_exact::<T>`.
3. The restricted frame is not a freshly-constructed `PushCallFrame::Static`; instead the spend
   script's call frame is restricted **post-push** by `restrict_to_read_only`
   (`crates/engine/src/runtime/scope.rs`), which sets the frame's `read_only` flag and disables
   `allow_cross_template_calls` together, so the script can neither write state nor borrow the
   spender's badges via a cross-template call.
4. Returning normally authorises the spend. Any panic — a deliberate `assert!`/`panic!`
   rejection, out-of-gas, or an attempted state mutation (`WriteInReadOnlyContext`) — aborts it
   as `RuntimeError::SpendScriptRejected`, carrying the abort reason. Rejection is always a
   panic, never a return value.

#### 6. Read-only restricted execution mode (the sandbox)

A spend script is a **pure predicate**: it must not be able to mutate ledger state as a side
effect of being evaluated. Without this it would be a re-entrancy and consistency hazard — a
predicate that runs partway through validating a transfer could itself withdraw from a vault,
mint, or recall, and it would also be non-deterministic across fee-estimation / dry-run / block
re-execution. The restriction has two layers; the first is the load-bearing one.

**(a) A first-class read-only mode anchored on the lock layer.** Every state mutation in the
engine — vault withdraw/deposit, mint, recall, freeze, component-state writes, new-substate
creation — funnels through `write_lock_substate` / `get_*_mut` / `new_substate` on
`WorkingState` (e.g. vault `Withdraw` takes `write_lock_substate(SubstateId::Vault(..))`). A
`read_only` flag on the active `CallFrame`, set when a spend script is entered (checked via
`WorkingState::is_read_only_context`), makes **`write_lock_substate` (and `new_substate`) return
`RuntimeError::WriteInReadOnlyContext`**. This is a *whitelist-grade* guarantee against
mutation: because the write lock is the single chokepoint, blocking it neutralises every
mutating host op at once — including any future op — regardless of which `*_invoke` requested
it. A spend script may therefore call `vault_invoke(Withdraw)` directly on a hard-coded
`VaultId` (no cross-template call is needed to reach the `VaultInvoke` host op, so
`allow_cross_template_calls = false` alone does **not** stop it), but the underlying write lock
is refused and the spend fails.

**(b) An inline deny-list for the few effects that bypass the lock layer.** Host-op dispatch in
read-only context also runs `enforce_read_only_restrictions` (`crates/engine/src/runtime/impl.rs`) —
an inline guard, not a separate `RuntimeModule`. It rejects the non-lock-mediated effects and
sources of non-determinism with `RuntimeError::ForbiddenInReadOnlyContext { operation }`:
`call_invoke`, `generate_random_invoke`, `generate_uuid`, `emit_event`, and proof/bucket creation
(`proof_invoke` / `bucket_invoke`). This list is small and stable because layer (a) already covers
all state writes (template publication and any other substate-creating op is stopped there).

**Allowed (read-only / deterministic):** `spend_context_invoke`; `signature_invoke`
(`EngineOp 0x10` — Schnorr verification → hash-locks, m-of-n, adaptor conditions);
`consensus_invoke` (epoch); `emit_log`. In practice a spend script needs no substate access at all —
its world is the injected `SpendContext` plus pure host ops — so read-only here means "no writes";
even reads beyond `SpendContext` are unreachable without cross-template/method calls, which are
disabled.

Together, (a) + (b) make the predicate deterministic (no randomness; epoch is fixed for the
duration of execution) and provably side-effect-free.

#### 7. Metering and fees

Spend scripts reuse the existing WASM metering (`crates/engine/src/wasm/metering.rs`): points
are charged at `per_wasm_point_cost` and bounded by `MAX_WASM_POINTS_PER_CALL` per invocation
and `MAX_WASM_POINTS_PER_TRANSACTION` cumulatively. The **spender pays** for script execution,
as they do for every other instruction. A per-spend-script cap may be set stricter than the
generic per-call cap if profiling warrants it.

A condition leaf — including a `TemplateFunction` and its `args` — is **not** committed in the output;
under the MAST integration the output commits only a fixed-size `condition_root` (§9, §10). The leaf,
its Merkle inclusion proof, and any witness `data` blob are revealed in the **spend witness**
(`SpendWitness::ScriptPath`) at spend time, so their serialized size is charged to the **spender**.
`calc_stealth_statement_weight` (`crates/transaction/src/v1/transaction.rs`) reflects this:

```rust,ignore
// 100 base + 1·inputs + 8·outputs + (serialized spend-witness bytes / 3)
WEIGHT_PER_TRANSFER            // 100  (resource lock + balance-proof verification)
  + inputs.len()  * 1          // per-input commitment aggregation / lookup
  + outputs.len() * 8          // per-output range proof + ElGamal viewable-balance proof (dominant)
  + witness_bytes / 3          // serialized SpendWitness: revealed leaf + inclusion proof + data
```

So a large revealed leaf/args raises the *spending* transaction's weight (and fee), not the creating
one — a malformed or oversized leaf cannot be broadcast for free. Witness size is additionally bounded
by `STEALTH_LIMITS` (`crates/engine_types/src/limits.rs`): `max_witness_data_len` (4096),
`max_inclusion_proof_len` (32), and `max_conditions_per_conjunction` (16). Execution of a
`TemplateFunction` leaf at spend time is separately metered via WASM points (above), also against the
spender.

#### 8. Covenants: native leaves *and* a library pattern

Covenants are delivered **two** ways, which share their evaluation logic.

**Native `Covenant` leaves (the cheap, analyzable path).** A `Covenant` atom (§1) is evaluated
natively by the engine (`evaluate_covenant`, `crates/engine/src/runtime/impl.rs`), with no WASM cost:

- `OutputPreservesCondition` — recursive "stay in the vault": every stealth output must be re-locked
  under exactly the invoking `condition_root` (no key-path escape), and there must be at least one.
- `OutputTo { condition_root, min_value }` — "funds must flow to X": at least one output is locked
  under `condition_root` and promises at least `min_value`.
- `BalancePreserved(max_revealed)` — value-conservation: the invoking `condition_root` partition's
  committed value is conserved into outputs carrying that root, save for an exact cleartext outflow of
  at most `max_revealed` (zero = full conservation).

`BalancePreserved` is proven without revealing confidential values by a **`CovenantBalanceClaim`**
(`StealthTransferStatement.covenant_claims`): a Schnorr sub-balance proof over one input partition
(the inputs/outputs sharing a `condition_root`), keyed by `partition_input_index` and binding the
partition's `condition_root` into the signature so a claim cannot be validated against the wrong
partition. The engine verifies it via `validate_covenant_balance_proof`
(`crates/engine_types/src/crypto/covenant.rs`).

**`template_lib` helpers (the bespoke path).** For covenants that must also run custom logic, a
`TemplateFunction` predicate can assert the same properties through `SpendContext` helpers:

- `ctx.require_output_preserves_condition()` / `ctx.require_output_to(condition_root, min_value)` —
  back the `OutputPreservesCondition` / `OutputTo` predicates; the host and guest evaluate them
  identically through the shared `outputs_preserve_condition` / `has_output_to` functions.
- `ctx.require_timelock(unlock_epoch)` — absolute epoch lock (over `ctx.current_epoch()`).
- `ctx.require_balance_preserved()` / `ctx.require_balance_preserved_with_allowance(max_revealed)` —
  the value-conservation covenant, verified via the `AssertCovenantBalanced` host action (§4).

Authors reach for a native leaf when a standard constraint suffices, and a `TemplateFunction` only
when they need to compose it with bespoke predicate logic.

#### 9. Condition trees (MAST): committing to a set of alternative conditions

A single committed condition gates on exactly one predicate, in the clear. Many real conditions are
*disjunctions* — "spendable by the timelock path **or** the recovery-key path **or** the covenant
path" — and committing every alternative inline is both larger on-ledger and a privacy leak: it
discloses spend paths that are never exercised.

A **Merklized condition tree (MAST)** lets an output commit to a *set* of alternative spend
conditions under a single 32-byte root. The output stores only the root; at spend time the spender
reveals the one leaf they are exercising plus a Merkle inclusion proof, and the engine:

1. recomputes the root from the revealed leaf + proof and checks it equals the committed root, then
2. evaluates that single leaf via the §5 invocation path — T2 signature validation, the read-only
   sandbox and metering are all unchanged.

The unused alternatives are never revealed.

**Leaf format.** A leaf is `(id, payload)`: `id` is an encoding-version discriminant and `payload`
its body. `id = 0` (`SPEND_CONDITION_LEAF_ID`) is a Borsh-encoded `SpendCondition` (§1) — a flat
conjunction of `AccessRule` / `TemplateFunction` / `Builtin` / `Covenant` atoms. Reserving `id` keeps
the tree forward-compatible with a future breaking leaf encoding (`id = 1`) without changing the tree
structure.

**Tree construction (consensus-critical).** A canonical binary Merkle tree
(`crates/engine_types/src/stealth/condition_tree.rs`) with:

- **Domain separation** — distinct leaf and branch hash domains (`EngineHashDomainLabel::ConditionLeaf`
  / `ConditionBranch`, engine-domain Blake2b), so an internal node can never be reinterpreted as a
  leaf (second-preimage resistance).
- **Lexicographic pair ordering** — each branch hashes its two children in byte order, so an
  inclusion proof is a bare list of sibling hashes with **no left/right direction bits**.
- **Canonical set commitment** — leaf hashes are sorted and must be unique, so the root is a
  function of the *set* of leaves, independent of authoring order.
- **Promote-unpaired** — an odd node at a level is carried up unchanged; it is never duplicated,
  which would let a tree with a repeated node collide with a smaller tree's root (CVE-2012-2459).

A single-leaf tree's root is the leaf hash itself, with an empty proof, so the common one-script
case carries no proof overhead. Tree construction and proof verification are **native-only** (the
engine at spend time, the wallet at construction); a template never builds or verifies a tree, so no
hashing crosses into WASM. The inclusion proof — a `Vec<Hash32>` of sibling hashes — rides in the
spend witness and is weight-/metering-charged like any other spend data (§7).

The integration of this root into the committed output is **decided** (§10): the root is committed as
the `condition_root` carried in the output's `SpendAuthorization` — not an inline `SpendCondition`
field and not a taproot-style key tweak. This section specifies the tree and proof mechanism, which is
independent of that choice.

#### 10. Output spend model: `SpendAuthorization` (decided integration)

The decided committed model replaces the inline `SpendCondition` field on the stealth output with a
single `SpendAuthorization` field — an enum over the authorization key and the condition-tree root
(§9):

```rust,ignore
pub struct StealthUnspentOutput {
    pub output: UnspentOutput,  // commitment, sender nonce, encrypted data, minimum_value_promise, …
    pub auth: SpendAuthorization,
    pub tag: UtxoTag,
}

/// Modelled as an enum (not a pair of `Option`s) so the unspendable `{no key, no conditions}` state
/// is **unrepresentable** — by construction in memory and at the decode boundary, with no runtime
/// invariant to enforce.
pub enum SpendAuthorization {
    /// Key path only: a one-time stealth public key, spendable by a signature.
    #[n(0)] Key(#[n(0)] RistrettoPublicKeyBytes),
    /// Script path only: the condition-tree root (§9).
    #[n(1)] Script(#[n(0)] Hash32),
    /// Either path is admissible; the per-input `SpendWitness` selects which.
    #[n(2)] KeyAndScript { #[n(0)] spend_key: RistrettoPublicKeyBytes, #[n(1)] condition_root: Hash32 },
}
```

- **Invariant.** The unspendable (burn) output is **unrepresentable** — `SpendAuthorization` has no
  `{no key, no conditions}` variant — so no creation-time check is needed (contrast the earlier
  two-`Option` draft, which had to reject `{None, None}` at creation).
- `Key(..)` is a pure payment **or** — once the deferred tweak below lands — a tweak-hidden condition;
  these share a single anonymity set.
- `Script(..)` / `KeyAndScript { .. }` is a **transparent, introspectable** condition set / covenant,
  and is therefore a deliberately distinguishable class (see the rationale).

**Witness-driven spends.** Each spent input (`StealthInput`) carries a `SpendWitness` that selects the
spend path; the committed `SpendAuthorization` only gates which witnesses are *admissible*, and the
spender always chooses:

| Witness | Admissible when `auth` has | Checked |
|---|---|---|
| `KeyPath` | a `spend_key` (`Key` / `KeyAndScript`) | a signature under `spend_key` |
| `ScriptPath { leaf, proof, data }` | a `condition_root` (`Script` / `KeyAndScript`) | recompute the root from `leaf` + `proof` and check it equals the committed `condition_root` (§9), then evaluate `leaf` via §5; `data` is the spender-supplied blob the leaf interprets |

The `data` blob is **not** committed in `condition_root` (only the leaf is), so it cannot change which
predicate runs, only satisfy one — a hashlock reads it as raw bytes (and must be the sole consumer in
its leaf), a `TemplateFunction` reads it via `SpendContext::data`. (`SpendWitness` reserves index
`#[n(2)]` for the deferred `ScriptPathTweaked` variant below.)

Because the spender chooses the witness, "script-only" (no key path) must be enforced
*cryptographically* — by committing `Script(root)` rather than `KeyAndScript { .. }` (or, for the
deferred hidden case, a NUMS key whose discrete log is unknown) — never by assuming the spender will
decline the key path.

**Mapping the former conditions.** The old `Signed` condition becomes the key path
(`SpendAuthorization::Key`); `AccessRule`, `TemplateFunction`, the new `Builtin` and `Covenant` are
**sibling atom kinds** in a `SpendCondition` leaf carried as an `id = 0` leaf under a `condition_root`.
The §2–§8 mechanism — ABI, T2 signature validation, the read-only sandbox, metering, and the covenant
helpers — applies to the *revealed leaf*. Accordingly the `Outputs` introspection view (§4) exposes
each output's `auth: SpendAuthorization` in place of a single `SpendCondition`.

**Deferred: key-path / script-path tweak.** A Taproot-style key tweak — folding the root into the
spend key as `Q = P + H_tweak(P‖root)·G` so a script-bearing output is indistinguishable from a plain
payment — is intentionally **deferred, not discarded**. It is additive: reserve a `ScriptPathTweaked`
`SpendWitness` variant (the reserved `#[n(2)]` slot) and accept a tweaked `Key`-path output, opt-in
per output, with no format break. A NUMS internal key is needed only for the hidden-and-condition-only
case, and the tweak hash MUST bind `P` (`H_tweak(P‖root)`) or forgery is trivial. Why the field ships
first — and why the tweak is not needed for covenants — is in the Rationale ("Why a committed
`condition_root` field, not a key-path tweak").

### API changes

- `tari_template_lib_types`: the output's committed `auth: SpendAuthorization` field (`Key` /
  `Script` / `KeyAndScript`, §10) replacing the inline `SpendCondition`; the repurposed
  `SpendCondition` leaf (a flat conjunction) and its `AtomicCondition` atom kinds (`AccessRule` /
  `TemplateFunction` / `Builtin(BuiltinPredicate)` / `Covenant(Covenant)`), plus `HashAlg`;
  `SpendWitness` (`KeyPath` / `ScriptPath { leaf, proof, data }`) and `MerkleProof` (pure data, no
  hashing — §9); `CovenantBalanceClaim` on `StealthTransferStatement`; the `SpendContext` view types
  (`StealthInputView` / `StealthOutputView` / `CurrentInputView`). TS bindings regenerated
  (hand-edited per project convention).
- `tari_template_abi`: new `EngineOp::SpendContextInvoke = 0x11` and `SignatureInvoke = 0x10`;
  `SpendContextAction` enum.
- `tari_template_lib`: `SpendContext` API + covenant/timelock helpers
  (`crates/template_lib/src/spend_context.rs`); the `#[template(stateless)]` macro option
  (`crates/template_macros`).
- `tari_engine`: `read_only` `CallFrame` mode (`restrict_to_read_only`) + `write_lock_substate` /
  `new_substate` guard; `validate_spend_script_signature` (T2 only);
  `RuntimeInterface::spend_context_invoke`; the inline `enforce_read_only_restrictions` deny-list;
  native `evaluate_builtin` / `evaluate_covenant`; `verify_input_authorizations` /
  `evaluate_condition_leaf` enforcement; new `RuntimeError` variants (`SpendScriptRejected`,
  `WriteInReadOnlyContext`, `ForbiddenInReadOnlyContext`, `SpendConditionNotMet`,
  `SpendContextUnavailable`).
- `tari_engine_types`: MAST condition-tree primitive (§9) — `MerkleTree`, `MerkleProof`, the
  `ConditionLeaf`/`ConditionBranch` hash domains and inclusion-proof verification
  (`crates/engine_types/src/stealth/condition_tree.rs`); the native hashlock digest
  (`stealth/hashlock.rs`); and the covenant balance-proof verifier
  (`crypto/covenant.rs::validate_covenant_balance_proof`).
- `tari_ootle_transaction`: `calc_stealth_statement_weight` charges the serialized spend-witness bytes
  (revealed leaf + inclusion proof + `data`) at `witness_bytes / 3` to the spender, with outputs at a
  flat weight 8 each (`crates/transaction/src/v1/transaction.rs`); `STEALTH_LIMITS`
  (`crates/engine_types/src/limits.rs`) bounds per-witness and per-transaction sizes.
- Wallet (`crates/wallet/ootle-rs/src/stealth/`): `Output::with_spend_script(TemplateFunction)` and
  `Output::with_spend_conditions(Vec<SpendCondition>)` via the `PayTo` enum
  (`StealthPublicKey` / `AccessRule` / `TemplateFunction` / `Conditions`) build the condition tree and
  the output's `SpendAuthorization`.

## Rationale

### Why reuse the AuthHook pattern instead of a new VM

The engine already invokes engine-chosen, restricted, stateless predicates: the resource
`AuthHook` (`invoke_resource_access_hook`, `impl.rs:292`; signature-validated at
`check_resource_auth_hook`, `impl.rs:404`). It is validated to be `is_mut == false`, has a
fixed argument signature, runs by re-entering `TransactionProcessor::call_*` via the runtime
pointer, and signals denial by aborting. A spend script is the same shape with a different
trigger (stealth-transfer validation) and a different injected context (transaction
introspection rather than `AuthHookCaller`). Reusing this path avoids a second execution
engine, a new bytecode/VM, and a separate metering/fee story — and inherits the existing
determinism and sandboxing primitives (`allow_cross_template_calls`, the runtime-call module
hook, WASM points).

A dedicated bytecode language (Bitcoin Script / Simplicity / Miniscript) was considered and
rejected for v1: it would duplicate tooling, demand its own interpreter and cost model, and
deliver a strict subset of what a sandboxed WASM function already expresses. The WASM
restriction set gives the same safety properties (bounded, deterministic, side-effect-free)
without the second toolchain.

### Why native covenant leaves *and* a spend script (the deferral, reversed)

A covenant is a constraint on the *outputs a spend produces*. With `ctx.outputs()` exposing each
output's committed `auth: SpendAuthorization`, and `CurrentInput` exposing the predicate's own
`condition_root`, a `TemplateFunction` predicate can assert "every output carries the same condition I
do" — a recursive covenant — purely as predicate logic. Output-introspection is the one capability
that collapses "script" and "covenant" into a single mechanism (it is exactly what Bitcoin
historically lacked and what CTV/APO/Simplicity add). So a covenant *can* be expressed by a spend
script alone, and on expressiveness grounds a separate covenant field is redundant.

An earlier draft therefore deferred a declarative covenant field, listing three needs that would
justify one. **All three turned out to matter, so the field was added** as the native `Covenant` atom
(§1, §8):

1. **Cheap covenant + native authorization.** A `TemplateFunction` leaf folds the covenant into WASM
   and is metered per spend. A native `Covenant` atom — conjoined in a `SpendCondition` leaf with a
   native `AccessRule` or with the key path — pairs authorization and covenant with **no WASM cost**.
2. **Off-chain analyzability.** The declarative `OutputPreservesCondition` / `OutputTo` /
   `BalancePreserved` variants can be read and explained by wallets/indexers without executing
   arbitrary WASM; an opaque predicate cannot.
3. **Engine-enforced propagation.** Native evaluation (`evaluate_covenant`) and the
   `CovenantBalanceClaim` value-conservation proof make propagation and conservation an **engine
   guarantee**, not something each script author must recurse correctly to uphold.

The two mechanisms are kept orthogonal: a `Covenant` atom says "what the spend must produce", an
`AccessRule`/key path says "who may spend", and a leaf may conjoin them. The `template_lib` helpers
remain for covenants that must also run bespoke `TemplateFunction` logic, sharing the same evaluation
code as the native path so host and guest agree.

### Why "current transfer statement" introspection scope

Whole-transaction introspection (every instruction's outputs / the final substate diff,
Bitcoin-style) is strictly more powerful but the final substate set is not known until
`finalize`, forcing a two-phase or deferred-check evaluation model. The current
`StealthTransferStatement` already contains the inputs and outputs of the transfer being
authorized — the natural and sufficient scope for confidential-transfer covenants — and it is
in hand at the existing validation point with zero extra plumbing. Whole-transaction scope can
be a later extension if a concrete use case demands it.

### Why a committed `condition_root` field, not a key-path tweak

Bitcoin Taproot folds the script-tree root into the output key via a tweak `Q = P +
H_tweak(P‖root)·G`, because a P2TR output *is* a single 32-byte key with nowhere else to put the
commitment. Ootle outputs are structs, so the root can be a first-class field — which pays off in two places:
wallet scanning and covenants.

The decisive reason is **wallet scanning**. A wallet recognises its own outputs by the published
one-time key: it derives the expected `P' = H(v·N)·G + S` from the sender nonce `N` and compares it
to the output's `spend_key`. A tweak publishes `Q = P + H_tweak(P‖root)·G` instead, and recovering
`P` requires `root` — precisely what the tweak hides. Empty-root (pure-payment) outputs stay
recognisable, but a script-bearing output sent to a wallet is invisible to this check: the sender
must carry `root` in the output's encrypted data and the wallet must decrypt to recover it. Worse,
because payment and script outputs are indistinguishable by design, the wallet cannot tell which is
which up front, so — absent a view tag — it must trial-decrypt every output that fails the
payment-key check. A committed `spend_key` keeps recognition identical to today's stealth scan for
every output, script-bearing or not, with `root` readable in the clear.

A second reason is **covenant introspectability**. With a tweak the root is hidden inside `Q`,
entangled with the output's one-time internal key `P`, which is **not published** (only `Q` is). A
covenant constraining a freshly-created child output therefore cannot read that child's root: it
must either compare the whole published `Q` — which forces every covenant output to reuse an
identical key (linkable, single-recipient) — or have the spender supply each output's one-time `P`
as extra witness and recompute `Q` through a native host op (feasible, since `P` is a throwaway
stealth key, but extra plumbing on every check). A committed `condition_root` field publishes the
root directly: the covenant reads it as plain data, with no key and no reconstruction, while each
output keeps an independent spend key.

This is **not** a WASM-cost argument. The tweak's elliptic-curve reconstruction would run in native
engine code — a host op, exactly like the other `SpendContext` host ops — and never executes inside
the WASM sandbox. The obstacle is solely that the root is unreadable behind an unpublished per-output
key, regardless of where the curve arithmetic runs.

Reinforcing reasons:

- **No single-key constraint.** Unlike P2TR, we are not forced to fold everything into one key; a
  struct field is available.
- **No multiparty need.** The tweak's unique payoff — composing additively with MuSig / key
  aggregation and adaptor signatures — is not on the roadmap, and key-path spends and adaptor swaps
  already operate on the `spend_key` point without it.
- **Cheap and non-breaking.** A committed `condition_root` (a `SpendAuthorization` enum variant) is a
  plain struct/enum field, versus consensus-critical EC verification plumbing.

The accepted cost is that a key-only `SpendAuthorization::Key` output is distinguishable from a
script-bearing `Script` / `KeyAndScript` one, so transparent-covenant outputs are a distinguishable
class (hidden only within the `Key` population). The tweak remains available later (§10) for the `Key`
case if hidden scripts or multiparty become priorities.

### Privacy

Scripts see commitments, spend conditions, tags and `minimum_value_promise` — never plaintext
confidential values. This matches what the balance proof and existing validation already
operate on, so spend scripts add no information leakage beyond what the output structure
already exposes on-ledger.

## Backwards Compatibility

The §10 output model is a **breaking re-encoding** of the stealth output: the inline
`SpendCondition` field is removed in favour of a single `auth: SpendAuthorization` field (`Key` /
`Script` / `KeyAndScript`), and the `SpendCondition` type itself is repurposed as the condition-tree
leaf payload — now a flat conjunction of `AtomicCondition` atoms (`AccessRule` / `TemplateFunction` /
`Builtin` / `Covenant`), with the former `Signed` variant dropped (it becomes the `Key` path). Existing
`Signed`/`AccessRule` outputs therefore do **not** decode unchanged. Ootle is pre-launch with no live
network, so this breaking change is acceptable and requires no migration of stored substates — there
is no prior on-ledger data to preserve. `AccessRule` retains its inline, WASM-free evaluation (now as a
condition-tree atom), and a key-path spend keeps the existing signature check.

## Test Cases

Engine tests (`crates/engine/tests/stealth.rs` is the existing home for spend-condition tests):

1. **Timelock** — both paths: a native `Builtin(AfterEpoch(E))` leaf and a
   `TemplateFunction(timelock, unlock_epoch=E)` leaf; spend at epoch `< E` is rejected, at `>= E`
   succeeds.
2. **Recursive covenant** — both paths: a native `Covenant(OutputPreservesCondition)` leaf and a
   "preserve spend condition" script; a spend whose outputs are re-locked under the same
   `condition_root` succeeds; a spend that changes or key-escapes an output is rejected.
3. **Hash/sig lock** — a native `Builtin(HashLock)` leaf satisfied by the witness `data` preimage;
   and a script requiring a Schnorr signature via `signature_invoke`. Valid preimage/signature
   spends, invalid/missing rejects.
4. **Read-only enforcement** — a script that calls `vault_invoke(Withdraw)` (or otherwise
   triggers `write_lock_substate` / `new_substate`) fails with `WriteInReadOnlyContext` →
   `SpendScriptRejected`, and crucially leaves the targeted vault unchanged. Covers the
   "directly reach a host op without a cross-template call" attack.
5. **Sandbox deny-list** — a script attempting `call_invoke`, `generate_random_invoke`,
   `emit_event`, or proof/bucket creation aborts with `ForbiddenInReadOnlyContext` →
   `SpendScriptRejected`.
6. **Malformed predicate rejected at spend (T2)** — a revealed `TemplateFunction` leaf naming a
   missing function, a mutable (`is_mut == true`) function, a non-unit return, a missing
   `SpendContext` arg, or malformed `args` CBOR fails `validate_spend_script_signature` and rejects
   the *spend* (the output stays unspent). There is no creation-time rejection: the leaf is hidden in
   the MAST at creation, so this risk is a wallet-side construction concern.
7. **Determinism / metering** — a script that exceeds `MAX_WASM_POINTS_PER_CALL` fails with
   `SpendScriptRejected`; fees charged to the spender are observable in the receipt.
8. **Signature-binding** — a spender cannot substitute a different `{template, function, args}`
   than the one committed in the revealed leaf.
9. **Value constraint** — `Covenant(OutputTo { condition_root, min_value })` (and the
   `require_output_to` helper) enforced over `ctx.outputs()`.
10. **Value conservation** — `Covenant(BalancePreserved(max_revealed))` with a `CovenantBalanceClaim`:
    a partition that conserves committed value (with cleartext outflow ≤ `max_revealed`) spends; an
    over-revealed or unbalanced partition, or a claim bound to the wrong `condition_root`, is rejected.
11. **Weight** — a script-path spend revealing a large leaf/`args` raises the *spending* transaction's
    weight (and fee) proportionally via `witness_bytes / 3`, versus an equivalent key-path spend.
12. **Conjunction** — an `All`-style leaf (a multi-atom `SpendCondition`) requires every atom to hold;
    a non-empty/flat structure is enforced and an empty or over-large conjunction is rejected.
13. **Condition tree (MAST)** — an output committing to a multi-leaf condition root spends by
    revealing one leaf + inclusion proof: a valid proof for a committed leaf spends and evaluates that
    leaf; a proof for a non-committed leaf, a tampered sibling, or a wrong root is rejected. A
    single-leaf tree has an empty proof and its root equals the leaf hash. The root is independent of
    leaf authoring order, and leaf/branch domain separation prevents an internal node from being
    passed off as a leaf.

## Implementation

Suggested phasing (spec/rationale first, per TIP process):

1. Types + ABI: the `SpendAuthorization` output model; `SpendCondition` (conjunction) and its
   `AtomicCondition` atoms (`AccessRule` / `TemplateFunction` / `Builtin` / `Covenant`); `SpendWitness`
   (`KeyPath` / `ScriptPath { leaf, proof, data }`); `CovenantBalanceClaim`;
   `EngineOp::SpendContextInvoke` + `SpendContextAction`; view types; TS bindings;
   `calc_stealth_statement_weight` charging spend-witness bytes; `STEALTH_LIMITS`.
2. Read-only mode foundation: `read_only` flag on `CallFrame` (`restrict_to_read_only`);
   `WriteInReadOnlyContext` guard on `write_lock_substate` / `get_*_mut` / `new_substate`.
   (Independently useful — also the basis for any future read-only/view transaction.)
3. Engine: the MAST `verify_inclusion` gate; `validate_spend_script_signature` (T2) in
   `evaluate_condition_leaf`; native `evaluate_builtin` / `evaluate_covenant` +
   `validate_covenant_balance_proof`; `spend_context_invoke`; the inline
   `enforce_read_only_restrictions` deny-list; new `RuntimeError` variants (`SpendScriptRejected`,
   `WriteInReadOnlyContext`, `ForbiddenInReadOnlyContext`, `SpendConditionNotMet`,
   `SpendContextUnavailable`).
4. `template_lib`: `SpendContext` + covenant/timelock helpers; the `#[template(stateless)]` macro.
5. Wallet builder support (`PayTo`, `with_spend_script` / `with_spend_conditions`).
6. Tests above; docs/examples (a `vault`/`timelock` example template).

The complementary authoring-ergonomics change — a `#[template(stateless)]` macro option that lets a
template expose only stateless functions with no component — is **implemented** in the tari-ootle
repository (`crates/template_macros`). It is not required for this proposal (a spend script is just a
receiver-less function), but it makes the §2 example valid as written.

## References

All `crates/...` paths refer to the
[tari-ootle repository](https://github.com/tari-project/tari-ootle).

- `crates/template_lib_types/src/stealth/unspent_output.rs` — `SpendAuthorization`,
  `SpendCondition` / `AtomicCondition`, `TemplateFunction`, `BuiltinPredicate`, `Covenant`.
- `crates/template_lib_types/src/stealth/spend_witness.rs` — `SpendWitness`, `MerkleProof`;
  `statement.rs` — `StealthTransferStatement`, `CovenantBalanceClaim`; `spend_context.rs` — the views.
- `crates/engine/src/runtime/working_state.rs` — `validate_and_spend_stealth_utxos`,
  `is_read_only_context`, the `write_lock_substate` / `new_substate` read-only guard.
- `crates/engine/src/runtime/impl.rs` — `verify_input_authorizations`,
  `verify_script_path_authorization`, `evaluate_condition_leaf`, `validate_spend_script_signature`,
  `evaluate_builtin`, `evaluate_covenant`, `spend_context_invoke`, `enforce_read_only_restrictions`,
  and `invoke_resource_access_hook` / `check_resource_auth_hook` (the AuthHook precedent this design
  mirrors).
- `crates/engine/src/runtime/scope.rs` — `CallFrame.read_only` / `allow_cross_template_calls`,
  `restrict_to_read_only`.
- `crates/template_abi/src/ops.rs` — `EngineOp::SpendContextInvoke` (0x11) / `SignatureInvoke` (0x10);
  `crates/template_abi/src/template_def.rs` — `FunctionDef.is_mut`.
- `crates/template_lib/src/spend_context.rs` — author-facing `SpendContext` + covenant helpers;
  `crates/template_lib/src/args/types.rs` — `SpendContextAction`.
- `crates/engine/src/wasm/metering.rs` — WASM metering; `crates/engine_types/src/limits.rs` —
  `STEALTH_LIMITS`; `crates/transaction/src/v1/transaction.rs` — `calc_stealth_statement_weight`.
- `crates/engine_types/src/stealth/condition_tree.rs` — reference MAST implementation (tree
  construction, `ConditionLeaf`/`ConditionBranch` domain-separated hashing, `verify_inclusion`, §9);
  `stealth/hashlock.rs` — native hashlock digest; `crypto/covenant.rs` —
  `validate_covenant_balance_proof`.
- Bitcoin CTV (BIP-119), `SIGHASH_ANYPREVOUT` (BIP-118), Simplicity — prior art on
  transaction introspection and covenants. Taproot / MAST (BIP-341) — prior art on committing to a
  tree of alternative scripts and revealing only the path taken.

## Copyright

This document is released under the BSD 3-Clause License.

## Change History

### 2026-06-17

* Document created in the (now-superseded) `tari-project/tips` repository as TIP-0006
  ([tari-project/tips#6](https://github.com/tari-project/tips/pull/6)).

### 2026-06-22

* Migrated to the `tari-project/rfcs` repository. Renumbered TIP-0006 → TIP-0007 (TIP-0006 was
  already claimed in this repository) and reformatted to the TIP-0001 header preamble.
* [Pull Request #180](https://github.com/tari-project/rfcs/pull/180)

### 2026-06-24

* Aligned the specification with the implemented design on the tari-ootle
  `engine-utxo-mast-execution` branch:
  * Output model is a single `SpendAuthorization` enum (`Key` / `Script` / `KeyAndScript`) that makes
    the unspendable state unrepresentable, replacing the two-`Option` (`spend_key` / `condition_root`)
    draft.
  * A `SpendCondition` leaf is a flat, non-empty conjunction of `AtomicCondition` atoms.
  * **Reversed the covenant deferral**: added native `BuiltinPredicate` (timelock/hashlock) and
    `Covenant` (output-preservation / value-routing / value-conservation) atoms, plus the
    `CovenantBalanceClaim` Schnorr value-conservation proof — superseding the "covenants as a library
    pattern only" framing.
  * **Removed creation-time (T1) predicate validation**: the MAST commits only the `condition_root`, so
    a `TemplateFunction` leaf is validated only at spend time (T2).
  * Added the spend-witness `data` blob; corrected the MAST naming
    (`condition_tree.rs`, `ConditionLeaf`/`ConditionBranch`), the host-op actions, the sandbox
    deny-list (`enforce_read_only_restrictions`, not a `RuntimeModule`), the weight charge
    (spend-witness bytes to the spender), and the `RuntimeError` variants.
