#![no_std]
mod test;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, IntoVal, String, Symbol
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    DeadlinePassed = 3,
    DeadlineNotPassed = 4,
    GoalReached = 5,
    GoalNotReached = 6,
    Unauthorized = 7,
    NoFundsToWithdraw = 8,
    NoContribution = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignData {
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub goal: i128,
    pub deadline: u64,
    pub token: Address,
    pub total_raised: i128,
    pub active: bool,
    pub factory: Address,
}

#[contracttype]
pub enum DataKey {
    CampaignData,
    Contribution(Address),
}

const CAMPAIGN_STATUS_CHANGED: Symbol = symbol_short!("stat_chg");
const CONTRIBUTION_MADE: Symbol = symbol_short!("contrib");
const FUNDS_WITHDRAWN: Symbol = symbol_short!("withdraw");
const REFUND_ISSUED: Symbol = symbol_short!("refund");

#[contract]
pub struct CampaignContract;

#[contractimpl]
impl CampaignContract {
    pub fn init(
        env: Env,
        factory: Address,
        creator: Address,
        title: String,
        description: String,
        goal: i128,
        deadline: u64,
        token: Address,
    ) -> Result<(), Error> {
        if env.storage().persistent().has(&DataKey::CampaignData) {
            return Err(Error::AlreadyInitialized);
        }

        let data = CampaignData {
            creator,
            title,
            description,
            goal,
            deadline,
            token,
            total_raised: 0,
            active: true,
            factory,
        };
        
        env.storage().persistent().set(&DataKey::CampaignData, &data);
        env.storage().persistent().extend_ttl(&DataKey::CampaignData, 3110400, 3110400); // approx 30 days
        Ok(())
    }

    pub fn contribute(env: Env, contributor: Address, amount: i128) -> Result<(), Error> {
        contributor.require_auth();

        let mut data: CampaignData = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignData)
            .ok_or(Error::NotInitialized)?;

        if env.ledger().timestamp() > data.deadline {
            return Err(Error::DeadlinePassed);
        }

        let token = token::Client::new(&env, &data.token);
        token.transfer(&contributor, &env.current_contract_address(), &amount);

        data.total_raised = data.total_raised.checked_add(amount).unwrap();
        env.storage().persistent().set(&DataKey::CampaignData, &data);

        let key = DataKey::Contribution(contributor.clone());
        let current_contrib: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &current_contrib.checked_add(amount).unwrap());
        env.storage().persistent().extend_ttl(&key, 3110400, 3110400);

        env.events().publish((CONTRIBUTION_MADE, contributor), amount);

        // Notify factory of status change (inter-contract call) if goal reached
        if data.active && data.total_raised >= data.goal {
            let mut updated_data = data.clone();
            updated_data.active = false;
            env.storage().persistent().set(&DataKey::CampaignData, &updated_data);
            env.events().publish((CAMPAIGN_STATUS_CHANGED, false), updated_data.total_raised);
            
            // Invoke factory contract
            // Factory must have a method `update_status(campaign_id, active)`
            // However, core doesn't know its own ID in the factory, factory tracks by address
            env.invoke_contract::<()>(
                &data.factory,
                &Symbol::new(&env, "update_status"),
                (env.current_contract_address(), false).into_val(&env),
            );
        }

        Ok(())
    }

    pub fn withdraw(env: Env, creator: Address) -> Result<(), Error> {
        creator.require_auth();

        let mut data: CampaignData = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignData)
            .ok_or(Error::NotInitialized)?;

        if creator != data.creator {
            return Err(Error::Unauthorized);
        }

        if data.total_raised < data.goal {
            return Err(Error::GoalNotReached);
        }

        if data.total_raised == 0 {
            return Err(Error::NoFundsToWithdraw);
        }

        let amount_to_withdraw = data.total_raised;
        data.total_raised = 0;
        data.active = false;
        env.storage().persistent().set(&DataKey::CampaignData, &data);

        let token = token::Client::new(&env, &data.token);
        token.transfer(&env.current_contract_address(), &creator, &amount_to_withdraw);

        env.events().publish((FUNDS_WITHDRAWN, creator), amount_to_withdraw);

        // Update factory status if it was active
        if data.active {
            env.invoke_contract::<()>(
                &data.factory,
                &Symbol::new(&env, "update_status"),
                (env.current_contract_address(), false).into_val(&env),
            );
        }

        Ok(())
    }

    pub fn refund(env: Env, contributor: Address) -> Result<(), Error> {
        contributor.require_auth();

        let data: CampaignData = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignData)
            .ok_or(Error::NotInitialized)?;

        if env.ledger().timestamp() <= data.deadline {
            return Err(Error::DeadlineNotPassed);
        }

        if data.total_raised >= data.goal {
            return Err(Error::GoalReached);
        }

        let key = DataKey::Contribution(contributor.clone());
        let amount: i128 = env.storage().persistent().get(&key).unwrap_or(0);

        if amount == 0 {
            return Err(Error::NoContribution);
        }

        env.storage().persistent().set(&key, &0_i128);

        let token = token::Client::new(&env, &data.token);
        token.transfer(&env.current_contract_address(), &contributor, &amount);

        env.events().publish((REFUND_ISSUED, contributor), amount);

        Ok(())
    }

    pub fn get_campaign(env: Env) -> Result<CampaignData, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::CampaignData)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_contribution(env: Env, contributor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Contribution(contributor))
            .unwrap_or(0)
    }
}
