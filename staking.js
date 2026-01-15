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
let nftRemainingYAMCache = {}; 
let publicProvider;
let queryClearTimer = null;

const MAX_PER_NFT_PER_YEAR = 1_000_000;

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

function autoClearQueryUI(delayMs = 5000) {
    if (queryClearTimer) {
        clearTimeout(queryClearTimer);
    }

    queryClearTimer = setTimeout(() => {
        const tokenBox = document.getElementById("queryResultToken");
        const yamBox = document.getElementById("queryResultYAM");
        const statusBox = document.getElementById("queryStatus");

        if (tokenBox) tokenBox.textContent = "";
        if (yamBox) yamBox.textContent = "";
        if (statusBox) statusBox.textContent = "";
    }, delayMs);
}


function initPublicProvider() {
    publicProvider = new ethers.providers.JsonRpcProvider(
        "https://ethereum-sepolia-rpc.publicnode.com" 

    );

    stakingContractRO = new ethers.Contract(
        stakingContractAddress,
        stakingABI,
        publicProvider
    );

    nftContractRO = new ethers.Contract(
        nftAddress,
        nftABI,
        publicProvider
    );
}

async function getRemainingYAMForNFT(tokenId) {
    const year = await stakingContractRO.currentYear();

    const earnedBN = await stakingContractRO.nftEarnedPerYear(tokenId, year);
    const pendingBN = await stakingContractRO.pending(tokenId);

    const earned = Number(ethers.utils.formatEther(earnedBN));
    const pending = Number(ethers.utils.formatEther(pendingBN));

    const remaining = Math.max(
        0,
        MAX_PER_NFT_PER_YEAR - earned - pending
    );

    return remaining;
}


async function refreshUIAfterTx() {
    nftRemainingYAMCache = {};
    await loadUserNFTs();
    await updatePendingRewards();
}
function calculateProgressPercent(remaining, yearlyCap) {
    if (yearlyCap <= 0) return 0;
    return (remaining / yearlyCap) * 100;
}




// =====================
// Contract Addresses
// =====================
const stakingContractAddress = "0x0f0c7E264dca174B5d853688552d6546f9d3B492";
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
    "name": "pending",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "year", "type": "uint256" }
    ],
    "name": "nftEarnedPerYear",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }
    ],
    "name": "pendingBatch",
    "outputs": [
      { "internalType": "uint256", "name": "total", "type": "uint256" },
      { "internalType": "uint256[]", "name": "perNFT", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserStakedTokens",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
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
    "inputs": [
      { "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }
    ],
    "name": "claimAll",
    "outputs": [],
    "stateMutability": "nonpayable",
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

        const apy = await stakingContractRO.currentAPY();
        document.getElementById("currentAPY").textContent = (apy.toNumber() / 100).toFixed(2);

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

        const totalStaked = await stakingContractRO.totalStaked();
        const totalMinted = await stakingContractRO.totalMinted();
        const remaining = await stakingContractRO.remainingEmission(currentYear);

        document.getElementById("totalStakedNFTs").textContent = totalStaked.toString();
        const totalMintedFormatted = Number(
    ethers.utils.formatEther(totalMinted)
).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const remainingFormatted = Number(
    ethers.utils.formatEther(remaining)
).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

document.getElementById("totalMintedYAM").textContent = totalMintedFormatted;
document.getElementById("remainingEmission").textContent = remainingFormatted;


    } catch (err) {
        console.error("Error updating global stats", err);
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
stakingContract.on("Staked", async (user, tokenId) => {
    if (user.toLowerCase() === userAddress.toLowerCase()) {
        await refreshUIAfterTx();
    }
});

stakingContract.on("Unstaked", async (user, tokenId) => {
    if (user.toLowerCase() === userAddress.toLowerCase()) {
        await refreshUIAfterTx();
    }
});

stakingContract.on("Claimed", async (user) => {
    if (user.toLowerCase() === userAddress.toLowerCase()) {
        await refreshUIAfterTx();
    }
});


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

        const progressBar = document.createElement("div");
        progressBar.className = "yam-progress";
        const progressFill = document.createElement("div");
        progressFill.className = "yam-progress-fill";
        progressBar.appendChild(progressFill);
        card.appendChild(progressBar);

        const img = document.createElement("img");
        img.src = metadata.image;
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

        // ===== YAM DATA =====
        let remainingNum;
        if (nftRemainingYAMCache[tokenId] !== undefined) {
            remainingNum = nftRemainingYAMCache[tokenId];
        } else {
            remainingNum = await getRemainingYAMForNFT(tokenId);
            nftRemainingYAMCache[tokenId] = remainingNum;
        }

        remainingDiv.textContent = `${remainingNum.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} $YAM`;

        let progress = (remainingNum / MAX_PER_NFT_PER_YEAR) * 100;
        progress = Math.min(100, Math.max(0, progress));

        progressFill.style.width = `${progress.toFixed(2)}%`;
        progressFill.style.transition = "width 0.5s ease-in-out";

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

    try {
        // ===============================
        // LOAD STAKED NFTS (O(1))
        // ===============================
        const stakedTokenIds =
            await stakingContractRO.getUserStakedTokens(userAddress);

        for (const tokenId of stakedTokenIds) {
            await renderNFT(Number(tokenId), stakedContainer, true);
        }

        // ===============================
        // LOAD UNSTAKED NFTS (USER ONLY)
        // ===============================
        const balance = await nftContractRO.balanceOf(userAddress);

        for (let i = 0; i < balance; i++) {
            const tokenId =
                await nftContractRO.tokenOfOwnerByIndex(userAddress, i);

            if (!stakedTokenIds.map(id => id.toString()).includes(tokenId.toString())) {
                await renderNFT(Number(tokenId), unstakedContainer, false);
            }
        }

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
            showProgress("stakeProgress", "Approving YAMADOGS...");
            await (await nftContract.approve(stakingContractAddress, tokenId)).wait();
        }

        showProgress("stakeProgress", "Staking YAMADOGS...");
        await (await stakingContract.stake(tokenId)).wait();

        showProgress("stakeProgress", "Staking successful ✅", 5000);
        selectedNFT.classList.remove("active");
        selectedNFT = null;
        await refreshUIAfterTx();


    } catch (err) {
        setProgress("stakeProgress", "Transaction failed ❌");
        document.getElementById("stakeBtn").disabled = false;
        console.error(err);
    }
});

document.getElementById("unstakeBtn").addEventListener("click", async () => {
    if (!selectedNFT) return;
    const tokenId = Number(selectedNFT.dataset.tokenId);
    const card = selectedNFT;
    const unstakedContainer = document.getElementById("unstakedNFTs");

    try {
        setProgress("unstakeProgress", "Waiting for wallet confirmation...");
        document.getElementById("unstakeBtn").disabled = true;

        setProgress("unstakeProgress", "Unstaking YAMADOGS...");
        await (await stakingContract.unstake(tokenId)).wait();

        showProgress("unstakeProgress", "Unstaking successful ✅", 5000);
        
        card.classList.remove("active");
        unstakedContainer.appendChild(card);

        selectedNFT = null;
        await refreshUIAfterTx();

    } catch (err) {
        showProgress("unstakeProgress", "Transaction failed ❌", 6000);
        document.getElementById("unstakeBtn").disabled = false;
        console.error(err);
    }
});

document.getElementById("claimAllBtn").addEventListener("click", async () => {
    document.getElementById("claimAllBtn").disabled = true; // ✅ ADD HERE

    try {
        setProgress("claimProgress", "Waiting for wallet confirmation...");

        const stakedContainer = document.getElementById("stakedNFTs");
        const tokenIds = Array.from(stakedContainer.children).map(c => Number(c.dataset.tokenId));

        if (tokenIds.length === 0) {
            showProgress("claimProgress", "No rewards to claim ℹ️", 4000);
            return;
        }

        setProgress("claimProgress", "Claiming $YAM...");
        const tx = await stakingContract.claimAll(tokenIds);
         await tx.wait(1);


        showProgress("claimProgress", "Claim successful ✅", 5000);
        await refreshUIAfterTx();

    } catch (err) {
        setProgress("claimProgress", "Transaction failed ❌");
        console.error(err);
    } finally {
        document.getElementById("claimAllBtn").disabled = false; 
    }
});


async function queryNFTRemainingYAM() {
  if (queryClearTimer) clearTimeout(queryClearTimer);
    const tokenIdInput = document.getElementById("queryTokenId");
    const tokenBox = document.getElementById("queryResultToken");
    const yamBox = document.getElementById("queryResultYAM");
    const statusBox = document.getElementById("queryStatus");

    if (!stakingContractRO || !nftContractRO) {
        statusBox.textContent = "Public RPC not ready ❌";
        return;
    }

    const tokenId = tokenIdInput.value.trim();

    if (tokenId === "" || isNaN(tokenId) || Number(tokenId) < 0) {
    statusBox.textContent = "Invalid token ID ❌";
    autoClearQueryUI(4000);
    return;
    }
    
    statusBox.textContent = "Querying NFT... ⏳";
    tokenBox.textContent = "—";
    yamBox.textContent = "—";

    try {
        await nftContractRO.ownerOf(tokenId);
        const remainingNum = await getRemainingYAMForNFT(tokenId);
        const remaining = remainingNum.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        tokenBox.textContent = `NFT #${tokenId}`;
        yamBox.textContent = `${remaining} YAM`;
        statusBox.textContent = "Query successful ✅";
        autoClearQueryUI(5000);


    } catch (err) {
        console.error(err);
        tokenBox.textContent = "—";
        yamBox.textContent = "—";
        statusBox.textContent = "Token does not exist / not minted ❌";
        autoClearQueryUI(6000);

    }
}

document.getElementById("queryNFTBtn")
    ?.addEventListener("click", queryNFTRemainingYAM);

window.addEventListener("load", () => {
    initPublicProvider();
});

// =====================
// UPDATE Pendint Rewards
// =====================
async function updatePendingRewards() {
    try {
        if (!stakingContractRO || !userAddress) return;

        const stakedTokenIds = await stakingContractRO.getUserStakedTokens(userAddress);

        if (stakedTokenIds.length === 0) {
            document.getElementById("pendingRewards").textContent = "0";
            return;
        }

        // Correctly read pendingBatch return values
        const [totalPendingBN] =
            await stakingContractRO.pendingBatch(stakedTokenIds);

        const totalPending = Number(
            ethers.utils.formatEther(totalPendingBN)
        ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        document.getElementById("pendingRewards").textContent = totalPending;

    } catch (err) {
        console.error("Error updating pending rewards", err);
    }
}

// =====================
// Auto Updates
// =====================
setInterval(() => {
    if (stakingContractRO) updatePendingRewards();
}, 30000);

setInterval(() => {
    if (stakingContractRO) updateGlobalStats();
}, 15000);
