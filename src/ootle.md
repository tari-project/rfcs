# The Tari Ootle

The Ootle is Tari's smart contract layer. It settles against the Minotari base layer, which acts as its registrar and
its clock, but runs its own consensus, its own networking, and its own execution environment.

The Ootle comprises the following major pieces of software:

- **Validator nodes.** Validator nodes execute transactions and reach BFT consensus on the resulting state changes.
  They register on the Minotari base layer, and are organised into committees, each covering a contiguous slice of the
  substate address space. Consensus is HotStuff-based, with an explicit cross-shard protocol for transactions
  spanning more than one committee.
- **The Tari Virtual Machine.** A WASM sandbox in which template code executes. Templates are published to the Ootle
  itself; a running instance of a template is a component, and a component's state lives in substates.
- **Indexers.** Where validator nodes hold a fixed slice of the address space, indexers follow a chosen set of
  components wherever their state lives. Client applications read state and dry-run transactions through an indexer.
- **The wallet daemon.** Holds keys, builds and signs transactions, and exposes a JSON-RPC API that dApps use to
  request signatures and submit transactions on a user's behalf.

Tari — the token that pays for execution on the Ootle — is created by burning Minotari on the base layer and claiming
the equivalent on the Ootle. There is no peg back: a fraction of every transaction fee is burnt instead, which is what
sustains demand for the token.

<div class="note">
The Ootle was previously called the Digital Assets Network, or DAN. Earlier RFCs describing the DAN, and the
first-generation contract-per-committee design that preceded the current one, are in the
<a href="deprecated_rfc.md">Deprecated</a> section.
</div>
