#![cfg(test)]

use crate::{CampaignContract, CampaignContractClient, Error};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String,
};

fn setup_test() -> (Env, CampaignContractClient<'static>, Address, Address, token::Client<'static>, token::StellarAssetClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    
    // Create token
    let admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_client = token::Client::new(&env, &token_contract.address());
    let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());
    
    // Mint tokens
    token_admin.mint(&contributor, &1000);
    
    let contract_id = env.register_contract(None, CampaignContract);
    let client = CampaignContractClient::new(&env, &contract_id);
    
    (env, client, creator, contributor, token_client, token_admin)
}

#[test]
fn test_create_campaign_success() {
    let (env, client, creator, _contributor, token_client, _token_admin) = setup_test();
    let factory = Address::generate(&env);
    
    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    let data = client.get_campaign();
    assert_eq!(data.title, String::from_str(&env, "Test"));
    assert_eq!(data.goal, 100);
}

#[test]
fn test_contribute_increases_total() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = Address::generate(&env);
    
    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    client.contribute(&contributor, &50);
    
    let data = client.get_campaign();
    assert_eq!(data.total_raised, 50);
    
    let balance = token_client.balance(&client.address);
    assert_eq!(balance, 50);
}

#[test]
fn test_contribute_fails_after_deadline() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = Address::generate(&env);
    
    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    env.ledger().set_timestamp(1001);
    
    let result = client.try_contribute(&contributor, &50);
    assert_eq!(result, Err(Ok(Error::DeadlinePassed)));
}

#[soroban_sdk::contract]
pub struct MockFactoryContract;

#[soroban_sdk::contractimpl]
impl MockFactoryContract {
    pub fn update_status(_env: Env, _campaign: Address, _active: bool) {}
}

#[test]
fn test_withdraw_success_when_goal_met() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = env.register(MockFactoryContract, ());

    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    client.contribute(&contributor, &100);
    
    client.withdraw(&creator);
    
    let balance = token_client.balance(&creator);
    assert_eq!(balance, 100);
}

#[test]
fn test_withdraw_fails_when_goal_not_met() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = Address::generate(&env);
    
    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    client.contribute(&contributor, &50);
    
    let result = client.try_withdraw(&creator);
    assert_eq!(result, Err(Ok(Error::GoalNotReached)));
}

#[test]
fn test_refund_success_when_goal_not_met() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = Address::generate(&env);
    
    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    client.contribute(&contributor, &50);
    
    env.ledger().set_timestamp(1001);
    
    client.refund(&contributor);
    
    let balance = token_client.balance(&contributor);
    assert_eq!(balance, 1000); // 1000 initial - 50 + 50 refunded
}

#[test]
fn test_refund_fails_when_goal_met() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = env.register(MockFactoryContract, ());

    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    client.contribute(&contributor, &100); // Goal reached
    
    env.ledger().set_timestamp(1001);
    
    let result = client.try_refund(&contributor);
    assert_eq!(result, Err(Ok(Error::GoalReached)));
}

#[test]
fn test_unauthorized_withdraw_fails() {
    let (env, client, creator, contributor, token_client, _token_admin) = setup_test();
    let factory = Address::generate(&env);
    
    client.init(
        &factory,
        &creator,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_client.address,
    );
    
    let result = client.try_withdraw(&contributor);
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}
