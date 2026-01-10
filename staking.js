// =====================
// Utility function to log to page
// =====================
function logToPage(message, isError = false) {
    let logContainer = document.getElementById("debugLog");
    if (!logContainer) {
        logContainer = document.createElement("div");
        logContainer.id = "debugLog";
        logContainer.style.cssText =
            "position:fixed;bottom:0;left:0;width:100%;max-height:200px;overflow:auto;background:#111;color:#0f0;font-family:monospace;font-size:12px;padding:5px;z-index:9999;";
        document.body.appendChild(logContainer);
    }
    const entry = document.createElement("div");
    entry.textContent = message;
    if (isError) entry.style.color = "#f00";
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// =====================
// Global variables
// =====================
let provider;
let signer;
let userAddress;
let stakingContract;
let stakingContractRO;
let nftContractRO;
let selectedNFT = null;
let nftContract;
let loadingNFTs = false;


const stakingContractAddress = "0x8AC5f61bCe8D3b0766ADD7392F30aA254b285221";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// =====================
// ABIs
// =====================
const stakingABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Staked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Unstaked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"yam","type":"address"}],"name":"YamSet","type":"event"},{"inputs":[],"name":"BASE_YEARLY_EMISSION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_PER_NFT_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"year","type":"uint256"}],"name":"baseEmission","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"claimAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"currentAPY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"emittedPerYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastProcessedYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nft","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"pending","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"pendingBatch","outputs":[{"internalType":"uint256","name":"total","type":"uint256"},{"internalType":"uint256[]","name":"perNFT","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"year","type":"uint256"}],"name":"remainingEmission","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_yam","type":"address"}],"name":"setYam","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalMinted","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userStaked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}];

const nftABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "o", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "ownerAddress", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "tokenURI",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "o", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "getApproved",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "s", "type": "address" },
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "o", "type": "address" },
      { "internalType": "address", "name": "op", "type": "address" }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "op", "type": "address" },
      { "internalType": "bool", "name": "a", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
    "name": "tokenByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];




// =====================
// Connect Wallet
// =====================
async function connectWallet() {
    try {
        if (!window.ethereum) throw new Error("No wallet detected");
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        document.getElementById("walletAddress").textContent =
            userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
        logToPage("Wallet connected: " + userAddress);

        // Read-only contracts
        stakingContractRO = new ethers.Contract(stakingContractAddress, stakingABI, provider);
        // Signer contract
        stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, signer);
// NFT contracts (read-only and signer)
nftContractRO = new ethers.Contract(nftAddress, nftABI, provider);
nftContract = new ethers.Contract(nftAddress, nftABI, signer);
window.nftContract = nftContract; // optional, for global access

          
        // Event listeners
        stakingContractRO.removeAllListeners();
        stakingContractRO.on("Staked", async () => await loadUserNFTs());
        stakingContractRO.on("Unstaked", async () => await loadUserNFTs());
        stakingContractRO.on("Claimed", async () => await loadUserNFTs());

        document.getElementById("stakeBtn").disabled = true;
        document.getElementById("unstakeBtn").disabled = true;
        document.getElementById("claimAllBtn").disabled = false;

        logToPage("Contracts instantiated");
        await loadUserNFTs();
        await updateGlobalStats();
    } catch (err) {
        logToPage("Wallet connection failed: " + err.message, true);
    }
}


async function renderNFT(tokenId, container, isStaked) {
    try {
        const tokenURI = await nftContractRO.tokenURI(tokenId);

// 1️⃣ parse base64 JSON to get image
let imageURI;
if (tokenURI.startsWith("data:application/json")) {
    const json = JSON.parse(atob(tokenURI.split(",")[1]));
    imageURI = json.image; // THIS IS THE SVG
} else {
    imageURI = tokenURI; // fallback in case of URL
}

const img = document.createElement("img");
img.src = imageURI;
img.style.width = "120px";
img.style.height = "120px";


        const card = document.createElement("div");
        card.className = "nft-card";
        card.dataset.tokenId = tokenId;
        card.style.cssText = "display:inline-block;margin:5px;padding:5px;border:1px solid #333;cursor:pointer;text-align:center;";
        card.appendChild(img);

        const label = document.createElement("div");
        label.textContent = "ID: " + tokenId;
        card.appendChild(label);

        // Highlight on click
        card.addEventListener("click", () => {
            if (selectedNFT) selectedNFT.classList.remove("active");
            card.classList.add("active");
            selectedNFT = card;
            document.getElementById("stakeBtn").disabled = isStaked;
            document.getElementById("unstakeBtn").disabled = !isStaked;
        });

        container.appendChild(card);
    } catch (err) {
        logToPage("Failed to render NFT " + tokenId + ": " + err.message, true);
    }
}


// =====================
// Load user NFTs
// =====================
async function loadUserNFTs() {
    if (loadingNFTs) return;
    loadingNFTs = true;
    logToPage("Loading user NFTs...");

    const unstakedContainer = document.getElementById("unstakedNFTs");
    const stakedContainer = document.getElementById("stakedNFTs");
    unstakedContainer.innerHTML = "";
    stakedContainer.innerHTML = "";

    const totalSupply = (await nftContractRO.totalSupply()).toNumber();
    let totalPending = ethers.BigNumber.from(0);

    for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
            // Check if this token belongs to user (unstaked) or staked
            const isStaked = await stakingContractRO.userStaked(userAddress, tokenId);
            let owner = await nftContractRO.ownerOf(tokenId);

            // If staked, owner = staking contract
            if (isStaked) {
                await renderNFT(tokenId, stakedContainer, true);
                const pending = await stakingContractRO.pending(tokenId);
                totalPending = totalPending.add(pending);
            } else if (owner.toLowerCase() === userAddress.toLowerCase()) {
                await renderNFT(tokenId, unstakedContainer, false);
            }
        } catch (err) {
            console.error("Error loading tokenId", tokenId, err);
        }
    }

    document.getElementById("totalRewards").textContent = ethers.utils.formatEther(totalPending);
    loadingNFTs = false;
}


setInterval(() => {
    if (stakingContractRO) updateGlobalStats();
}, 15000);

// Click anywhere to deselect NFT
document.body.addEventListener("click", (e) => {
    if (
        e.target.closest(".nft-card") ||
        e.target.closest("button")
    ) return;

    if (selectedNFT) {
        selectedNFT.classList.remove("active");
        selectedNFT = null;
        document.getElementById("stakeBtn").disabled = true;
        document.getElementById("unstakeBtn").disabled = true;
    }
});


// =====================
// Hook up buttons
// =====================
document.getElementById("connectWalletBtn")?.addEventListener("click", connectWallet);

document.getElementById("stakeBtn").addEventListener("click", async () => {
    if (!selectedNFT) return;
    if (!window.nftContract) {
        logToPage("NFT contract not ready yet!", true);
        return;
    }

    const tokenId = Number(selectedNFT.dataset.tokenId);

    try {
        document.getElementById("stakeBtn").disabled = true;

        // 1️⃣ CHECK APPROVAL
        const approved = await nftContract.getApproved(tokenId);

        if (approved.toLowerCase() !== stakingContractAddress.toLowerCase()) {
            logToPage("Approving NFT...");
            const approveTx = await nftContract.approve(
                stakingContractAddress,
                tokenId
            );
            await approveTx.wait();
        }

        // 2️⃣ STAKE
        const tx = await stakingContract.stake(tokenId);
        logToPage("Staking tx: " + tx.hash);
        await tx.wait();

        logToPage("NFT staked!");
        selectedNFT.classList.remove("active");
        selectedNFT = null;

        await loadUserNFTs();
        document.getElementById("stakeBtn").disabled = true;

    } catch (err) {
      document.getElementById("stakeBtn").disabled = false;

        logToPage("Stake failed: " + err.message, true);
    }
});


document.getElementById("unstakeBtn")?.addEventListener("click", async () => {
    if (!selectedNFT) return;
    const tokenId = Number(selectedNFT.dataset.tokenId);
    try {
        const tx = await stakingContract.unstake(tokenId);
        logToPage("Transaction sent: " + tx.hash);
        await tx.wait();
        logToPage("Unstake complete!");
        selectedNFT.classList.remove("active");
        selectedNFT = null;
        await loadUserNFTs();
        document.getElementById("unstakeBtn").disabled = true;
    } catch (err) {
        logToPage("Unstake failed: " + err.message, true);
    }
});

document.getElementById("claimAllBtn")?.addEventListener("click", async () => {
    try {
        // ✅ Get all staked NFT cards of connected wallet
        const stakedContainer = document.getElementById("stakedNFTs");
        const tokenIds = Array.from(stakedContainer.children).map(c => Number(c.dataset.tokenId));
        if (tokenIds.length === 0) return; // No staked NFTs

        // ✅ Call claimAll with the token IDs
        const tx = await stakingContract.claimAll(tokenIds);
        logToPage("ClaimAll sent: " + tx.hash);
        await tx.wait();
        logToPage("All rewards claimed!");

        // ✅ Refresh user's NFTs
        await loadUserNFTs();
    } catch (err) {
        logToPage("ClaimAll failed: " + err.message, true);
    }
});
