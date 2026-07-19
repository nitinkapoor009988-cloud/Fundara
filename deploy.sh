#!/bin/bash
set -e

echo "Building contracts..."
cargo build --target wasm32-unknown-unknown --release

echo "Generating deployer keys..."
soroban keys generate deployer --network testnet || echo "Key deployer already exists"

echo "Funding deployer..."
soroban keys fund deployer --network testnet

echo "Deploying campaign-core..."
CORE_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/campaign_core.wasm \
  --source deployer \
  --network testnet)
echo "campaign-core deployed at: $CORE_ID"

echo "Deploying campaign-factory..."
FACTORY_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/campaign_factory.wasm \
  --source deployer \
  --network testnet)
echo "campaign-factory deployed at: $FACTORY_ID"

echo "Writing deployments.json..."
cat << EOF > deployments.json
{
  "network": "testnet",
  "campaign_core": "$CORE_ID",
  "campaign_factory": "$FACTORY_ID"
}
EOF
echo "Done!"
