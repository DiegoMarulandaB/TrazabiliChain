use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

#[test]
fn records_and_reads_append_only_event_hashes() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TraceabilityRegistry, (&admin,));
    let client = TraceabilityRegistryClient::new(&env, &contract_id);
    let lot_id = String::from_str(&env, "lot-001");
    let first_hash = BytesN::from_array(&env, &[1; 32]);
    let second_hash = BytesN::from_array(&env, &[2; 32]);

    assert_eq!(client.record_event(&admin, &lot_id, &first_hash), 0);
    assert_eq!(client.record_event(&admin, &lot_id, &second_hash), 1);
    assert_eq!(client.event_count(&lot_id), 2);
    assert_eq!(client.event_hash(&lot_id, &0), Some(first_hash));
    assert_eq!(client.event_hash(&lot_id, &1), Some(second_hash));
    assert_eq!(client.event_hash(&lot_id, &2), None);
}

#[test]
fn authorized_actor_can_record_and_revoked_actor_cannot() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let other_actor = Address::generate(&env);
    let contract_id = env.register(TraceabilityRegistry, (&admin,));
    let client = TraceabilityRegistryClient::new(&env, &contract_id);
    let lot_id = String::from_str(&env, "lot-002");
    let event_hash = BytesN::from_array(&env, &[3; 32]);

    assert_eq!(
        client.try_record_event(&other_actor, &lot_id, &event_hash),
        Err(Ok(Error::Unauthorized))
    );

    client.authorize_actor(&admin, &other_actor);
    assert_eq!(client.record_event(&other_actor, &lot_id, &event_hash), 0);
    client.revoke_actor(&admin, &other_actor);
    assert_eq!(
        client.try_record_event(&other_actor, &lot_id, &event_hash),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(client.event_count(&lot_id), 1);
}