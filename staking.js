// =====================
// Global Variables
// =====================
let provider;
let signer;
let userAddress;
let stakingContract;
let stakingContractRO;
let nftContractRO;
let nftContract;
let selectedNFT = null;
let loadingNFTs = false;

// =====================
// Utility Functions
// =====================
function setProgress(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function clearProgress(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
}

function showProgress(id, text, autoClearMs = 0) {
    setProgress(id, text);
    if (autoClearMs > 0) setTimeout(() => clearProgress(id), autoClearMs);
}

async function batchFetchNFTData(tokenId) {
    const [tokenURI, pending, remaining] = await Promise.all([
        nftContractRO.tokenURI(tokenId),
        stakingContractRO.pending(tokenId),
        stakingContractRO.remainingPerNFTThisYear(tokenId)
    ]);
    return { tokenURI, pending, remaining };
}

// =====================
// Contract Addresses
// =====================
const stakingContractAddress = "0xA2bEf7A4b780eB16B52c81D169AB04783E5cA139";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// =====================
// ABIs
// =====================
const stakingABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Claimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Unstaked",
    "type": "event"
  },

  {
    "inputs": [],
    "name": "currentAPY",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentYear",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "YEAR",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalMinted",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "year", "type": "uint256" }],
    "name": "remainingEmission",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "remainingPerNFTThisYear",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "pending",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }],
    "name": "pendingBatch",
    "outputs": [
      { "internalType": "uint256", "name": "total", "type": "uint256" },
      { "internalType": "uint256[]", "name": "perNFT", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }],
    "name": "claimAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "userStaked",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

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
// Global Stats
// =====================
async function updateGlobalStats() {
    try {
        if (!stakingContractRO) return;

        // APY
        const apy = await stakingContractRO.currentAPY();
        document.getElementById("currentAPY").textContent = (apy.toNumber() / 100).toFixed(2);

        // Halving Countdown
        const currentYear = await stakingContractRO.currentYear();
        const YEAR = await stakingContractRO.YEAR();
        const startTime = await stakingContractRO.startTime();
        const nextHalvingTime = startTime.add(YEAR.mul(currentYear.add(1)));
        const now = Math.floor(Date.now() / 1000);
        let secondsLeft = nextHalvingTime.toNumber() - now;
        if (secondsLeft < 0) secondsLeft = 0;
        const days = Math.floor(secondsLeft / 86400);
        const hours = Math.floor((secondsLeft % 86400) / 3600);
        const mins = Math.floor((secondsLeft % 3600) / 60);
        document.getElementById("halvingCountdown").textContent = `${days}d ${hours}h ${mins}m`;

        // Totals
        const totalStaked = await stakingContractRO.totalStaked();
        const totalMinted = await stakingContractRO.totalMinted();
        const remaining = await stakingContractRO.remainingEmission(currentYear);

        document.getElementById("totalStakedNFTs").textContent = totalStaked.toString();
        document.getElementById("totalMintedYAM").textContent = ethers.utils.formatEther(totalMinted);
        document.getElementById("remainingEmission").textContent = ethers.utils.formatEther(remaining);

    } catch (err) {
        console.error("Error updating global stats", err);
    }
}

// =====================
// Pending Rewards
// =====================
async function updatePendingRewards() {
    try {
        if (!stakingContractRO || !userAddress) return;

        const stakedContainer = document.getElementById("stakedNFTs");
        const tokenIds = Array.from(stakedContainer.children).map(c => Number(c.dataset.tokenId));

        if (tokenIds.length === 0) {
            document.getElementById("pendingRewards").textContent = "0";
            return;
        }

        const result = await stakingContractRO.pendingBatch(tokenIds);
        const totalPending = ethers.utils.formatEther(result.total);
        document.getElementById("pendingRewards").textContent = totalPending;
    } catch (err) {
        console.error("Error updating pending rewards", err);
    }
}

// =====================
// Update Remaining YAM per NFT
// =====================
async function updateNFTYam() {
    const containers = [document.getElementById("stakedNFTs"), document.getElementById("unstakedNFTs")];
    for (const container of containers) {
        if (!container) continue;
        for (const card of container.children) {
            const tokenId = Number(card.dataset.tokenId);
            const remainingYamDiv = card.querySelector(".remaining-yam");
            if (!remainingYamDiv) continue;
            try {
                const remaining = await nftContractRO.remainingPerNFTThisYear(tokenId);
          remainingDiv.textContent =
        `${Number(ethers.utils.formatEther(remaining)).toFixed(2)} YAM`;
            } catch (err) {
                console.error("Error updating Remaining YAM for tokenId", tokenId, err);
            }
        }
    }
}


// =====================
// Connect Wallet
// =====================
async function connectWallet() {
    try {
        if (!window.ethereum) {
            setProgress("walletProgress", "Wallet not detected ❌");
            return;
        }

        setProgress("walletProgress", "Waiting for wallet confirmation...");

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        setProgress("walletProgress", "Wallet connected ✅");
        document.getElementById("walletAddress").textContent = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

        stakingContractRO = new ethers.Contract(stakingContractAddress, stakingABI, provider);
        stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, signer);
        nftContractRO = new ethers.Contract(nftAddress, nftABI, provider);
        nftContract = new ethers.Contract(nftAddress, nftABI, signer);

        document.getElementById("claimAllBtn").disabled = false;

        await loadUserNFTs();
        await updateGlobalStats();
        await updatePendingRewards();

        setInterval(() => {
            if (stakingContractRO) updateNFTYam();
        }, 10000);

    } catch (err) {
        setProgress("walletProgress", "Wallet connection failed ❌");
        console.error(err);
    }
}

// =====================
//Render NFTs
// =====================
async function renderNFT(tokenId, container, isStaked) {
    try {
        const tokenURI = await nftContractRO.tokenURI(tokenId);
        const base64JSON = tokenURI.split(",")[1];
        const jsonStr = atob(base64JSON);
        const metadata = JSON.parse(jsonStr);
        const card = document.createElement("div");
        card.className = "nft-card";
        card.dataset.tokenId = tokenId;

        const remainingDiv = document.createElement("div");
        remainingDiv.className = "remaining-yam";
        remainingDiv.textContent = "Loading...";
        card.appendChild(remainingDiv);

        const img = document.createElement("img");
        img.src = metadata.image; // base64 image
        img.alt = metadata.name || `NFT #${tokenId}`;
        img.className = "nft-image";
        card.appendChild(img);

        const idDiv = document.createElement("div");
        idDiv.className = "token-id";
        idDiv.textContent = `#${tokenId}`;
        card.appendChild(idDiv);

        card.addEventListener("click", () => {
            if (selectedNFT) selectedNFT.classList.remove("active");
            selectedNFT = card;
            card.classList.add("active");
            document.getElementById("stakeBtn").disabled = isStaked;
            document.getElementById("unstakeBtn").disabled = !isStaked;
        });
        container.appendChild(card);
        const remaining = await stakingContractRO.remainingPerNFTThisYear(tokenId);
        remainingDiv.textContent = `${Number(ethers.utils.formatEther(remaining)).toFixed(2)} YAM`;

    } catch (err) {
        console.error("Error rendering NFT", tokenId, err);
    }
}


// =====================
// Load User NFTs
// =====================
async function loadUserNFTs() {
    if (loadingNFTs) return;
    loadingNFTs = true;

    const unstakedContainer = document.getElementById("unstakedNFTs");
    const stakedContainer = document.getElementById("stakedNFTs");

    unstakedContainer.innerHTML = "";
    stakedContainer.innerHTML = "";

    let totalPending = ethers.BigNumber.from(0);

    try {
        const totalSupply = await nftContractRO.totalSupply();

        for (let tokenId = 1; tokenId <= totalSupply.toNumber(); tokenId++) {
          
            const isStaked = await stakingContractRO.userStaked(userAddress, tokenId);

            if (isStaked) {
                await renderNFT(tokenId, stakedContainer, true);

                const pending = await stakingContractRO.pending(tokenId);
                totalPending = totalPending.add(pending);
                continue;
            }
            try {
                const owner = await nftContractRO.ownerOf(tokenId);
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    await renderNFT(tokenId, unstakedContainer, false);
                }
            } catch (_) {
            }
        }

        document.getElementById("totalRewards").textContent =
            ethers.utils.formatEther(totalPending);

        await updatePendingRewards();

    } catch (err) {
        console.error("loadUserNFTs failed", err);
    }

    loadingNFTs = false;
}

// =====================
// Click Outside NFT to Deselect
// =====================
document.body.addEventListener("click", (e) => {
    if (e.target.closest(".nft-card") || e.target.closest("button")) return;
    if (selectedNFT) {
        selectedNFT.classList.remove("active");
        selectedNFT = null;
        document.getElementById("stakeBtn").disabled = true;
        document.getElementById("unstakeBtn").disabled = true;
    }
});

// =====================
// Hook Up Buttons
// =====================
document.getElementById("connectWalletBtn")?.addEventListener("click", connectWallet);

document.getElementById("stakeBtn").addEventListener("click", async () => {
    if (!selectedNFT) return;
    const tokenId = Number(selectedNFT.dataset.tokenId);
    try {
        showProgress("stakeProgress", "Waiting for wallet confirmation...");
        document.getElementById("stakeBtn").disabled = true;

        const approved = await nftContract.getApproved(tokenId);
        if (approved.toLowerCase() !== stakingContractAddress.toLowerCase()) {
            showProgress("stakeProgress", "Approving NFT...");
            await (await nftContract.approve(stakingContractAddress, tokenId)).wait();
        }

        showProgress("stakeProgress", "Staking NFT...");
        await (await stakingContract.stake(tokenId)).wait();

        showProgress("stakeProgress", "Staking successful ✅", 5000);
        selectedNFT.classList.remove("active");
        selectedNFT = null;
        await loadUserNFTs();
        await updateNFTYam();
        await updatePendingRewards();

    } catch (err) {
        setProgress("stakeProgress", "Transaction failed ❌");
        document.getElementById("stakeBtn").disabled = false;
        console.error(err);
    }
});

document.getElementById("unstakeBtn").addEventListener("click", async () => {
    if (!selectedNFT) return;
    const tokenId = Number(selectedNFT.dataset.tokenId);
    try {
        setProgress("unstakeProgress", "Waiting for wallet confirmation...");
        document.getElementById("unstakeBtn").disabled = true;

        setProgress("unstakeProgress", "Unstaking NFT...");
        await (await stakingContract.unstake(tokenId)).wait();

        showProgress("unstakeProgress", "Unstaking successful ✅", 5000);
        selectedNFT.classList.remove("active");
        selectedNFT = null;
        await loadUserNFTs();
        await updateNFTYam();
        await updatePendingRewards();

    } catch (err) {
        showProgress("unstakeProgress", "Transaction failed ❌", 6000);
        document.getElementById("unstakeBtn").disabled = false;
        console.error(err);
    }
});

document.getElementById("claimAllBtn").addEventListener("click", async () => {
    try {
        setProgress("claimProgress", "Waiting for wallet confirmation...");

        const stakedContainer = document.getElementById("stakedNFTs");
        const tokenIds = Array.from(stakedContainer.children).map(c => Number(c.dataset.tokenId));

        if (tokenIds.length === 0) {
            showProgress("claimProgress", "No rewards to claim ℹ️", 4000);
            return;
        }

        setProgress("claimProgress", "Claiming $YAM...");
        await (await stakingContract.claimAll(tokenIds)).wait();

        showProgress("claimProgress", "Claim successful ✅", 5000);
        await loadUserNFTs();
        await updateNFTYam();
        await updatePendingRewards();

    } catch (err) {
        setProgress("claimProgress", "Transaction failed ❌");
        console.error(err);
    }
});

// =====================
// Auto Updates
// =====================
setInterval(() => {
    if (stakingContractRO) updatePendingRewards();
}, 30000);

setInterval(() => {
    if (stakingContractRO) updateGlobalStats();
}, 15000);
