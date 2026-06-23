# P-TIP-RFC-7: Spend-Time Scripts for Ootle Stealth UTXOs

| TIP           | [P-TIP-RFC-7](#p-tip-rfc-7-spend-time-scripts-for-ootle-stealth-utxos)            |
|---------------|----------------------------------------------------------------------------------|
| Title         | Spend-time scripts for Ootle stealth UTXOs (script-capable spend conditions)     |
| Last Modified | 2026-06-22                                                                       |
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
(including each output's own committed condition), and revealed amounts, together with transaction
context (signer public keys and the current epoch). The predicate runs in a sandboxed execution mode
that forbids state mutation, cross-template calls and non-determinism, modelled directly on the
engine's existing resource `AuthHook` mechanism.

Second, it restructures how a condition is committed. The inline `SpendCondition` field is removed;
an output is authorised by a **key path** (a `spend_key`, the signature condition) and/or a
**condition tree** — a Merklized set (MAST) of alternative `SpendCondition` leaves committed under a
`condition_root`, of which a `TemplateFunction` predicate is one leaf kind alongside `AccessRule`
(§9, §10). The spender reveals only the leaf they exercise.

Because a `TemplateFunction` predicate can read the spending transaction's outputs and its own
invoking condition, it subsumes covenants: a covenant is simply a predicate that asserts properties
of the outputs it produces, including (recursively) that an output commits the same condition. This
TIP therefore does **not** introduce a separate covenant field; covenants are delivered as
`template_lib` helper patterns over a `TemplateFunction` leaf. A dedicated declarative covenant field
is explicitly deferred (see [Rationale](#rationale)).

## Motivation

Ootle stealth UTXOs currently support exactly two spend conditions
(`crates/template_lib_types/src/stealth/unspent_output.rs:65`):

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
(`crates/template_lib/src/resource/manager.rs:548`) which the engine dispatches via
`ResourceAction::StealthTransfer`. Inside the engine this reaches
`WorkingState::validate_and_spend_stealth_utxos`
(`crates/engine/src/runtime/working_state.rs:292`), which locks each input UTXO and calls
`validate_spend_condition` (`:321`) per input. That function is the sole enforcement point and
is where a `TemplateFunction` condition is evaluated.

Critically, `validate_and_spend_stealth_utxos` already holds the entire
`StealthTransferStatement` — so all data a script needs to introspect is in scope at the point
of validation; no new plumbing of transaction data is required.

### Technical Details

#### 1. The `SpendCondition` enum (repurposed as the condition-tree leaf)

`crates/template_lib_types/src/stealth/unspent_output.rs`:

```rust,ignore
/// A spend condition is no longer an inline UTXO field; it is the v0 leaf payload of the
/// condition tree (§9). The key path (`spend_key`, §10) is the signature condition, so the
/// former `Signed` variant is removed.
pub enum SpendCondition {
    #[n(0)]
    AccessRule(#[n(0)] AccessRule),
    /// Spend is gated on a stateless WASM predicate over the spending transfer.
    #[n(1)]
    TemplateFunction(#[n(0)] TemplateFunction),
}

#[derive(Debug, Clone, Encode, Decode, CborLen, PartialEq, Eq)]
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
```

A `TemplateFunction` condition fully commits `{template, function, args}`, so a spender cannot
substitute a different predicate. `args` lets one template function serve as a parameterised
predicate family (e.g. a single `timelock` function bound with different unlock epochs per output).

> **Committed output model (decided).** The output does not store an inline `SpendCondition`. The
> decided integration (§10) replaces that field with two committed fields, `spend_key` and
> `condition_root`, where `condition_root` is the root of a condition tree (§9) whose leaves are
> `SpendCondition` values. §1–§8 describe the per-predicate mechanism, which is unchanged; it now
> applies to the leaf reached via the script-path witness. A leaf with `id = 0` carries a
> Borsh-encoded `SpendCondition` (this enum).

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
`SpendContext` argument — and the two points at which it is enforced are specified in §3. (The
`#[template(stateless)]` form is a proposed authoring convenience; the predicate can equally be
written as a receiver-less function on a normal `#[template]` struct.)

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

The signature is validated at **two** points, which answer different questions:

**(T2) Spend time — authoritative, mandatory.** Immediately before invoking, the engine
re-resolves the `LoadedTemplate`, fetches the `FunctionDef`, and runs
`validate_spend_script_signature`. This is the security gate and cannot be skipped: a revealed
leaf condition is untrusted data supplied by the spender, so the engine must not assume any
earlier node validated it. Were this omitted, a malformed condition could drive the engine to
call an `is_mut == true` function (acquiring a write lock inside a supposedly read-only
predicate), call a non-existent function, or misinterpret a non-unit return. A failure here
rejects the spend (`SpendScriptRejected`); the output remains unspent.

**(T1) Creation time — mandatory.** When a transaction *creates* an output committing a
`TemplateFunction` condition (as a condition-tree leaf) — whether the genesis output or a covenant
continuation produced by a spend — the engine resolves the referenced template, runs the same
`validate_spend_script_signature`, and checks that `args` has one well-formed-CBOR element per bound parameter (`args.len() == func.arguments.len() - 1`), and **rejects
the creating transaction** if any of these fail. This mirrors `check_resource_auth_hook`, which
validates an auth hook when the resource is created. The purpose is to make malformed
conditions un-creatable rather than discovered later as **permanently locked funds**: a typo'd
function name or wrong signature surfaces to the output's *creator* at construction, not to the
*recipient* when they first try (and fail) to spend.

Because templates are **immutable, permanent, global substates** — `SubstateId::Template` is
`is_read_only`/`is_global` (`crates/engine_types/src/substate.rs:337`) and no removal or
deactivation path exists — a signature that validates at T1 is guaranteed to still validate at
T2. T1 validation is therefore a durability guarantee, not merely advisory, and there is no
"template not yet published" skip case analogous to the auth hook's
component-may-not-exist-yet handling (`impl.rs:300-316`): a `TemplateFunction` condition references
a pre-existing published template, so creation requires it to already resolve.

> Limitation: as with any instruction argument, the host can verify the function *shape*, the
> `args` element count, and that each element is well-formed CBOR, but it cannot fully
> type-check an element against its declared parameter type — that conformance is enforced at
> the WASM deserialization boundary (the dispatcher's `decode_exact::<T>` per arg,
> `crates/template_macros/src/template/dispatcher.rs`), where a mismatch panics and (at T2)
> rejects the spend.

#### 4. Introspection host op (`SpendContext`)

Add one `EngineOp` (`crates/template_abi/src/ops.rs:27`), e.g.
`SpendContextInvoke = 0x11`, dispatched to a new `RuntimeInterface` method
`spend_context_invoke(action: SpendContextAction) -> InvokeResult`. **Scope: the current
transfer statement only** (per design decision; see Rationale). Read-only actions:

| Action | Returns |
|---|---|
| `Inputs` | `Vec<StealthInputView>` — commitments being spent, + `revealed_amount` |
| `Outputs` | `Vec<StealthOutputView>` — each output's `commitment`, `minimum_value_promise`, `spend_key`, `condition_root`, `UtxoTag` |
| `CurrentInput` | index + commitment of the input whose condition is executing |
| `InvokingCondition` | the `SpendCondition::TemplateFunction(..)` leaf that invoked this predicate (enables recursive covenants) |
| `Signers` | transaction signer public keys (already reachable via `CallerContextInvoke`) |
| `Epoch` | current epoch (already reachable via `ConsensusInvoke` → timelocks) |

These views expose only data already present in `StealthTransferStatement` +
`AuthorizationScope` + consensus context. Confidential *values* remain hidden (only
commitments and `minimum_value_promise` are visible), preserving the privacy model — a script
reasons about commitments and spend conditions, not plaintext amounts, exactly as the balance
proof does.

#### 5. Invocation flow

Evaluation is hoisted to the `RuntimeInterfaceImpl` layer (`crates/engine/src/runtime/impl.rs`),
where the template provider (`self.template_provider`) and the re-entrant runtime pointer
already live — this is precisely how `invoke_resource_access_hook` (`impl.rs:292`) works today. For
a `condition_root` output (§10) the leaf to evaluate is the one named by the input's script-path
witness, its inclusion in the root having been verified first (§9); the flow below then runs for that
single leaf.

1. `validate_and_spend_stealth_utxos` resolves, per input, the spend path from its witness: a
   key-path witness is checked as a signature against `spend_key`; a revealed `AccessRule` leaf runs
   the existing authorization-scope check inline (no WASM cost).
2. For a revealed `TemplateFunction` leaf, the engine resolves the `LoadedTemplate`, re-runs
   `validate_spend_script_signature` (the authoritative T2 check from §3), assembles the call
   arg list as `[ args[0], …, args[n-1], encode(SpendContext) ]` — the positional bound args
   followed by the engine-injected context, exactly as `invoke_resource_access_hook` appends
   `auth_caller` — and invokes the predicate via the existing `invoke_template_function` path
   (`impl.rs:382`) inside a **read-only restricted frame** (§6). The generated dispatcher
   decodes each slot positionally with `decode_exact::<T>`.
3. The restricted frame is a `PushCallFrame::Static` (`crates/engine/src/runtime/scope.rs`)
   with `read_only = true`, `allow_cross_template_calls = false`, and an **empty authorization
   scope** (the script must not borrow the spender's badges).
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
`WorkingState` (e.g. vault `Withdraw` takes `write_lock_substate(SubstateId::Vault(..))`,
`impl.rs:1648`). A `read_only` flag on the active `CallFrame`, set when a spend script is
entered, makes **`write_lock_substate` (and `new_substate`) return
`RuntimeError::WriteInReadOnlyContext`**. This is a *whitelist-grade* guarantee against
mutation: because the write lock is the single chokepoint, blocking it neutralises every
mutating host op at once — including any future op — regardless of which `*_invoke` requested
it. A spend script may therefore call `vault_invoke(Withdraw)` directly on a hard-coded
`VaultId` (no cross-template call is needed to reach the `VaultInvoke` host op, so
`allow_cross_template_calls = false` alone does **not** stop it), but the underlying write lock
is refused and the spend fails.

**(b) A `SpendScriptGuardModule` deny-list for the few effects that bypass the lock layer.**
Every host op also funnels through `invoke_modules_on_runtime_call(..)`
(`crates/engine/src/runtime/module.rs`). The module rejects the non-lock-mediated effects and
sources of non-determinism: `call_invoke`, `generate_random_invoke`, `generate_uuid`,
`publish_template`, `pay_fee`, `emit_event`, and proof/bucket creation. This list is small and
stable because layer (a) already covers all state writes.

**Allowed (read-only / deterministic):** `spend_context_invoke`; `signature_invoke`
(`EngineOp 0x10` — Schnorr verification → hash-locks, m-of-n, adaptor conditions);
`consensus_invoke` (epoch); `caller_context_invoke` (signers); `emit_log`. In practice a spend
script needs no substate access at all — its world is the injected `SpendContext` plus pure
host ops — so read-only here means "no writes"; even reads beyond `SpendContext` are
unreachable without cross-template/method calls, which are disabled.

Together, (a) + (b) make the predicate deterministic (no randomness; epoch is fixed for the
duration of execution) and provably side-effect-free.

#### 7. Metering and fees

Spend scripts reuse the existing WASM metering (`crates/engine/src/wasm/metering.rs`): points
are charged at `per_wasm_point_cost` and bounded by `MAX_WASM_POINTS_PER_CALL` per invocation
and `MAX_WASM_POINTS_PER_TRANSACTION` cumulatively. The **spender pays** for script execution,
as they do for every other instruction. A per-spend-script cap may be set stricter than the
generic per-call cap if profiling warrants it.

A `TemplateFunction` leaf — `template`, `function`, and especially `args` — is committed into the
output created by a `StealthTransfer` instruction, so its serialized size **must contribute to the
creating transaction's weight**. Today `calc_stealth_statement_weight`
(`crates/transaction/src/v1/transaction.rs:284`) weights stealth outputs by count only
(`100 + inputs + outputs * 2`) and never inspects the bytes inside an output; this proposal
extends it so each output additionally contributes the byte length of its committed condition data
(notably `TemplateFunction` `args`). Without this, a large script/args could be broadcast for free and
used to bloat outputs. The **creator** pays this weight at creation time; the persisted bytes
are separately charged per-byte storage at substate creation, and execution at spend time is
metered via WASM points (above) against the **spender**.

#### 8. Covenants as a library pattern

No engine covenant field is added. `template_lib` ships helpers built on `SpendContext`:

- `ctx.require_output_preserves_condition()` — recursive "stay in the vault" covenant.
- `ctx.require_timelock(unlock_epoch)` — absolute epoch lock.
- `ctx.require_output_to(spend_condition, min_value)` — "funds must flow to X".

These are thin wrappers asserting over `ctx.outputs()` / `ctx.invoking_condition()`. Authors
compose them; the engine treats them as ordinary predicate logic.

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
its body. `id = 0` is a Borsh-encoded `SpendCondition` (§1) — i.e. an `AccessRule` or a
`TemplateFunction`. Reserving `id` keeps the tree forward-compatible with a future breaking leaf
encoding (`id = 1`) without changing the tree structure.

**Tree construction (consensus-critical).** A canonical binary Merkle tree with:

- **Domain separation** — distinct leaf and branch hash domains (`SpendScriptLeaf` /
  `SpendScriptBranch`, engine-domain Blake2b), so an internal node can never be reinterpreted as a
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

The integration of this root into the committed output is **decided** (§10): it is an output-level
`condition_root` field — not an inline `SpendCondition` field and not a taproot-style key tweak. This
section specifies the tree and proof mechanism, which is independent of that choice.

#### 10. Output spend model: `spend_key` + `condition_root` (decided integration)

The decided committed model replaces the inline `SpendCondition` field on the stealth output with
two separate committed fields — the authorization key and the condition-tree root (§9):

```rust,ignore
pub struct StealthUnspentOutput {
    // …commitment, sender nonce, encrypted data, minimum_value_promise, tag…
    /// Key-path authorization. `None` = no key path.
    pub spend_key: Option<RistrettoPublicKeyBytes>,
    /// Condition-tree root over the alternative conditions (§9). `None` = no conditions.
    pub condition_root: Option<Hash32>,
}
```

- **Invariant.** At least one of `spend_key` / `condition_root` is `Some`; `{None, None}` is an
  unspendable (burn) output and is rejected at creation.
- `condition_root == None` is a pure payment **or** — once the deferred tweak below lands — a
  tweak-hidden condition; these share a single anonymity set.
- `condition_root == Some(root)` is a **transparent, introspectable** condition set / covenant, and
  is therefore a deliberately distinguishable class (see the rationale).

**Witness-driven spends.** Each spent input carries a `SpendWitness` that selects the spend path; the
committed output only gates which witnesses are *admissible*, and the spender always chooses:

| Witness | Admissible when | Checked |
|---|---|---|
| Key-path | `spend_key = Some(pk)` | a signature under `pk` |
| Script-path | `condition_root = Some(root)` | reveal one leaf + its `MerkleProof`; recompute and check the root (§9), then evaluate that leaf via §5 |

Because the spender chooses the witness, "script-only" (no key path) must be enforced
*cryptographically* — by `spend_key: None` (or, for the deferred hidden case, a NUMS key whose
discrete log is unknown) — never by assuming the spender will decline the key path.

**Mapping today's conditions.** The signature condition becomes the key path (`spend_key =
Some(pk)`); a `TemplateFunction` predicate and an `AccessRule` are **sibling leaf kinds** in the
condition tree, each carried as an `id = 0` `SpendCondition` leaf. The §2–§8 mechanism — ABI, T1/T2
signature validation, the read-only sandbox, metering, and the covenant helpers — is unchanged and
now applies to the *revealed leaf*. Accordingly the `Outputs` introspection view (§4) and the
covenant helpers (§8) expose each output's `{spend_key, condition_root}` in place of a single
`SpendCondition`.

**Deferred: key-path / script-path tweak.** A Taproot-style key tweak — folding the root into the
spend key as `Q = P + H_tweak(P‖root)·G` so a script-bearing output is indistinguishable from a plain
payment — is intentionally **deferred, not discarded**. It is additive: reserve a `ScriptPathTweaked`
witness variant and accept a tweaked `spend_key` with a `None` `condition_root`, opt-in per output,
with no format break. A NUMS internal key is needed only for the hidden-and-condition-only case, and
the tweak hash MUST bind `P` (`H_tweak(P‖root)`) or forgery is trivial. Why the field ships first —
and why the tweak is not needed for covenants — is in the Rationale ("Why a committed
`condition_root` field, not a key-path tweak").

### API changes

- `tari_template_lib_types`: the output's committed spend fields `spend_key:
  Option<RistrettoPublicKeyBytes>` and `condition_root: Option<Hash32>` (§10) replacing the inline
  `SpendCondition`; the repurposed `SpendCondition` leaf enum (`AccessRule` / `TemplateFunction`);
  `SpendWitness` (key-path / script-path) and
  `MerkleProof` (pure data, no hashing — §9); and the `SpendContext` view types. TS bindings
  regenerated (hand-edited per project convention).
- `tari_template_abi`: new `EngineOp::SpendContextInvoke`; `SpendContextAction` enum.
- `tari_template_lib`: `SpendContext` API + covenant helpers; builder support so resource/
  output construction can attach a `TemplateFunction` condition.
- `tari_engine`: `read_only` `CallFrame` mode + `write_lock_substate`/`new_substate` guard;
  `validate_spend_script_signature` (T1 + T2); `RuntimeInterface::spend_context_invoke`;
  `SpendScriptGuardModule`; spend-script invocation in `validate_spend_condition`; new
  `RuntimeError` variants.
- `tari_engine_types`: MAST script-tree primitive (§9) — `MerkleTree`, `MerkleProof`, the
  `SpendScriptLeaf`/`SpendScriptBranch` hash domains, and inclusion-proof verification — used by the
  engine at spend time and the wallet at construction
  (`crates/engine_types/src/stealth/script_tree.rs`).
- `tari_ootle_transaction`: extend `calc_stealth_statement_weight` so each stealth output's
  weight includes the serialized size of its committed condition data (charging `TemplateFunction`
  `args` at creation, `crates/transaction/src/v1/transaction.rs:284`).
- Wallet (`crates/wallet/ootle-rs/src/stealth/builder.rs`): allow constructing outputs with a
  `TemplateFunction` spend condition; expose the new condition in produced `StealthUnspentOutput`s.

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

### Why a spend script subsumes covenants (and we add no covenant field)

A covenant is a constraint on the *outputs a spend produces*. With `ctx.outputs()` exposing
each output's committed `{spend_key, condition_root}`, and `ctx.invoking_condition()` exposing the
predicate's own identity, a predicate can assert "every output carries the same condition I do" — a recursive
covenant — purely as predicate logic. Output-introspection is the one capability that collapses
"script" and "covenant" into a single mechanism (it is exactly what Bitcoin historically
lacked and what CTV/APO/Simplicity add). Given that, a separate covenant field would be
redundant *for expressiveness*.

We deliberately defer a declarative covenant field. It would be justified only by needs this
proposal does not yet target:

1. **Cheap covenant + native authorization.** A `TemplateFunction` leaf folds authorization into
   WASM; pairing a native key-path or `AccessRule` check with a covenant without paying WASM cost
   would want a covenant as a *separate, composable* field rather than a condition-tree leaf.
2. **Off-chain analyzability.** A declarative covenant (`Timelock`, `PreserveSpendCondition`,
   `ValueBounds`) can be read and explained by wallets/indexers without executing arbitrary
   WASM; an opaque predicate cannot.
3. **Engine-enforced propagation.** A first-class covenant could make recursive propagation an
   engine guarantee instead of relying on each script author to recurse correctly.

If any of these become priorities, a follow-up TIP can add a composable `Covenant` field that
sits *alongside* any authorization variant, keeping "who may spend" (authorization) and "what
the spend must produce" (covenant) cleanly orthogonal. The library-helper approach here is
forward-compatible with that.

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
- **Cheap and non-breaking.** `Option<Hash32>` with cbor/serde defaults, versus consensus-critical
  EC verification plumbing.

The accepted cost is that `Some` versus `None` is observable, so transparent-covenant outputs are a
distinguishable class (hidden only within the `None` population). The tweak remains available later
(§10) for the `None` case if hidden scripts or multiparty become priorities.

### Privacy

Scripts see commitments, spend conditions, tags and `minimum_value_promise` — never plaintext
confidential values. This matches what the balance proof and existing validation already
operate on, so spend scripts add no information leakage beyond what the output structure
already exposes on-ledger.

## Backwards Compatibility

The §10 output model is a **breaking re-encoding** of the stealth output: the inline
`SpendCondition` field is removed in favour of `spend_key` and `condition_root`, and the
`SpendCondition` enum itself is repurposed as the condition-tree leaf payload — dropping `Signed`
(now the key path) and renaming the predicate variant to `TemplateFunction`. Existing
`Signed`/`AccessRule` outputs therefore do **not** decode unchanged. Ootle is pre-launch with no
live network, so this breaking change is acceptable and requires no migration of stored substates —
there is no prior on-ledger data to preserve. `AccessRule` retains its inline, WASM-free evaluation
(now as a condition-tree leaf), and a key-path spend keeps the existing signature check.

## Test Cases

Engine tests (`crates/engine/tests/stealth.rs` is the existing home for spend-condition tests):

1. **Timelock** — output with a `TemplateFunction(timelock, unlock_epoch=E)` condition; spend at
   epoch `< E` rejected (`SpendScriptRejected`), at `>= E` succeeds.
2. **Recursive covenant** — output with a "preserve spend condition" script; a spend whose
   outputs carry the same condition succeeds; a spend that changes an output's condition is
   rejected.
3. **Hash/sig lock** — script requires a Schnorr signature over a fixed message via
   `signature_invoke`; valid signature spends, invalid/missing rejects.
4. **Read-only enforcement** — a script that calls `vault_invoke(Withdraw)` (or otherwise
   triggers `write_lock_substate` / `new_substate`) fails with `WriteInReadOnlyContext` →
   `SpendScriptRejected`, and crucially leaves the targeted vault unchanged. Covers the
   "directly reach a host op without a cross-template call" attack.
5. **Sandbox deny-list** — a script attempting `call_invoke`, `generate_random_invoke`,
   `emit_event`, `pay_fee` or `publish_template` aborts via `SpendScriptGuardModule`.
6. **T1 creation rejection** — creating an output whose `TemplateFunction` names a missing function,
   a mutable (`is_mut == true`) function, a non-unit return, a missing `SpendContext` arg, or
   malformed `args` CBOR causes the *creating* transaction to be rejected (not the later spend).
7. **Determinism / metering** — a script that exceeds `MAX_WASM_POINTS_PER_CALL` fails with
   `SpendScriptRejected`; fees charged to the spender are observable in the receipt.
8. **Signature-binding** — a spender cannot substitute a different `{template, function, args}`
   than the one committed in the output's condition.
9. **Value constraint** — "change must return to this condition" script enforced over
   `ctx.outputs()`.
10. **Weight** — an output with a large-`args` `TemplateFunction` condition raises the *creating*
    transaction's weight (and fee) proportionally, versus an equivalent key-path output.
11. **Condition tree (MAST)** — an output committing to a multi-leaf condition root spends by
    revealing one leaf + inclusion proof: a valid proof for a committed leaf spends and evaluates that leaf; a
    proof for a non-committed leaf, a tampered sibling, or a wrong root is rejected. A single-leaf
    tree has an empty proof and its root equals the leaf hash. The root is independent of leaf
    authoring order, and leaf/branch domain separation prevents an internal node from being passed
    off as a leaf.

## Implementation

Suggested phasing (spec/rationale first, per TIP process):

1. Types + ABI: `SpendCondition::TemplateFunction`, `TemplateFunction`, `EngineOp::SpendContextInvoke`,
   `SpendContextAction`, view types; TS bindings; extend `calc_stealth_statement_weight` to
   weight each output's spend-condition bytes.
2. Read-only mode foundation: `read_only` flag on `CallFrame`; `WriteInReadOnlyContext` guard
   on `write_lock_substate` / `get_*_mut` / `new_substate`. (Independently useful — also the
   basis for any future read-only/view transaction.)
3. Engine: `validate_spend_script_signature` wired into both output creation (T1, rejects the
   creating tx) and `validate_spend_condition` (T2); `spend_context_invoke`;
   `SpendScriptGuardModule`; the read-only restricted-frame invocation; new `RuntimeError`
   variants (`SpendScriptRejected`, `WriteInReadOnlyContext`).
4. `template_lib`: `SpendContext` + covenant helpers + builder support.
5. Wallet builder support for constructing `TemplateFunction`-conditioned outputs.
6. Tests above; docs/examples (a `vault`/`timelock` example template).

A complementary authoring-ergonomics change — a `#[template(stateless)]` macro option that lets
a template expose only stateless functions with no component — is tracked separately in the
tari-ootle repository. It is not required for this proposal (a spend script is just a
receiver-less function), but it makes the §2 example valid as written.

## References

All `crates/...` paths refer to the
[tari-ootle repository](https://github.com/tari-project/tari-ootle).

- `crates/template_lib_types/src/stealth/unspent_output.rs:65` — `SpendCondition` today.
- `crates/engine/src/runtime/working_state.rs:292,321` — spend-condition enforcement.
- `crates/engine/src/runtime/impl.rs:292,404` — `invoke_resource_access_hook` /
  `check_resource_auth_hook` (the AuthHook precedent this design mirrors).
- `crates/engine/src/runtime/scope.rs` — `CallFrame.allow_cross_template_calls`,
  `PushCallFrame::Static` (where the proposed `read_only` flag lives).
- `crates/engine/src/runtime/impl.rs:1648` — vault `Withdraw` taking `write_lock_substate`, the
  mutation chokepoint the read-only mode guards.
- `crates/template_abi/src/ops.rs:27` — `EngineOp`; `crates/template_abi/src/template_def.rs`
  — `FunctionDef.is_mut`.
- `crates/engine/src/wasm/metering.rs`, `crates/engine/src/fees/fee_module.rs` — WASM metering
  and fees.
- `crates/engine_types/src/stealth/script_tree.rs` — reference MAST implementation: tree
  construction, domain-separated hashing, and inclusion-proof verification (§9).
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
