# RFC-0385/StableCoin

## Digital Assets Network

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77), [Aaron Feickert](https://github.com/AaronFeickert)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2022 The Tari Development Community

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:[RFC-0303_DanOverview.md](RFC-0303_DanOverview.md)

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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all
capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

This Request for Comment (RFC) describes the a possible manifestation of a privacy-preserving
stablecoin on the Tari Digital Assets Network (DAN).

## Related Requests for Comment

## Evaluation of existing stablecoins

The top two stablecoins by issuance, or "total value locked" (TVL) are Tether USD (USDT, under various contracts) and
USD Coin (USDC).
As of August 2023, these two coins accounted
for [87% of the total stablecoin market](https://defillama.com/stablecoins).

Both coins are fully collateralised and the peg is maintained by the centralised issuer.

Although Tether is under scrutiny by authorities, both stablecoins have been in operation for several years. One
might reasonably assume that the intersection of the feature set of the two coins' contracts represent a minimal set of
requirements for legal operation.

What follows is a brief summary of the features of the two coins.

### Tether USD (USDT)

The Tether USD ERC-20 contract is deployed at address
[`0xdac17f958d2ee523a2206206994597c13d831ec7`](https://etherscan.io/address/0xdAC17F958D2ee523a2206206994597C13D831ec7).
The contract code for this contract is presented in [Appendix A](#appendix-a---tether-usd-contract). As of August
2023, USDT 39B was help in this contract.

The contract has the following key features:

#### Administration

The following monetary functions can only be called by the contract owner:

* `issue(amount)` - issues new tokens to the contract owner's account.
* `redeem(amount)` - redeems tokens from the contract owner's account.
* `setParams(...)` - Allows owner to set or change fees for transfers. Currently set to zero.

The owner has access to the following fraud/AML functions:

* `addBlackList(address)` - Adds an address to the blacklist. Blacklisted addresses are not allowed to send tokens
  (but they can receive them).
* `removeBlackList(address)` - Removes an address from the blacklist.
* `destroyBlackFunds(address)` - Destroys all tokens in the blacklisted address, reducing the total supply.

Finally, the owner has access to the following contract management functions:

* `deprecate(address)` - Deprecates the contract and supplies the upgraded contract address.
* `pause` - pauses the entire contract, preventing any transfers.
* `unpause` - unpauses the contract.
* `transferOwnership(address)` - transfers ownership of the contract to a new address.

#### Account owners

The Tether contract records balances through a simple map of standard wallet addresses to amount.
Any ethereum address is eligible to hold a USDT balance by virtue of the ERC-20 contract.

Account owners (ie the address matching the transaction `sender`) have the following abilities:

* `transfer(to, amount)` - transfers tokens to another address. Fees get sent to the owner's account.
* `transferFrom(from, to, value)` - allows a 3rd party to transfer tokens from the `from` account to the `to` account.
  The 3rd party must have been authorised by the `from` account to do so using `approve` and amount must be less
  than or equal to `allowance(from, sender)`.
* `approve(spender, amount)` - authorises a 3rd party to transfer tokens from the owner's account to another account.
  The 3rd party must call `transferFrom` to perform the transfer.

#### Public read-only functions

The following functions are available to the public:

* `totalSupply` - returns the total supply of minted tokens. The unit is in millionths of a USD.
* `balanceOf(address)` - returns the balance of the given address.
* `allowance(owner, spender)` - returns the amount of tokens that the spender is allowed to spend on behalf of the
  owner.
* `getBlackListStatus(address)` - returns whether the given address is blacklisted.
* `getOwner` - returns the owner of the contract.

### Circle USD (USDC)

The primary Circle USD contract address is
[`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`](https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).

This is a proxy contract that relays calls to a secondary contract. This is ostensibly done to allow transparent
upgrades to the contract, but it does imply additional risk, since the contract code that actually runs and secures
your funds is not actually immutable anymore.

The current proxied contract is presented in [Appendix B](#appendix-b---circle-usd-contract). As of August 2023,  
USDC 24B was held in this contract.

It is an ERC-20 contract like Tether, but adds the ability to carry out signature-based operations. Fees are not
supported in this contract.

The contract has the following key features:

#### Administration

The owner has access to the following contract management functions:

* `updatePauser(address)` - gives the `Pause` role to a new address.
* `updateBlacklister(address)` - gives the `Blacklist` role to a new address.
* `transferOwnership(address)` - transfers ownership of the contract to a new address.
* `updateMasterMinter(address)` - gives the `MasterMinter` role to a new address.
* `updateRescuer(address)` - gives the `Rescuer` role to a new address.

The address with the `Pauser` role has access to the following functions:

* `pause` - pauses the entire contract, preventing any transfers. Caller must have the `Pauser` role.
* `unpause` - unpauses the contract. Caller must have the `Pauser` role.

The address with the `Blacklist` role has access to the following functions:

* `blacklist(address)` - Adds an address to the blacklist. Blacklisted addresses are not allowed to send tokens
  (but they can receive them).
* `unBlacklist(address)` - Removes an address from the blacklist. Caller must have the `Blacklist` role.

The address with the `MasterMinter` role has access to the following functions:

* `configureMinter(address, amount)` - Allows the `MasterMinter` to add a new minter. The minter is allowed to mint
  up to the given amount of tokens. New minters have the `Mint` role.
* `removeMinter(address)` - Removes a minter. The address will no longer be able to mint tokens.

Addresses with the `Mint` role have access to the following functions:

* `mint(address, amount)` - Mints tokens to the given address. The amount must be less than or equal to the amount
  that the minter is allowed to mint. Unlike in Tether, USDC mints can be injected directly into arbitrary accounts.
* `burn(amount)` - Burns tokens from the minter's address. Minter must not be blacklisted.

The address with the `Rescuer` role has access to the following function:

* `rescueERC20(contract, address, amount)` - Unconditionally transfers `amount` funds from the contract to `address`.
  This is ostensibly a backdoor that allows the owner to recover funds in the event of a bug.

#### Account owners

The Tether contract records balances through a simple map of standard wallet addresses to amount.
Any ethereum address is eligible to hold a USDT balance by virtue of the ERC-20 contract.

Account owners (ie the address matching the transaction `sender`) have the following abilities:

* `transfer(to, amount)` - transfers tokens to another address. Fees get sent to the owner's account. Neither party
  may be blacklisted.
* `transferFrom(from, to, value)` - allows a 3rd party to transfer tokens from the `from` account to the `to` account.
  The 3rd party must have been authorised by the `from` account to do so using `approve` and amount must be less
  than or equal to `allowance(from, sender)`. Neither `from`, `to` or the `sender` may be blacklisted.
* `approve(spender, amount)` - authorises a 3rd party to transfer tokens from the owner's account to another account.
  The 3rd party must call `transferFrom` to perform the transfer. Neither the 3rd party or the authorising account
  may be blacklisted.
* `in(de)creaseAllowance(spender, amount)` - increases (decreases) the amount that the spender is allowed to spend on
  behalf of the owner. Neither the 3rd party or the authorising account may be blacklisted.
* `transferWithAuthorization(to, value, authParams..)` - transfers tokens to another
  address based on the signature provided. This allows clients to batch transfers and save on gas, or services to pay
  gas on behalf of clients.
* `cancelAuthorization(authParams..)` - cancels a pending transferWithAuthorization.
* `permit(owner, spender, value, ...)` - Similar to `approve` but authorisation is provided by a bearer signature.

#### Public read-only functions

The following functions are available to the public:

* `totalSupply` - returns the total supply of minted tokens. The unit is in millionths of a USD.
* `balanceOf(address)` - returns the balance of the given address.
* `allowance(owner, spender)` - returns the amount of tokens that the spender is allowed to spend on behalf of the
  owner.
* `isBlacklisted(address)` - returns whether the given address is blacklisted.
* `getOwner` - returns the owner of the contract.
* `minterAllowance(address)` - returns the amount of tokens that the given address is allowed to mint.
* `isMinter(address)` - returns whether the given address is a minter.

## Feature Comparison of Tether and Circle USD

| Feature                              | Tether                | Circle USD             | Minimal requirements |
|--------------------------------------|-----------------------|------------------------|----------------------|
| Contract type                        | ERC-20                | ERC-20                 |                      |
| Minting                              | Yes (owner only)      | Yes (multiple minters) | Yes                  |
| Burning                              | Yes (owner only)      | Yes (multiple minters) | Yes                  |
| Minting to arbitrary account         | No                    | Yes                    | No                   |
| Blacklisting                         | Yes                   | Yes                    | Yes                  |
| Blacklisted account can send         | No                    | No                     | No                   |
| Blacklisted account can receive      | Yes                   | No                     | Yes                  |
| Blacklisted account can be destroyed | Yes                   | No                     | No                   |
| Take funds from arbitrary account    | No                    | No                     | No                   |
| Fees                                 | Yes (currently zero)  | No                     | No                   |
| Contract upgrade                     | Yes (via linked list) | Yes (via proxy)        | N/A                  |
| Contract pause                       | Yes                   | Yes                    | N/A                  |

## Description

### Key assumptions and requirements

1. The stablecoin is account-based.
2. Issuance and redemptions of the stablecoin tokens are performed by a centralised entity, the `issuer`. The stability
   of the token and its peg are completely dependent on the issuer's ability to maintain the peg. The issuer is
   required to act responsibly and issue and redeem tokens in a timely manner in order to engender confidence in the
   coin and maintain the peg.
3. Aside from the administrator privileges conferred on the `issuer` by the stablecoin contract, the coin is operated
   in a decentralised manner, and transfers are facilitated by the Tari network, and are not processed by any
   centralised
   entity, including the `issuer`.
4. The `issuer` has the following "administrator" powers:
    1. Create and authorise new accounts.
    2. Issue new tokens. The new tokens are credited to the `issuer`'s account. The transactions are i the clear so
       that anyone can verify the total circulating supply of the stablecoin.
    3. Redeem (burn) existing tokens. The burnt tokens are debited from the `issuer`'s account. These transactnios
       are in the clear.
    4. Have access to the full list of account ids.
    5. Blacklist an account. Blacklisted accounts are not allowed to send, or receive, tokens.
    6. Remove an account from the blacklist.
5. Account-holders have the following abilities:
    1. View their own balance.
    2. If their account is not blacklisted, transfer funds to any other (non-blacklisted) account.
6. General users:
    1. Cannot see the balance of any account (other than their own).
    2. Can see the total supply of tokens in circulation.
    3. Can apply for a new account by interacting with the `issuer`.
7. The possibility of the issuer charging a fee for transfers is not considered in this design.
8. The issuer can view the balance of account holders.
9. The issuer cannot unilaterally spend or seize funds from any account holder.

Validator nodes validate all stablecoin transactions. In particular:

1. Validator nodes cannot determine the value of any transaction.
2. However, they _are_ able to, and MUST verify that
    1. no coins are created or destroyed in the transaction, i.e. the sum of the parties' balances before and after
       the transfer are equal.
    2. the transfer value is positive,
    3. the sender has a positive balance after the transaction,
    4. the sender has authorised the transaction,
    5. the sending party holds a valid account,
    6. the sending party is not on the blacklist,
    7. the receiving party holds a valid account,
    8. the receiving party is not on the blacklist.
3. If any of the conditions in 3 are not met, the transaction is invalid and the validator node MUST reject the
   transaction.

## Implementation

The broad strategy is as follows:

* The issuer mints stablecoin tokens in equal quantity to the amount of fiat currency deposited with the issuer.
  These mint transactions are in the clear and anyone can ascertain the total circulating supply of the stablecoin.
* Issuers can transfer tokens to any account. These transfers are also in the clear.
* Transfers between account holders are confidential.
* The issuer can carry out confidential transfers by first transferring tokens from the
  cleartext issuer account to another, standard account controlled by the issuer, and then performing a confidential
  transfer from there to the final destination account.
* Balances are stored in Pedersen commitments. The blinding factor is updated after every transaction and is a
  function of a shared secret between the account holder and the issuer, and a public nonce, that is stored in the
  account metadata.
* Users create a new account by interacting with the issuer. The issuer provides an account id that can be compared
  against a blacklist for the purposes of determining whether the account is valid or not. The issuer may choose to
  conduct a KYC procedure out-of-band as part of the account creation process.
* The full list of accounts form part of a whitelist. Only the issuer can modify the whitelist.
* A blacklist, which only the issuer can modify, comprises a list of accounts that may no longer participate in
  stablecoin transactions.
* Spending authority rests solely with the account owner and required knowledge of the account private key.
* Transfers are done in two-steps, via the issuance of an e-cheque by the sender, followed by the claiming of the
  e-cheque by the recipient.
* Issuers are able to view account balances by holding a shared encryption key with every user. This key is used to
  encrypt the memo field of the account. The issuer can decrypt the memo field and determine the value of the
  transfer. Every account also possesses an equivalence proof, which shows that the balance commitment is equal to
  the value in the memo field.

The remainder of this section describes the implementation in more detail.

<div class="note">
This design is experimental and not yet suitable for production.
</div>

## Mathematical furniture

As a point of notation, we sometimes use superscripts in mathematical notation in this note; unless otherwise indicated,
this is symbolic and not to be interpreted as indicating exponentiation.

### Hash functions and ciphers

We require the use of multiple cryptographic hash functions, which must be sampled independently.
It is possible to do this by carefully applying domain separation to a single cryptographic hash function.
We further require that when data is provided as input to such a hash function, it is done safely in a manner that is
canonical and cannot induce collisions.
We use a comma notation to indicate multiple input values, as in $H(a, b, c, \ldots)$.

We also require the use of a key-committing AEAD (authenticated encryption with additional data) construction.
It is possible to extend an arbitrary AEAD design in this manner by including a safe cryptographic hash of a derived
key.

Let $H_{\text{AEAD}}$ be a cryptographic hash function whose output is the AEAD key space, suitable for $H_
{\text{AEAD}}$ to operate as a key derivation function for the AEAD.

### Proving systems

The design will require several zero-knowledge proving systems that allow validators to assert correctness of operations
without revealing protected data.

### Verifiable encryption

We require the use of a verifiable ElGamal encryption proving system that asserts the value bound to a Pedersen
commitment matches the value encrypted to a given public key.
This will be used to assert that the issuer can decrypt account balances without knowing the opening to the account's
balance commitment.

The proving relation is 

$\\{ (C, E, R, P); (v, m, r) | C = vG + mH, E = vG + rP, R = rG \\}$.

* The prover samples $x_v, x_m, x_r$ uniformly at random.
* It computes $C' = x_v G + x_m H$, $E' = x_v G + x_r P$, and $R' = x_r G$ and sends them to the verifier.
* The verifier samples nonzero $e$ uniformly at random and sends it to the prover.
* The prover computes $s_v = ev + x_v$, $s_m = em + x_m$, and $s_r = er + x_r$ and sends them to the verifier.
* The verifier accepts the proof if and only if $eC + C' = s_v G + s_m H$, $eE + E' = s_v G + s_r P$, and $eR + R' = s_r
G$.

The proof can be made non-interactive using the Fiat-Shamir technique.
It is a sigma protocol for the relation that is complete, 2-special sound, and special honest-verifier zero knowledge.

### Value equality

We require the use of a value equality proving system that asserts two Pedersen commitments bind to the same value.
This will be used to assert that commitments used in transfers retain balance.

The proving relation is 

$\\{ (C_1, C_2); (v, m_1, m_2) | C_1 = vG + m_1 H, C_2 = vG + m_2 H \\}$.

* The prover samples $x_v, x_{m_1}, x_{m_2}$ uniformly at random.
* It computes $C_1' = x_v G + x_{m_1} H$ and $C_2' = x_v G + x_{m_2} H$ and sends them to the verifier.
* The verifier samples nonzero $e$ uniformly at random and sends it to the prover.
* The prover computes $s_v = ev + x_v$, $s_{m_1} = em_1 + x_{m_1}$, and $s_{m_2} = em_2 + x_{m_2}$ and sends them to the
verifier.
* The verifier accepts the proof if and only if $eC_1 + C_1' = s_v G + s_{m_1} H$ and $eC_2 + C_2' = s_v G + s_{m_2} H$.

The proof can be made non-interactive using the Fiat-Shamir technique.
It is a sigma protocol for the relation that is complete, 2-special sound, and special honest-verifier zero knowledge.

### Schnorr representation

We require the use of a Schnorr representation proving system that asserts knowledge of a discrete logarithm.
This will be used to sign messages, as well as to assert that a Pedersen commitment binds to a given value.

The proving relation is 

$\\{ P; p | P = pG \\}$.

* The prover samples $x_p$ uniformly at random.
* It computes $P' = x_p G$ and sends it to the verifier.
* The verifier samples nonzero $e$ uniformly at random and sends it to the prover.
* The prover computes $s_p = ep + x_p$ and sends it to the verifier.
* The verifier accepts the proof if and only if $eP + P' = s_p G$.

The proof can be made non-interactive using the Fiat-Shamir technique.
It is a sigma protocol for the relation that is complete, 2-special sound, and special honest-verifier zero knowledge.

To use this proving system to assert that a commitment $C$ binds to a given value $v$, we set $P = C - vG$ and use the
Schnorr representation proving system on this statement using the generator $H$ instead of $G$, and being careful to
bind $v$ into the Fiat-Shamir transcript.

### Commitment range

We require the use of a commitment range proving system that asserts that all Pedersen commitments in a set bind to
values in a specified range.
This will be used to prevent balance underflow and overflow that would inflate supply.
We assume the intended range is $[0, 2^n)$ for some globally-fixed $n$; in practice, $n = 64$ is typically used (since
it is often the case that $n$ must itself be a power of two).

The proving relation is 

$\\{ (C_j)\_{j=0}^{m-1}; (v_j, m_j)_{j=0}^{m-1} : C_j = v_j G + m_j H, v_j \in [0, 2^n) \forall j \\}$.

The popular and efficient Bulletproofs and [Bulletproofs+](https://github.com/tari-project/bulletproofs-plus) range 
proving systems may be used for this purpose.

## Design

We now describe the stablecoin design.

### Issuer

The stablecoin is instantiated by defining the issuer.

The issuer samples its secret key $p$ uniformly at random, and computes the corresponding public key $P = pG$.
It produces a Schnorr representation proof $\Pi_P$ using statement $P$ and witness $p$.
It sets up the stablecoin as follows:

- Public key: $P$
- Public key proof: $\Pi_P$

Validators check this operation by verifying $\Pi_P$.

The issuer also sets up an account for itself using the structure described below for users.

### Users

A user who wishes to open an account interacts with the issuer via a side channel.
The user samples its secret key $k$ uniformly at random, and computes the corresponding public key $K = kG$.
It produces a Schnorr representation proof $\Pi_K$ using statement $K$ and witness $k$.
The issuer checks that $K$ has not been used in any other approved account, and verifies $\Pi_K$.

If the issuer approves the account, it signs $K$ by generating a Schnorr representation proof $\Pi_{P, K}$ using
statement $P$ and witness $p$, binding $K$ into the Fiat-Shamir transcript.

The issuer sets up the account structure as follows:

- Public key: $K$
- Public key proof: $\Pi_K$
- Issuer proof: $\Pi_{P, K}$
- State nonce: 0
- Balance commitment: 0 (identity group element)
- Issuer-encrypted balance: None
- User-encrypted balance: None
- Pending e-cheques: None

* The *state nonce* is a value used to track changes to the account and avoid replaying messages.
* The *issuer-encrypted balance* field will be populated with a verifiable encryption of the balance that can be 
  decrypted by the issuer.
* The *user-encrypted balance* field will be populated with an authenticated encryption of the value and mask
corresponding to the balance commitment that can be decrypted by the user for account recovery purposes.
* The *pending e-cheques* field will be populated with *e-cheques* representing transfers that are destined for the 
  account, but that the user has neither approved nor rejected.

Validators check this operation by verifying $\Pi_K$ and $\Pi_{P, K}$, asserting that $K$ does not appear in any other
account, and asserting the other constant values are as expected.

### Cheques

When a user wishes to transfer funds to another user, it does so by generating an *e-cheque*.
Once validators check the e-cheque, it is added to the recipient's pending e-cheques list and the 
sender's account is updated.

The e-cheque remains until the recipient approves or rejects it, or until the e-cheque becomes abandoned, as 
described later.

Suppose the sender wishes to transfer value $v^\Delta$ to a recipient.
* Let $K_s = k_s G$ and $K_r$ be the sender and recipient keys, respectively.
* Let $C = vG + mH$ be the sender balance commitment.
* Let $i$ be the sender state nonce.

The sender does the following:

- Samples a scalar $m_s^\Delta$ uniformly at random and uses it to generate a commitment $C_s^\Delta = v^\Delta G +
  m_s^\Delta H$ to the transfer value.
- Samples a scalar $m^\Delta$ uniformly at random and uses it to generate a commitment $C^\Delta = v^\Delta G + m^\Delta
  H$ to the transfer value.
- Generates a proof of value equality $\Pi_\Delta$ on the statement $(C_s^\Delta, C^\Delta)$ and witness $(v^\Delta,
  m_s^\Delta, m^\Delta)$.
- Samples a scalar $r$ uniformly at random, and computes $R = rG$.
- Generates an AEAD key $H_{\text{AEAD}}(r K_r)$ and uses it to encrypt the tuple $(v^\Delta, m^\Delta)$, producing
  authenticated ciphertext $c$.
- Sets $E = (v - v^\Delta) G + rP$ as an ElGamal encryption of its new balance, and generates a verifiable encryption
  proof $\Pi_{\text{enc}}$ on the statement $(C - C_s^\Delta, E, R, P)$ and witness $(v - v^\Delta, m - m_s^\Delta, r)$.
- Generates a range proof $\Pi_{\text{range}}$ on the statement $\\{ C_s^\Delta, C - C_s^\Delta \\}$ and witness $\\{ (
  v^\Delta, m_s^\Delta), (v - v^\Delta, m - m_s^\Delta) \\}$.
- Generates an AEAD key $H_{\text{AEAD}}(k_s)$ and uses it to encrypt the tuple $(v - v^\Delta, m - m_s^\Delta)$,
  producing authenticated ciphertext $c_s$.
- Sets the e-cheque to be the tuple $t = (K_s, K_r, C, i, C_s^\Delta, C^\Delta, E, R, \Pi_\Delta, \Pi_{\text{enc}}, \Pi_
  {\text{range}}, c_s, c_{sr})$.
- Signs the e-cheque by generating a Schnorr representation proof $\Pi_t$ using statement $K_s$ and witness $k_s$, binding
  $t$ into the Fiat-Shamir transcript.

Prior to accepting the e-cheque as valid, validators perform the following checks:

- Assert that neither $K_s$ nor $K_r$ appear on the blacklist.
- Verify the proof $\Pi_t$.
- Look up the sender's account using $K_s$ and assert that $C$ and $i$ match the corresponding values in the account.
- Verify the proofs $\Pi_\Delta$, $\Pi_{\text{enc}}$, and $\Pi_{\text{range}}$.

If these checks pass, validators add the e-cheque to the recipient's pending e-cheques list, and update the sender's account
as follows:

- Increment the state nonce.
- Set the balance commitment to $C - C_s^\Delta$.
- Set the issuer-encrypted balance to the tuple $(E, R)$.
- Set the user-encrypted balance to $c_s$.

When the recipient sees the e-cheque, it can either *endorse* or *void* it.

Endorsement means the recipient intends to accept the funds and wishes to have its account updated accordingly.
Voiding means the recipient does not intend to accept the funds and wishes for the sender to be able to claim them back.
Prior to making this determination, the recipient does the following:

- Generates an AEAD key $H_{\text{AEAD}}(k_r R)$ and uses it to authenticate and decrypt $c$, producing the tuple $(
  v^\Delta, m^\Delta)$.
- Checks that $C^\Delta = v^\Delta G + m^\Delta H$.

If these checks pass, it may choose to endorse or void the e-cheque.
If they fail, it must void the e-cheque.

### Voiding an e-cheque

Suppose the recipient wishes to void an e-cheque $t$.

It does the following:

- Sets the voiding to be the tuple $t_{\text{void}} = (t)$.
- Signs the voiding by generating a Schnorr representation proof $\Pi_t$ using statement $K_r$ and witness $k_r$,
  binding $t_{\text{void}}$ into the Fiat-Shamir transcript.

Prior to accepting the voiding as valid, validators perform the following checks:

- Assert that neither $K_s$ nor $K_r$ appear on the blacklist.
- Verify the proof $\Pi_t$.

If these checks pass, validators annotate $t$ in the recipient's pending e-cheques list to indicate the voiding.

### Endorsing an e-cheque

Suppose the recipient wishes to endorse an e-cheque $t$ with $C^\Delta = v^\Delta G + m^\Delta H$ from its pending e-cheques
list.

Now let $C = vG + mH$ be the recipient balance commitment.

Let $i$ be the recipient state nonce.

The recipient does the following:

- Samples a scalar $m_r^\Delta$ uniformly at random, and uses it to generate a commitment $C_r^\Delta = v^\Delta G +
  m_r^\Delta H$ to the transfer value.
- Generates a proof of value equality $\Pi_\Delta$ on the statement $(C_r^\Delta, C^\Delta)$ and witness $(v^\Delta,
  m_r^\Delta, m^\Delta)$.
- Samples a scalar $r$ uniformly at random, and computes $R = rG$.
- Sets $E = (v + v^\Delta) G + rP$ as an ElGamal encryption of its new balance, and generates a verifiable encryption
  proof $\Pi_{\text{enc}}$ on the statement $(C + C_r^\Delta, E, R, P)$ and witness $(v + v^\Delta, m + m_r^\Delta, r)$.
- Generates an AEAD key $H_{\text{AEAD}}(k_r)$ and uses it to encrypt the tuple $(v + v^\Delta, m + m_r^\Delta)$,
  producing authenticated ciphertext $c_r$.
- Sets the endorsement to be the tuple $t_{\text{end}} = (t, C, i, C_r^\Delta, E, R, \Pi_\Delta, \Pi_{\text{enc}},
  c_r)$.
- Signs the endorsement by generating a Schnorr representation proof $\Pi_t$ using statement $K_r$ and witness $k_r$,
  binding $t_{\text{end}}$ into the Fiat-Shamir transcript.

It is also possible for the original sender of an e-cheque to endorse it as well.
This can arise in two cases:

- The recipient of the e-cheque has voided it.
- The recipient of the e-cheque has neither accepted nor voided it, and a protocol-specified period of time has passed.

The process is the same as above, with the sender now playing the role of the recipient.

Prior to accepting the endorsement as valid, validators perform the following checks:

- Assert that neither $K_s$ nor $K_r$ appear on the blacklist.
- Verify the proof $\Pi_t$.
- Look up the recipient's account using $K_r$ and assert that $C$ and $i$ match the corresponding values in the account,
  and that $t$ appears in the pending e-cheques list.
- Verify the proofs $\Pi_\Delta$ and $\Pi_{\text{enc}}$.

If these checks pass, validators remove the e-cheque $t$ from the recipient's pending e-cheques list, and update the
recipient's account as follows:

- Increment the state nonce.
- Set the balance commitment to $C + C_r^\Delta$.
- Set the issuer-encrypted balance to the tuple $(E, R)$.
- Set the user-encrypted balance to $c_r$.

### Issuer balance visibility

The issuer can privately view any user's balance at any time using ElGamal decryption.
Suppose it wishes to view the balance of a user whose issuer-encrypted balance is $(E, R)$.

It does the following:

- Sets $V = E - pR$.
- Finds $v$ such that $V = vG$; this is the user's balance.

Because the search space for balances is limited, the issuer can optimize this process.
For example, it could produce a lookup table mapping $vG \mapsto v$ for reasonable values $v$, or simply use brute force
on the search space.

### User account recovery

If the user loses access to their account balance, they can recover the opening to their balance commitment to regain 
access, provided they still hold the private key $k$.

Suppose such a user with key $k$ queries validators for its account's user-encrypted balance.

It does the following:

- Generates an AEAD key $H_{\text{AEAD}}(k)$ and uses it to authenticate and decrypt the user-encrypted balance,
  producing the tuple $(v, m)$; this is the opening to their balance commitment.

### Issuer transfers

When transferring funds from the issuer to a user, or from a user to the issuer, it is required that the value be
publicly visible for transparency purposes.
However, we wish to reuse as much of the existing design as possible, in order to simplify the design and reduce
engineering risk.

If the issuer wishes to transfer funds to a user, it produces an e-cheque with the following modifications:

- It sets $r = 0$.
- It uses a zero key to produce $c_s$.

When validating such an e-cheque, validators additionally do the following:

- Assert that $R = 0$.
- Assert that $c_s$ decrypts using a zero key, and that the resulting opening is valid.
- Decrypt $c_s$ and assert the resulting opening is valid.
- Decrypt $c$ using a zero key and assert the resulting opening is valid.

If a user wishes to transfer funds to the issuer, it produces an e-cheque with the following modifications:

- It sets $r = 0$.

When validating such an e-cheque, validators additionally do the following:

- Assert that $R = 0$.
- Decrypt $c$ using a zero key and asserting the resulting opening is valid.

If the issuer wishes to accept transfer funds from a user, it produces an endorsement with the following modifications:

- It uses a zero key to produce $c_r$.

When validating such an endorsement, validators additionally do the following:

- Assert that $c_r$ decrypts using a zero key, and that the resulting opening is valid.

This design allows for transparent analysis of the issuer's balance and e-cheques.

## Final notes

There are several variations of this contract that could be implemented.

For example, removing the encrypted balance fields would make user balances opaque to the issuer as well, while also 
simplifying the design considerably.

The transfer process can be augmented to include dummy inputs and outputs, using a strategy similar to that 
used in [Lelantus Spark](https://ia.cr/2021/1173). This would obfuscate the parties in a transfer, dramatically
improving privacy.

The use of e-cheques as the primary value transfer vehicle opens up many possibilities for adding additional margin
of error to on-chain financial transactions:
* For example, e-cheques could have a holding time associated with them, to allow parties to validate payments 
  out-of-band. 
* They could have additional claim constraints, which would simplify escrow contracts and swap contracts while 
  improving security.

# Appendix A - Tether USD contract

```js
{{#include assets/tether.sol}}
```

# Appendix B - Circle USD contract

The Circle USD contract runs as a proxy contract. Therefore the code that is actually active can be changed at any
time. The following is the contract code that was active as of 25 August 2023, deployed to address
[`0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf`](https://etherscan.io/address/0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf).

```js
{{#include assets/usdc.sol}}
```





