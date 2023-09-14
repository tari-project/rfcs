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
   1. Issue new tokens. The new tokens are credited to the `issuer`'s account.
   2. Redeem (burn) existing tokens. The burnt tokens are debited from the `issuer`'s account.
   3. Have access to the full list of account ids. 
   4. Blacklist an account. Blacklisted accounts are not allowed to send, or receive, tokens.
   5. Remove an account from the blacklist.
   6. Create or authorise new accounts.
5. Account-holders have the following abilities:
   1. View their own balance.
   2. If their account is not blacklisted, transfer funds to any other (non-blacklisted) account.
6. General users:
   1. Cannot see the balance of any account (other than their own).
   2. Can see the total supply of tokens in circulation.
   3. Can apply for a new account by interacting with the `issuer`.
7. The possibility of the issuer charging a fee for transfers is not considered in this design.
8. The issuer cannot unilaterally view the balance of account holders.
9. The issuer cannot unilaterally spend or seize funds from any account holder.

Validator nodes validate all stablecoin transactions. In particular:
1. Validator nodes cannot determine the value of any transaction.
2. Validator nodes do not know which accounts are parties to the transaction.
3. However, they _are_ able to, and MUST verify that 
   1. no coins are created or destroyed in the transaction, i.e. the sum of the parties' balances before and after 
      the transfer are equal. 
   2. the transfer value is positive,
   3. the sender has a positive balance after the transaction,
   4. the sender has authorised the transaction,
   5. the sending party holds a valid account,
   6. the sending party is not on the blacklist,
   7. the receiving party holds a valid account,
   8. the receiving party is not on the blacklist.
4. If any of the conditions in 3 are not met, the transaction is invalid and the validator node MUST reject the 
   transaction.

## Implementation
                                       
The broad strategy is as follows:
* Balances are stored in Pedersen commitments.
* Users create a new account by interacting with the issuer. The issuer provides an account id that is 
  cryptographically bound to the balance commitment.
* The full list of accounts form part of a whitelist. Only the issuer can modify the whitelist. It is represented by 
  an accumulator, and a membership proof is used to satisfy requirement 3.5 and 3.7 above.
* The blacklist, which only the issuer can modify, is represented by an accumulator. A non-inclusion proof is used to 
  satisfy requirement 3.6 and 3.8 above.

### Accounts

An account is described by the following struct:
    
```rust
struct StablecoinAccount {
    owner: PublicKey,
    balance: Commitment,
    blacklisted: bool,   
}
```

Accounts form a `DistributedCollection` object on the main `StableCoin` contract. The `DistributedCollection` is 
keyed by the `owner` field.

An account MUST be created by called the `new_account` method on the `StableCoin` contract. No other instantiations of
an entry in the distributed collection is permitted.

The balance commitment, `C_i` is of the form

```
  C_i = κ_i.G + v_i.H
```

where 

* `κ_i` is the private spend key of the account, 
* `v_i` is the balance of the account, 
* and `G` and `H` are the standard generators.

## Derivation of spend key
The private spend key, `κ_i` is a shared secret between the account holder and the `issuer`.

When creating a new account, a user generates a new random secret, `u_i`. This must be kept secure.
They use the user public key, `U_i = u_i.G` when requesting a new account via the `new_account` method:

```rust
   pub fn new_account(user_pubkey: PublicKey) -> Result<AccountId, Error> {}
   pub type AccountId = PublicKey;
```

The user can derive the spend key,  `κ_i`, by deriving the shared secret using Diffie-Hellman key exchange with the 
supplied account key, `A_i`:

`κ_i = H(SPEND_KEY_DOMAIN || u_i.A_i)`

The `SPEND_KEY_DOMAIN` is a constant defined in the contract and is introduced to provide proper domain separation.

### The account id
When a new account is created, the `new_account` method returns the account id, `A_i`. The account id is generated 
by the issuer such that `A_i = k_i.G`.

#### Implementation notes
The issuer can pre-generate a long list of public keys offline, and then assign them to users as they request new
accounts via `new_account`. This allows the issuer to create accounts without having to be online. As the list gets 
depleted, the issuer can supplement the list with new keys as needed.

Do not use non-hardened BIP32 derivation of an extended public key for creating user keys, since a leak of any one of
the keys would reveal all other private keys.

Alternatively, account issuance could be done offline and interactively. In this case, the issuer can optionally use 
PII to link a user to a given account id. This is antithetical to privacy, obviously, but may become a requirement 
for stablecoin issuance.

The issuer must keep the list of private account keys offline and secure. 


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





