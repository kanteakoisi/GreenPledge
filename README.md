# 🌍 GreenPledge: Blockchain-Based Carbon Credit Marketplace

Welcome to GreenPledge, a decentralized platform built on the Stacks blockchain to tackle climate change by enabling a transparent, secure, and accessible marketplace for carbon credits! This Web3 project addresses the real-world problem of environmental degradation by allowing individuals, businesses, and organizations to offset their carbon footprint through verified carbon credit purchases, with funds directly supporting sustainable projects.

Using Clarity smart contracts, GreenPledge ensures that carbon credits are authentic, traceable, and fairly traded, preventing fraud and double-spending while promoting trust in the carbon market. Donors can fund eco-friendly initiatives, and project owners can verify and monetize their carbon offsets, all on-chain for maximum transparency.

## ✨ Features

🔒 Transparent carbon credit issuance and trading  
💸 Crowdfunding for verified green projects (e.g., reforestation, renewable energy)  
📋 Project verification with on-chain proof of impact  
🗳️ Community governance for approving green projects  
🎯 Milestone-based fund releases to ensure project delivery  
📊 Real-time tracking of carbon offset impact  
🚫 Anti-fraud measures with unique credit IDs and hash-based proofs  
✅ Instant verification of credit authenticity  

## 🛠 How It Works

**For Buyers (Carbon Credit Purchasers)**  
- Purchase carbon credits using STX or tokens via the `buy-credits` function.  
- Receive governance tokens to vote on new green project proposals.  
- Track credit authenticity and project impact with `get-credit-details` and `verify-impact` calls.  

**For Project Owners**  
- Submit green projects with verifiable impact metrics (e.g., CO2 sequestered) using `submit-project`.  
- Generate unique carbon credit IDs with a hash of project data.  
- Receive funds upon milestone completion, verified by `verify-milestone`.  

**For Verifiers**  
- Use `get-project-details` to review project data and impact.  
- Call `verify-credit` to confirm the authenticity of purchased credits.  

## 📜 Smart Contracts (Clarity)

GreenPledge uses 7 Clarity smart contracts to power the platform:

1. **credit-registry.clar**  
   Registers carbon credits with unique IDs and project metadata (hash, CO2 offset, timestamp).  
   Functions: `register-credit`, `get-credit-details`, `verify-credit`.  

2. **project-registry.clar**  
   Manages green project submissions and verification.  
   Functions: `submit-project`, `get-project-details`, `update-project-status`.  

3. **funding-pool.clar**  
   Handles crowdfunding contributions for projects.  
   Functions: `donate`, `withdraw-funds`, `get-pool-balance`.  

4. **governance.clar**  
   Enables token-based voting for project approvals.  
   Functions: `issue-governance-tokens`, `vote-on-project`, `get-vote-results`.  

5. **milestone-manager.clar**  
   Tracks and verifies project milestones for fund releases.  
   Functions: `set-milestone`, `verify-milestone`, `release-funds`.  

6. **credit-marketplace.clar**  
   Facilitates buying and selling of carbon credits.  
   Functions: `buy-credits`, `sell-credits`, `get-market-stats`.  

7. **impact-verifier.clar**  
   Verifies project impact and prevents double-spending of credits.  
   Functions: `verify-impact`, `flag-fraud`, `get-impact-report`.  

## 🚀 Getting Started

1. **Deploy Contracts**: Deploy the Clarity contracts on the Stacks blockchain using the Stacks CLI.  
2. **Register Projects**: Project owners submit green projects with impact metrics.  
3. **Fund Projects**: Donors contribute STX to funding pools.  
4. **Trade Credits**: Buyers purchase carbon credits; project owners receive funds upon milestone verification.  
5. **Track Impact**: Use on-chain queries to monitor project progress and credit authenticity.  

## 🔐 Security Features

- **Unique Hashes**: Each credit and project is tied to a SHA-256 hash to prevent duplication.  
- **Immutable Records**: All transactions and verifications are stored on-chain.  
- **Governance Checks**: Community voting ensures only legitimate projects are funded.  
- **Milestone Locks**: Funds are released only after verified milestones, reducing fraud risk.  

## 📊 Future Enhancements

- Off-chain dashboards for real-time analytics.  
- Integration with IoT devices for automated impact reporting.  
- Support for tokenized rewards for repeat donors.  

GreenPledge empowers everyone to fight climate change with trust and transparency. Join the movement!
