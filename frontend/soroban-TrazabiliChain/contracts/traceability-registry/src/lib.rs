#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    String,
};

const TTL_THRESHOLD: u32 = 100_000;
const TTL_EXTEND_TO: u32 = 500_000;

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
        Self::extend_instance_ttl(&env);
    }

    pub fn record_event(
        env: Env,
        actor: Address,
        lot_id: String,
        event_hash: BytesN<32>,
    ) -> Result<u32, Error> {
        Self::extend_instance_ttl(&env);
        actor.require_auth();
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::Unauthorized)?;
        let authorization_key = DataKey::AuthorizedActor(actor.clone());
        let is_authorized = env
            .storage()
            .persistent()
            .get(&authorization_key)
            .unwrap_or(false);
        if is_authorized {
            env.storage()
                .persistent()
                .extend_ttl(&authorization_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        }
        if actor != admin && !is_authorized {
            return Err(Error::Unauthorized);
        }

        let count_key = DataKey::EventCount(lot_id.clone());
        let event_index: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        if event_index > 0 {
            env.storage()
                .persistent()
                .extend_ttl(&count_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        }
        let next_index = event_index.checked_add(1).ok_or(Error::TooManyEvents)?;

        let hash_key = DataKey::EventHash(lot_id.clone(), event_index);
        env.storage().persistent().set(&hash_key, &event_hash);
        env.storage()
            .persistent()
            .extend_ttl(&hash_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage().persistent().set(&count_key, &next_index);
        env.storage()
            .persistent()
            .extend_ttl(&count_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        LotEventRecorded {
            lot_id,
            event_index,
            event_hash,
        }
        .publish(&env);

        Ok(event_index)
    }

    pub fn authorize_actor(env: Env, admin: Address, actor: Address) -> Result<(), Error> {
        Self::extend_instance_ttl(&env);
        admin.require_auth();
        Self::require_admin(&env, &admin)?;
        let key = DataKey::AuthorizedActor(actor);
        env.storage().persistent().set(&key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }

    pub fn revoke_actor(env: Env, admin: Address, actor: Address) -> Result<(), Error> {
        Self::extend_instance_ttl(&env);
        admin.require_auth();
        Self::require_admin(&env, &admin)?;
        env.storage()
            .persistent()
            .remove(&DataKey::AuthorizedActor(actor));
        Ok(())
    }

    pub fn event_count(env: Env, lot_id: String) -> u32 {
        Self::extend_instance_ttl(&env);
        let key = DataKey::EventCount(lot_id);
        let count = env.storage().persistent().get(&key).unwrap_or(0);
        if count > 0 {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        }
        count
    }

    pub fn event_hash(env: Env, lot_id: String, event_index: u32) -> Option<BytesN<32>> {
        Self::extend_instance_ttl(&env);
        let key = DataKey::EventHash(lot_id, event_index);
        let hash = env.storage().persistent().get(&key);
        if hash.is_some() {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        }
        hash
    }
}

impl TraceabilityRegistry {
    fn extend_instance_ttl(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
    }

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
