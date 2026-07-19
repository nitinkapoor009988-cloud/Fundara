#![no_std]
mod test;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, IntoVal, String, Symbol, Vec,
};
use soroban_sdk::xdr::ToXdr;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignMeta {
    pub campaign_address: Address,
    pub creator: Address,
    pub title: String,
    pub goal: i128,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Campaigns,
}

const CAMPAIGN_CREATED: Symbol = symbol_short!("created");

#[contract]
pub struct CampaignFactory;

#[contractimpl]
impl CampaignFactory {
    pub fn create_campaign(
        env: Env,
        wasm_hash: BytesN<32>,
        creator: Address,
        title: String,
        description: String,
        goal: i128,
        deadline: u64,
        token: Address,
    ) -> Address {
        creator.require_auth();

        // Deploy the core campaign contract instance
        let salt = env.crypto().keccak256(&title.clone().to_xdr(&env));
        let campaign_address = env
            .deployer()
            .with_current_contract(salt)
            .deploy(wasm_hash);

        // Initialize it
        env.invoke_contract::<()>(
            &campaign_address,
            &Symbol::new(&env, "init"),
            (
                env.current_contract_address(),
                creator.clone(),
                title.clone(),
                description,
                goal,
                deadline,
                token,
            )
                .into_val(&env),
        );

        let meta = CampaignMeta {
            campaign_address: campaign_address.clone(),
            creator: creator.clone(),
            title: title.clone(),
            goal,
            active: true,
        };

        let mut campaigns: Vec<CampaignMeta> = env
            .storage()
            .persistent()
            .get(&DataKey::Campaigns)
            .unwrap_or(Vec::new(&env));
            
        campaigns.push_back(meta);
        env.storage().persistent().set(&DataKey::Campaigns, &campaigns);
        env.storage().persistent().extend_ttl(&DataKey::Campaigns, 3110400, 3110400);

        env.events().publish((CAMPAIGN_CREATED, creator), campaign_address.clone());

        campaign_address
    }

    pub fn get_campaigns(env: Env) -> Vec<CampaignMeta> {
        env.storage()
            .persistent()
            .get(&DataKey::Campaigns)
            .unwrap_or(Vec::new(&env))
    }

    pub fn update_status(env: Env, campaign: Address, active: bool) {
        // Inter-contract call target from core contract
        let mut campaigns: Vec<CampaignMeta> = env
            .storage()
            .persistent()
            .get(&DataKey::Campaigns)
            .unwrap_or(Vec::new(&env));

        let mut index = None;
        for (i, meta) in campaigns.iter().enumerate() {
            if meta.campaign_address == campaign {
                index = Some(i);
                break;
            }
        }

        if let Some(i) = index {
            let mut meta = campaigns.get(i as u32).unwrap();
            meta.active = active;
            campaigns.set(i as u32, meta);
            env.storage().persistent().set(&DataKey::Campaigns, &campaigns);
        }
    }
}
