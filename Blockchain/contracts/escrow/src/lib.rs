#![no_std]

#[cfg(test)]
extern crate std;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

/// Persistent storage entries are kept alive for ~30 days (assuming ~5s
/// ledgers) and bumped back up to that whenever an escrow is touched, so an
/// escrow that sits untouched doesn't get archived out from under an
/// in-progress deal.
const LEDGERS_PER_DAY: u32 = 17_280;
const ESCROW_TTL_THRESHOLD: u32 = LEDGERS_PER_DAY * 15;
const ESCROW_TTL_EXTEND_TO: u32 = LEDGERS_PER_DAY * 30;

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Created,
    Funded,
    Released,
    Refunded,
    Disputed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub buyer: Address,
    pub seller: Address,
    pub arbiter: Address,
    pub token: Address,
    pub amount: i128,
    pub status: EscrowStatus,
}

#[contracttype]
enum DataKey {
    Escrow(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyExists = 1,
    NotFound = 2,
    InvalidAmount = 3,
    InvalidStatus = 4,
    Unauthorized = 5,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Registers a new escrow agreement. Does not move funds — call `fund`
    /// afterwards to actually deposit `amount` of `token` into the contract.
    pub fn create_escrow(
        env: Env,
        id: u64,
        buyer: Address,
        seller: Address,
        arbiter: Address,
        token: Address,
        amount: i128,
    ) -> Result<(), Error> {
        buyer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Escrow(id);
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyExists);
        }

        let escrow = Escrow {
            buyer,
            seller,
            arbiter,
            token,
            amount,
            status: EscrowStatus::Created,
        };

        env.storage().persistent().set(&key, &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&key, ESCROW_TTL_THRESHOLD, ESCROW_TTL_EXTEND_TO);

        Ok(())
    }

    /// Buyer deposits the agreed `amount` of `token` into the contract,
    /// moving the escrow from `Created` to `Funded`.
    pub fn fund(env: Env, id: u64) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, id)?;
        escrow.buyer.require_auth();

        if escrow.status != EscrowStatus::Created {
            return Err(Error::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&escrow.buyer, &env.current_contract_address(), &escrow.amount);

        escrow.status = EscrowStatus::Funded;
        Self::write_escrow(&env, id, &escrow);

        Ok(())
    }

    /// Releases funds to the seller. Either the buyer (confirming delivery)
    /// or the arbiter (after resolving a dispute in the seller's favor via
    /// `resolve`) may trigger this from the `Funded` state.
    pub fn release(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let mut escrow = Self::require_escrow(&env, id)?;
        if caller != escrow.buyer && caller != escrow.arbiter {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::InvalidStatus);
        }

        Self::payout(&env, &escrow, &escrow.seller);
        escrow.status = EscrowStatus::Released;
        Self::write_escrow(&env, id, &escrow);

        Ok(())
    }

    /// Refunds the buyer. Either the seller (voluntarily backing out) or the
    /// arbiter (after resolving a dispute in the buyer's favor) may trigger
    /// this from the `Funded` state.
    pub fn refund(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let mut escrow = Self::require_escrow(&env, id)?;
        if caller != escrow.seller && caller != escrow.arbiter {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::InvalidStatus);
        }

        Self::payout(&env, &escrow, &escrow.buyer);
        escrow.status = EscrowStatus::Refunded;
        Self::write_escrow(&env, id, &escrow);

        Ok(())
    }

    /// Either party flags the escrow as disputed, freezing `release`/`refund`
    /// until the arbiter calls `resolve`.
    pub fn dispute(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let mut escrow = Self::require_escrow(&env, id)?;
        if caller != escrow.buyer && caller != escrow.seller {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::InvalidStatus);
        }

        escrow.status = EscrowStatus::Disputed;
        Self::write_escrow(&env, id, &escrow);

        Ok(())
    }

    /// Arbiter settles a disputed escrow, paying out to whichever side they
    /// decide in favor of.
    pub fn resolve(env: Env, id: u64, release_to_seller: bool) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, id)?;
        escrow.arbiter.require_auth();

        if escrow.status != EscrowStatus::Disputed {
            return Err(Error::InvalidStatus);
        }

        if release_to_seller {
            Self::payout(&env, &escrow, &escrow.seller);
            escrow.status = EscrowStatus::Released;
        } else {
            Self::payout(&env, &escrow, &escrow.buyer);
            escrow.status = EscrowStatus::Refunded;
        }
        Self::write_escrow(&env, id, &escrow);

        Ok(())
    }

    pub fn get_escrow(env: Env, id: u64) -> Result<Escrow, Error> {
        Self::require_escrow(&env, id)
    }

    fn require_escrow(env: &Env, id: u64) -> Result<Escrow, Error> {
        let key = DataKey::Escrow(id);
        let escrow = env
            .storage()
            .persistent()
            .get::<DataKey, Escrow>(&key)
            .ok_or(Error::NotFound)?;

        env.storage()
            .persistent()
            .extend_ttl(&key, ESCROW_TTL_THRESHOLD, ESCROW_TTL_EXTEND_TO);

        Ok(escrow)
    }

    fn write_escrow(env: &Env, id: u64, escrow: &Escrow) {
        let key = DataKey::Escrow(id);
        env.storage().persistent().set(&key, escrow);
        env.storage()
            .persistent()
            .extend_ttl(&key, ESCROW_TTL_THRESHOLD, ESCROW_TTL_EXTEND_TO);
    }

    fn payout(env: &Env, escrow: &Escrow, to: &Address) {
        let token_client = token::Client::new(env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), to, &escrow.amount);
    }
}

#[cfg(test)]
mod test;
