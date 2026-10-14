#![no_std]

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env, String};

#[contract]
pub struct TraceabilityRegistry;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    AuthorizedActor(Address),
    EventCount(String),
    EventHash(String, u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    Unauthorized = 1,
    TooManyEvents = 2,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LotEventRecorded {
    #[topic]
    pub lot_id: String,
    #[topic]
    pub event_index: u32,
    pub event_hash: BytesN<32>,
}

#[contractimpl]
impl TraceabilityRegistry {
    pub fn __constructor(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn record_event(
        env: Env,
        actor: Address,
        lot_id: String,
        event_hash: BytesN<32>,
    ) -> Result<u32, Error> {
        actor.require_auth();
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::Unauthorized)?;
        let is_authorized = env
            .storage()
            .persistent()
            .get(&DataKey::AuthorizedActor(actor.clone()))
            .unwrap_or(false);
        if actor != admin && !is_authorized {
            return Err(Error::Unauthorized);
        }

        let count_key = DataKey::EventCount(lot_id.clone());
        let event_index: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        let next_index = event_index.checked_add(1).ok_or(Error::TooManyEvents)?;

        env.storage()
            .persistent()
            .set(&DataKey::EventHash(lot_id.clone(), event_index), &event_hash);
        env.storage().persistent().set(&count_key, &next_index);
        LotEventRecorded {
            lot_id,
            event_index,
            event_hash,
        }
        .publish(&env);

        Ok(event_index)
    }

    pub fn authorize_actor(env: Env, admin: Address, actor: Address) -> Result<(), Error> {
        admin.require_auth();
        Self::require_admin(&env, &admin)?;
        env.storage()
            .persistent()
            .set(&DataKey::AuthorizedActor(actor), &true);
        Ok(())
    }

    pub fn revoke_actor(env: Env, admin: Address, actor: Address) -> Result<(), Error> {
        admin.require_auth();
        Self::require_admin(&env, &admin)?;
        env.storage()
            .persistent()
            .remove(&DataKey::AuthorizedActor(actor));
        Ok(())
    }

    pub fn event_count(env: Env, lot_id: String) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::EventCount(lot_id))
            .unwrap_or(0)
    }

    pub fn event_hash(env: Env, lot_id: String, event_index: u32) -> Option<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::EventHash(lot_id, event_index))
    }
}

impl TraceabilityRegistry {
    fn require_admin(env: &Env, actor: &Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::Unauthorized)?;
        if &admin != actor {
            return Err(Error::Unauthorized);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;