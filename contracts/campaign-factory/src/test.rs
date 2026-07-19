#![cfg(test)]

use crate::{CampaignFactory, CampaignFactoryClient};
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env, String,
};

mod campaign_core_wasm {
    soroban_sdk::contractimport!(
        file = "../../build_target/wasm32-unknown-unknown/release/campaign_core.wasm"
    );
}

use campaign_core::CampaignContractClient;

#[test]
fn test_create_campaign() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    
    // Register factory
    let factory_id = env.register(CampaignFactory, ());
    let factory_client = CampaignFactoryClient::new(&env, &factory_id);

    // Get the WASM hash for CampaignContract
    let wasm_hash = env.deployer().upload_contract_wasm(campaign_core_wasm::WASM);
    
    // Create token
    let admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(admin);
    
    let title = String::from_str(&env, "My First Campaign");
    
    let campaign_addr = factory_client.create_campaign(
        &wasm_hash,
        &creator,
        &title,
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_contract.address(),
    );

    let campaigns = factory_client.get_campaigns();
    assert_eq!(campaigns.len(), 1);
    
    let meta = campaigns.get(0).unwrap();
    assert_eq!(meta.creator, creator);
    assert_eq!(meta.title, title);
    assert_eq!(meta.goal, 100);
    assert_eq!(meta.active, true);
    
    // Verify core contract was initialized
    let core_client = CampaignContractClient::new(&env, &campaign_addr);
    let data = core_client.get_campaign();
    assert_eq!(data.title, title);
    assert_eq!(data.goal, 100);
}

#[test]
fn test_inter_contract_call_updates_factory_status() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    
    let factory_id = env.register(CampaignFactory, ());
    let factory_client = CampaignFactoryClient::new(&env, &factory_id);

    let wasm_hash = env.deployer().upload_contract_wasm(campaign_core_wasm::WASM);
    
    let admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());
    
    token_admin.mint(&contributor, &1000);
    
    let title = String::from_str(&env, "Campaign");
    
    let campaign_addr = factory_client.create_campaign(
        &wasm_hash,
        &creator,
        &title,
        &String::from_str(&env, "Desc"),
        &100,
        &1000,
        &token_contract.address(),
    );

    // Initial state: active
    let campaigns = factory_client.get_campaigns();
    assert_eq!(campaigns.get(0).unwrap().active, true);
    
    // Goal reached
    let core_client = CampaignContractClient::new(&env, &campaign_addr);
    core_client.contribute(&contributor, &100);
    
    // Inter-contract call should have updated factory
    let campaigns_after = factory_client.get_campaigns();
    assert_eq!(campaigns_after.get(0).unwrap().active, false);
}
