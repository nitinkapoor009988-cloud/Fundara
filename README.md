# StellarFund — Decentralized Crowdfunding on Stellar

A complete, production-ready decentralized crowdfunding platform on the Stellar network using Soroban smart contracts.
This project fulfills the "Level 3 - Orange Belt" submission requirements.

## 🌟 Architecture & Features

StellarFund allows users to create fundraising campaigns with a specific goal and deadline. Contributors can fund campaigns using native XLM. The platform uses a dual-contract architecture:
1. **Campaign Factory**: A registry that deploys and tracks all campaign instances.
2. **Campaign Core**: The individual campaign logic handling contributions, refunds, and withdrawals.

### Tech Stack
| Component | Technology |
|---|---|
| Smart Contracts | Rust, Soroban SDK |
| Frontend | Next.js, React, Tailwind CSS |
| Wallet | Freighter API |
| Network Interaction | `@stellar/stellar-sdk` |
| CI/CD | GitHub Actions |

### Level 3 Requirements Checklist
- [x] **Advanced Smart Contracts**: Dual contract architecture (Factory + Core).
- [x] **Inter-contract communication**: `campaign-core` calls `campaign-factory` to update status, and `campaign-core` calls the Stellar Asset Contract (SAC) to transfer funds.
- [x] **Event streaming**: Contract emits structured events (`campaign_created`, `contribution_made`, etc.) and frontend can poll for updates.
- [x] **CI/CD**: GitHub Actions workflows (`ci.yml` and `deploy.yml`) setup for testing and testnet deployment.
- [x] **Mobile-responsive frontend**: Tailwind CSS used for breakpoints (`sm:`, `md:`, `lg:`).
- [x] **Full test coverage**: 10+ tests covering both factory and core contracts.
- [x] **Complete documentation**: This README detailing architecture, setup, and deployment.

## 🚀 Inter-contract Communication
When a campaign reaches its goal, the `campaign-core` contract automatically invokes the `update_status` function on the `campaign-factory` contract using `env.invoke_contract()`. This ensures the factory's global registry is always in sync with the individual campaign state without requiring an extra transaction from the user.

## ⚡ Event Streaming & Real-time Updates
Every state change in the contract emits a Soroban event. On the frontend, we utilize the Soroban RPC `getEvents` method to fetch the latest events and provide a live activity feed of recent contributions, giving a real-time, dynamic feel to the application without manual page refreshes.

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Rust & Cargo
- `soroban-cli`

### Contracts
1. Navigate to the project root.
2. Build contracts:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```
3. Run tests:
   ```bash
   cargo test
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## 🌐 Testnet Deployment

| Contract | Address | Explorer Link |
|---|---|---|
| Campaign Factory | `CDNPA5J2X5PODOALFB2REFPLZE2O5TM5P2OTBZJEDE6PDGF2JZAD7AIY` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDNPA5J2X5PODOALFB2REFPLZE2O5TM5P2OTBZJEDE6PDGF2JZAD7AIY) |
| Campaign Core (Wasm) | `CBK5YJBZ5HGWEMVE3YMBX4FSBM55FLQI5AVIEPF2IUYM35REV2SU6BLW` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBK5YJBZ5HGWEMVE3YMBX4FSBM55FLQI5AVIEPF2IUYM35REV2SU6BLW) |

**Example Transaction Hash**: `TODO: Add tx hash after testnet deployment`

## 📸 Screenshots & Demo

- **Mobile Responsive UI**: ![Mobile Responsive UI](./image.png)
- **Test Output (Passing)**: ![Test Output](./image-1.png)
- **CI/CD Workflow (Passing)**: ![CI/CD Workflow](./image-2.png)
- **Live Demo Website Link**: [https://fundara-chi.vercel.app/](https://fundara-chi.vercel.app/)
- **Demo Video (1-2 min)**: [Watch Demo Video](https://photos.app.goo.gl/We9LJBW1VWLQjNNP9)

## ⚠️ Known Limitations / Future Work
- Support for custom SEP-41 tokens alongside XLM.
- WebSocket relay for events instead of RPC polling to reduce load.

## 📄 License
MIT
