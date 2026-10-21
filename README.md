# Bakery Shop NFT

An interactive Web3 Decentralized Application (DApp) running on the Sepolia Ethereum Testnet, enabling users to mint, purchase, and collect unique bakery-themed Non-Fungible Tokens (NFTs) conforming to the ERC-721 standard.

Developed as part of the Data Security and Blockchain course (A.A. 2023–2024) at the University of Perugia (UniPG) – Department of Engineering.

---

## Project Overview

Bakery Shop NFT bridges real-world consumer concepts with blockchain technology by transforming daily bakery items (Coffee, Croissant, Muffin, Donut, Cupcake, Brownie) into unique digital collectibles (NFTs).

Designed to provide an intuitive Web3 experience, the application allows users to interact directly through a web browser using standard Web2 inputs and MetaMask wallet connection. Every item purchase triggers an automated, on-chain lottery mechanism that awards lucky buyers a complimentary free breakfast NFT.

---

## Key Features & System Architecture

### 1. ERC-721 Smart Contract (BakeryShop.sol)
- Standard Implementation: Built with Solidity (^0.8.20) extending OpenZeppelin ERC721URIStorage and Ownable contracts.
- Product Catalog: Supports 6 distinct product types with initial pricing set in Wei (e.g., Coffee @ 0.00029 ETH, Croissant @ 0.00049 ETH).
- Scarcity & Metadata Uniqueness: Capped at 9 rare NFTs per product type (54 total unique combinations). Metadata is hosted on Pinata (IPFS) with attributes defining Category, Filling (Pistachio, Chocolate, Custard), and Topping (Sprinkles, Coconut, Cream).
- Owner Privileges: Restock functionality (restockProductExternal) and token URI metadata assignments (setTokenURIExternal) are restricted to the contract owner via OpenZeppelin onlyOwner modifiers.
- On-Chain Gamified Lottery: Automatically executes upon product purchase using a block-hash algorithm (keccak256(block.timestamp, block.difficulty) % 100). A winning result (<10% threshold) awards a free Coffee + Croissant NFT pair.

### 2. DApp Frontend Architecture
- Web3 Integration: Communicates with the Sepolia Ethereum testnet using Web3.js and injected MetaMask provider.
- Authentication: Supports wallet connection via MetaMask.
- Interactive UI: Real-time modal notifications for transaction pending states, restock alerts, lotto results, and recent customer activity carousels.
- OpenSea Testnet Compatibility: Purchased tokens can be imported into MetaMask and inspected directly on OpenSea Testnet with full IPFS metadata and image rendering.

---

## Repository Structure

```
bakeryShop/
├── DSBC_project.pdf               # Full academic report
├── README.md                      # Project documentation
└── bakery-shop-main/              # Main DApp Source Directory
    ├── .vscode/                   # VS Code settings
    ├── contracts/                 # Smart Contract directory
    │   ├── BakeryShop.sol         # Core ERC-721 Solidity Smart Contract
    │   ├── node_modules/          # OpenZeppelin contracts & dependencies
    │   └── .gitkeep               # Git placeholder
    ├── public/                    # Frontend Web Assets & Application Code
    │   ├── css/                   # Stylesheets
    │   ├── images/                # UI icons & artwork
    │   ├── js/                    # JavaScript logic (script.js with Web3.js)
    │   ├── json/                  # Local ABI definitions & product metadata
    │   ├── indexAuthentication.html # Web3 Auth Page
    │   └── owner.html             # Main Storefront & Admin Dashboard
    ├── .gitignore                 # Git ignore
    ├── package.json               # Node.js manifest
    └── package-lock.json          # Node.js dependency lockfile
```

---

## Tech Stack & Tools

- Smart Contract & Blockchain: Solidity (^0.8.20), OpenZeppelin, Remix IDE, Sepolia Testnet.
- Frontend & Web3: HTML5, CSS3, JavaScript (ES6+), Web3.js, Live Server.
- Wallet & Storage: MetaMask, Pinata (IPFS), OpenSea Testnet.

---

## How to Run Locally

1. Install MetaMask browser extension and connect to Sepolia Test Network.
2. Clone this repository and open the bakery-shop-main folder in VS Code.
3. Launch the local web server using Live Server on public/indexAuthentication.html.
4. Connect your MetaMask wallet when prompted and interact with the storefront!

---

## Authors & Academic Credits

- Course: Data Security and Blockchain (A.A. 2023–2024)
- Degree: B.S. in Computer and Electronics Engineering
- Institution: Department of Engineering, University of Perugia (UniPG)
- Instructor: Prof. Luca Grilli
- Author: Aurora Traversini (Student ID: 361600)
