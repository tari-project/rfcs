# RFC-0385/StableCoin

## Digital Assets Network

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77)

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
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as 
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

The top two stablecoins by issuance, or "total value locked" (TVL) are  Tether USD (USDT, under various contracts) and 
USD Coin (USDC).
As of August 2023, these two coins accounted for [87% of the total stablecoin market](https://defillama.com/stablecoins).

Both coins are fully collateralised and the peg is maintained by the centralised issuer. 

Although Tether is under scrutiny by authorities, both stablecoins have been in operation for several years. One 
might reasonably assume that the intersection of the feature set of the two coins' contracts represent a minimal set of 
requirements for legal operation.

What follows is a brief summary of the features of the two coins.

### Tether USD (USDT)

The Tether USD ERC-20 contract is deployed at address 
[`0xdac17f958d2ee523a2206206994597c13d831ec7`](https://etherscan.io/address/0xdAC17F958D2ee523a2206206994597C13D831ec7).
The contract code for this contract is presented in [Appendix A](#appendix-a---tether-usd-contract).  As of August 
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
* `unpause` - unpauses the contract.  Caller must have the `Pauser` role.

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
* `transfer(to, amount)` - transfers tokens to another address. Fees get sent to the owner's account.  Neither party 
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
   in a decentralised manner, and transfers are facilitated by the Tari network, and are not processed by any centralised 
   entity, including the `issuer`.
4. The `issuer` has the following "administrator" powers:
    1. Create and authorise new accounts.
    2. Issue new tokens. The new tokens are credited to the `issuer`'s account.
    3. Redeem (burn) existing tokens. The burnt tokens are debited from the `issuer`'s account.
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
3. If any of the conditions in 2 are not met, the transaction is invalid and the validator node MUST reject the 
   transaction.

## Implementation
                                       
The broad strategy is as follows:
* Balances are stored in Pedersen commitments. The blinding factor is updated after every transaction and is a 
  function of a shared secret between the account holder and the issuer, and a public nonce, that is stored in the 
  account metadata.
* Users create a new account by interacting with the issuer. The issuer provides an account id that can be compared 
  against a white- and/or blacklist for the purposes of determining whether the account is valid.
* The full list of accounts form part of a whitelist. Only the issuer can modify the whitelist. 
* The blacklist, which only the issuer can modify.
* Spending authority rests solely with the account owner and required knowledge of the account private key.
* Every account contains a signature signed by both the issuer and account owner. This prevents blacklisted accounts 
  from copying signatures from other accounts to avoid sanction.
* Transfers are done in two-steps, via the issuance of an e-cheque by the sender, followed by the claiming of the 
  e-cheque by the recipient.
                
The remainder of this section describes the implementation in detail.

### Accounts

An account is described by the following struct:
    
```rust,ignore
pub type AccountId = PublicKey;

/// All fields are immutable, except for `owner`, `nonce` and `pending_deposits`.
struct StableCoinAccount {
    // The account owner's public key. Conveys spend authority
    owner: PublicKey,
    // A counter that is incremented after every transaction. Used to prevent replay attacks and to update the
    // balance commitment.
    nonce: u64,
    // A Pedersen commitment for the actual balance in the account
    balance: Commitment,
    // The secret key for the account id is shared between the issuer and account owner 
    account_id: AccountId,
    // A signature proving knowledge of the account private key and binding the account id to the account owner.
    issuer_signature: Signature,
    // A collection of pending deposits. Accounts owners must `claim` a deposit in order to update their balance.
    pending_deposits: Vec<ECheque>, 
}
```
   
Global management is handled by the `StableCoin` struct:

```rust,ignore
struct StableCoin {
    // A distributed hashmap of accounts, keyed by the account id
    accounts: DistributedCollection<AccountId, StableCoinAccount>,
    blacklisted_accounts: DistributedSet<AccountId>,
    issuer: PublicKey,
    account_public_key: PublicKey,
    symbol: String,
    issuer_balance: u64,
    total_supply: u64,
    nonce: u64,
    const ACCOUNT_DOMAIN: &'static [u8] = b"StableCoinAccount";
    const BALANCE_DOMAIN: &'static [u8] = b"StableCoinBalance";
}
```

Transfers are facilitated by e-cheques, which are written to recipients by senders and can be claimed by recipients 
at their convenience.
```rust,ignore
struct ECheque {
    sender: Pubkey,
    amount: Commitment,    
    encrypted_memo: Vec<u8>,
    signature: Signature,
    nonce: u64,
    rejected: bool,
    rejection_signature: Signature,
}
```

Accounts form a `DistributedCollection` object on the main `StableCoin` contract. The `DistributedCollection` is 
keyed by the `account_id` field.

An account MUST be created by called the `new_account` method on the `StableCoin` contract. No other instantiations of
an entry in the distributed collection is permitted.

### Balances
The j-th balance commitment for an account, updated after every transaction, `C_j` is of the form

```text
  C_j = κ_j.G + v_j.H
```

where 

* `κ_j` is the j-th blinding factor of the account, 
* `v_j` is the balance of the account, 
* and `G` and `H` are the standard generators.

### Derivation of blinding factor
The balance blinding factor, `κ_j` is derived as

```text
κ_j = H(BALANCE_DOMAIN || account_id_secret || j)
```

where `j` must always equal the current `nonce` of the account.

As described below the account id secret is a shared secret between the account holder and the issuer. As such only 
the issuer and the account holder can derive the blinding factor. 

The account owner typically knows the balance of the account, while the 
issuer can determine the balance by brute-forcing the discrete logarithm of the `v_i.H` term. Since `v_i` is bounded 
by zero and `total_supply`, this is a feasible operation. Moreover, there are additional heuristics available to 
make this operation even more straightforward, but they are not covered now.
                   
### The owner key
When creating a new account, a user generates a new random secret, `u_i`. This must be kept secure and is known only 
to the owner. They use the `owner` public key, `U_i = u_i.G` when requesting a new account via the `new_account` 
method.

### The account id
The issuer must maintain a list of all accounts that have been created on the stablecoin contract. When a user 
wishes to create a new account, the user must request one from the issuer using the `new_account` method, providing 
their [owner public key](#the-owner-key) along with the request. 

```rust,ignore
   pub fn new_account(user_pubkey: PublicKey) -> Result<AccountId, Error> {}
```

The issuer creates a new account id using a Diffie-Hellman key exchange with the user's public key, `U_i` and the 
issuer account secret, `a`. 

```text
a_i = H(ACCOUNT_DOMAIN || a.U_i)
```

The user can derive their account id secret, `a_i` using the same Diffie-Hellman key exchange with their secret, 
`u_i` and the `account_public_key`, `A`.

The public `account_id` is used 
* as an identifier for the account in the distributed account hashmap,
* along with the nonce, to derive the balance blinding factors.
                      
### New account creation

Upon a successful call to `new_account`, the issuer creates a new account entry in the distributed hashmap. The new 
account is initialised with the following values:

* `owner` - set to the user's public key, `U_i`.
* `nonce` - set to zero.
* `balance` - a commitment to zero using `κ_0` as blinding factor.
* `account_id` - set to the public account id, `A_i`.
* `issuer_signature` - the issuance signature, described below.
* `pending_deposits` - an empty vector.

The `issuer_signature` is a signature proving that the issuer has authorised the account creation and binds the 
account id to the user's public key. Validators MUST verify this signature before processing and transfers or claims 
from the account. The signature is a Schnorr signature, `(s,R)` signed by the `issuer` secret key of the message

```text
msg = H(NEW_ACCOUNT_DOMAIN || A_i || U_i)
```

Validators can validate the signature by checking that

```text
    s.G == R + msg.P
```

where `P` is the `issuer_public_key`.

### Transfers
           
Transfers are carried out in two parts. 
In the first part, the sender debits their own account by an `amount` and issues a bearer token in the name of the 
recipient. This token is added to the `pending_deposits` vector of the recipient's account.

In the second part, the recipient claims the deposit, which updates their balance commitment and destroys the bearer
token.

In this way, the taken acts like an e-cheque that can only be claimed by the recipient. The two-step approach is 
required because neither the sender, nor any validator has sufficient information to update the recipients balance. 
Only the recipient or in some implementations of the stablecoin contract, the issuer.

However, this model does have some benefits:
* The sender and recipient do not need to interact directly.
* Privacy is preserved.
* Before the recipient claims the deposit, the transaction is potentially reversible, making this stablecoin model 
  behave more like traditional financial systems.

#### Sending

A transfer is initiated by the sender calling the `transfer` method on the stablecoin contract.

```rust,ignore
pub fn transfer(
    &mut self, // The sender's account 
    recipient: AccountId, 
    amount: Commitment,
    /// An enrypted message to the recipient, containing:
    /// * the blinding factor for `amount` = κ_(j+1) - κ_j
    /// * the value of the transfer, up to 2^64
    /// * the length of the optional message field, up to 256 bytes
    /// * an optional message for the recipient, of length bytes.  
    encrypted_memo: Vec<u8>,
    signature: Signature,
    /// An aggregated ZK proof of:
    /// * the amount committing to a value in the range [0, 2^64]
    /// * the new balance committing to a value in the range [0, 2^64]
    /// * κ_j = H(BALANCE_DOMAIN || account_id_secret || j), where j = nonce+1
    aggregated_range_proof: Proof,
) {}
```

The `signature` is a Schnorr signature, `(s,R)` signed by the `owner` secret key of the message.

```text
    msg = H(TRANSFER_DOMAIN || owner || recipient || amount || encrypted_memo || new_nonce)
```



Validators MUST verify the following as part of validating the instruction:
* The sender's account is valid.
* The sender's account is not blacklisted.
* The recipient's account is valid.
* The recipient's account is not blacklisted.
* The `signature` is valid and signed by `owner`'s secret key.
* That `amount` is positive via the included range proof.
* That `new_nonce` is equal to the sender's `nonce` + 1.
* Calculate `new_balance` = `balance` - `amount`.
* That `new_balance` is positive via the included range proof.
* That the blinding factor for `new_balance` is correct, i.e. `κ_j = H(BALANCE_DOMAIN || account_id_secret || j)`,
  where `j` is the nonce of the sender's account plus one via the attached zero-knowledge proof.

If validation succeeds, the sender's account is updated as follows:
* `nonce` is incremented by one.
* `balance` is updated to `new_balance`.

The recipient's account is updated as follows:
* A new `ECheque` is created using the sender's public key, `amount`, `encrypted_memo`, `signature` and `new_nonce`.
* The `pending_deposits` vector is appended with the newly created e-cheque.

#### Claiming

A transfer is only considered complete once the recipient has claimed the deposit.

An account holder can claim a pending deposit by calling the `claim` method on the stablecoin contract, which 
destroys the supplied e-cheque and credits the user's balance with amount.

If the `rejected` field on the e-cheque is  `false`, ONLY the recipient may redeem the e-cheque.
If the `rejected` field on the e-cheque is  `true`, ONLY the sender may redeem the e-cheque.

The `encrypted_memo` is an encrypted message to the recipient, containing:
* the blinding factor for `amount` = κ_(j+1) - κ_j
* the value of the transfer, up to 2^64
* the length of the optional message field, up to 256 bytes
* an optional message for the recipient, of length bytes.

The memo is encrypted using a symmetric cipher, with a key derived from the shared secret between the sender and
recipient, and the transfer metadata:

```text
encryption_key = H(MEMO_DOMAIN || sender_secret*recipient_owner || amount || encrypted_memo || new_nonce)
= H(MEMO_DOMAIN || sender_secret*recipient_owner || amount || encrypted_memo || new_nonce)
```
                       
Claiming follows this procedure:

1. The recipient's wallet decrypted the `encrypted_memo` using the shared secret between the sender and recipient.
2. The recipient's wallet verifies that the blinding factor and value opens the commitment. If it does not, the 
   e-cheque is invalid and MAY be rejected. However, to avoid an attack vector where a malicious sender can flood a 
   victim with invalid e-cheques, forcing them to pay fees to reject them, the recipient SHOULD simply ignore the 
   deposit. A transfer is only considered complete once the recipient has claimed the deposit.
3. The recipient may use the memo's message, if present to match payments to invoices, for example.
4. The recipient creates a new commitment, using their own `nonce` and blinding factor `κ_(nonce+1) - κ_nonce`.
5. The recipient invokes the `claim` method to finalise the claim.

The `claim` method is defined as follows:

```rust,ignore
pub fn claim(
    &mut self,
    e_cheque: ECheque,
    amount: Commitment,
    /// An aggregated ZK proof of:
    /// * the value in the commitment matches the value in the e-cheque
    /// * the blinding factor is κ_(nonce+1) - κ_nonce
    aggregated_proof: Proof,
) {}
```

Validators MUST verify the following as part of validating the instruction:
* The recipient's account is valid.
* The recipient's account is not blacklisted.
* The `rejected` field on the e-cheque is `false`.
* That value in `amount` is equal tp the value in the e-cheque commitment.
* That the blinding factor for `amount` is correct, i.e. `κ_(nonce+1) - κ_nonce` via the attached zero-knowledge proof.

If validation succeeds, the recipient's account is updated as follows:
* `nonce` is incremented by one.
* `balance` is updated to `balance` + `amount`.
* The e-cheque is removed from `pending_deposits`.

#### Rejecting

An account holder can reject a pending deposit by calling the `reject` method on the stablecoin contract, which
effectively returns the e-cheque to the sender. The sender can then claim the deposit back into their account.

The recipient provides a signature when rejecting the deposit, which is verified by validator nodes when processing
the transaction. The signature is a Schnorr signature, `(s,R)` signed by the `owner` secret key of the message.

```text
    msg = H(REJECT_DOMAIN || sender || recipient || amount || encrypted_memo || new_nonce)
```

* Once a deposit has been rejected, it cannot be un-rejected.
* The recipient's nonce is _not_ incremented when rejecting a deposit.

Validators MUST verify the following as part of validating the instruction:
* The sender's account is valid.
* The sender's account is not blacklisted.
* The recipient's account is valid.
* The recipient's account is not blacklisted.
* The `signature` is valid and signed by the recipient.
* The `rejected` field on the e-cheque is `false`.
* That the `amount`, `sender`, `encrypted_memo` and `new_nonce` fields match the original e-cheque.

### Blacklisting

The issuer may blacklist an account by calling the `set_blacklist` method on the stablecoin contract. 

```rust,ignore
pub fn blacklist(&mut self, account_id: AccountId, signature: Signature) {}
```

Validators MUST verify the following as part of validating the instruction:
* The signature is valid and signed by `issuer`'s private key.
* `account_id` exists as a valid account.
* `account_id` is not already blacklisted.

If validation succeeds, the stablecoin object is updated to include `account_id` in the `blacklisted_accounts` set.

Removing an account from the blacklist follows a similar procedure:

```rust,ignore
pub fn unblacklist(&mut self, account_id: AccountId, signature: Signature) {}
```

Validators MUST verify the following as part of validating the instruction:
* The signature is valid and signed by `issuer`'s private key and contains the correct nonce.
* `account_id` exists as a valid account.
* `account_id` is blacklisted.

If validation succeeds, the stablecoin object is updated to remove `account_id` from the `blacklisted_accounts` set.
                    
Both operations increase the nonce of the issuer's account by one to prevent replay attacks.

### Minting and burning

The issuer may mint new tokens by calling the `mint` method on the stablecoin contract. 
Similarly, the issuer may burn tokens by calling the `burn` method on the stablecoin contract. 

```rust,ignore
pub fn mint(&mut self, amount: u64, nonce: u64, signature: Signature) {}
pub fn burn(&mut self, amount: u64, nonce: u64, signature: Signature) {}
```

In both cases, the signature signs the amount to be minted or burnt, and the nonce of the stablecoin account.

Validators MUST verify the following as part of validating the instruction:
* The signature is valid and signed by `issuer`'s private key and contains the correct nonce.
* The `amount` is positive.
* When burning, the `amount` is less than or equal to the balance of the issuer's account.

After validation, the issuer's account is updated as follows:
* The `nonce` is incremented by one.
* When minting, the `balance` is increased by `amount`.
* When burning, the `balance` is decreased by `amount`.
* The `total_supply` is adjusted by `amount`, depending on whether it is a burn or mint.

### Issuance

Transfers from the issuer to user accounts follows a different process to inter-account transfers because the issuer 
balance is always stored in the clear.

Since the issuer has access to the blinding factor of all accounts, they can unilaterally deposit funds into any
account, assuming that the Issuer is granted write-access to the relevant `StableCoin` account.

This is done with the `issue` method:

```rust,ignore
pub fn issue(
    &mut self, 
    recipient: &mut StableCoinAccount, 
    issuer_nonce: u64,
    recipient_nonce: u64,
    value: u64,
    /// the recipient's blinding factor for amount, equal to κ_(r+1) - κ_r, where r is the current recipient nonce
    blinding_factor: PublicKey, 
    signature: Signature, 
    proof: AggregatedProof) {}
```

Validators will confirm the following:
* `issuer_balance - amount` is greater than or equal to zero.
* The signature is valid and signed by `issuer`'s private key and contains the correct nonces for both the issuer 
  account and the recipient account.
* A proof in zero-knowledge that `recipient.balance + amount` has a value in the range [0, 2^64] and that the blinding 
  factor is correct, i.e. `H(BALANCE_DOMAIN || account_id_secret || r+1)`.
         
If verification succeeds, the stablecoin account is then modified as follows:
* The `issuer_nonce` is incremented by one.
* The `issuer_balance` is decreased by `amount`. 

The validator will then update the recipient's account as follows:
* The recipient's `nonce` is incremented by one.
* The recipient's `balance` is set to `balance + amount`. 

### Redemptions

Redemptions are performed using the `redeem` function on the StableCoin object. Redemptions are similar to transfers, 
except that the amount is in the clear, and the recipient is always the issuer.
The updating of the issuer's balance is carried out in a similar fashion to the [issuance](#issuance) process.
Taking custody of the underlying currency must happen off-chain and therefore is not covered in this document.

Usually a claim to the underlying currency can be made by pointing to a finalised transaction on-chain or through 
the inspection of event logs.

## Final notes

There are several variations of this contract that could be implemented. 

For example, if commitment blinding factors 
are not enacted via shared secrets, then the ability of the issuer to view balances unilaterally can be removed from 
the design.

The `transfer` function can be augmented to include dummy inputs and outputs, using a strategy similar to that used in 
[Lelantus Spark](https://ia.cr/2021/1173). This would obfuscate the the parties in a transfer, dramatically 
improving privacy. 

The use of e-cheques as the primary value transfer vehicle opens up many possibilities for adding additional margin 
of error to on-chain financial transactions. For example, e-cheques could have a holding time associated with them, 
to allow parties to validate payments out-of-band. They could have additional claim constraints, which would 
simplify escrow contracts and swap contracts while improving security. 

The ability for the Issuer to unilaterally deposit (or confiscate) funds into any account is typically controlled by 
Tari's access control system via bearer tokens. If this design were to be implemented on a different smart contract 
platform, then the issuer's ability to unilaterally modify account balances would need to be addressed specifically.



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





