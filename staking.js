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
let maxYAMPerNFTThisYear = null;
let nftRemainingYAMCache = {}; 
let publicProvider;
let queryClearTimer = null;


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


async function batchFetchNFTData(tokenId) {
    const [tokenURI, remaining] = await Promise.all([
        nftContractRO.tokenURI(tokenId),
        stakingContractRO.currentRemainingYAM(tokenId)
    ]);
    return { tokenURI, remaining }; 
}

async function loadMaxYAMPerNFTThisYear() {
    if (maxYAMPerNFTThisYear !== null) return maxYAMPerNFTThisYear;

    const currentYear = await stakingContractRO.currentYear();
    const totalSupplyBN = await nftContractRO.totalSupply();
    const totalEmissionBN = await stakingContractRO.remainingEmission(currentYear);

    const totalSupply = totalSupplyBN.toNumber();
    const totalEmission = Number(ethers.utils.formatEther(totalEmissionBN));

    if (totalSupply > 0) {
        maxYAMPerNFTThisYear = totalEmission / totalSupply;
    } else {
        maxYAMPerNFTThisYear = 0;
    }

    return maxYAMPerNFTThisYear;
}

async function fetchRemainingYAMBatch(tokenIds) {
    if (!stakingContractRO) return [];

    try {
        // Use our helper function
        const remainingArray = await getRemainingBatch(tokenIds);
        return remainingArray;
    } catch (err) {
        console.error("Failed to fetch remaining YAM batch:", err);
        return tokenIds.map(id => nftRemainingYAMCache[id] ?? maxYAMPerNFTThisYear ?? 0);
    }
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

async function getRemainingYAM(tokenId) {
    if (!stakingContractRO) return 0;
    const remainingBN = await stakingContractRO.currentRemainingYAM(tokenId);
    return Number(ethers.utils.formatEther(remainingBN));
}

async function getRemainingBatch(tokenIds) {
    if (!stakingContractRO) return [];
    const remainingBNArray = await stakingContractRO.currentRemainingBatch(tokenIds);
    return remainingBNArray.map(bn => Number(ethers.utils.formatEther(bn)));
}

async function getBatchNFTData(tokenIds) {
    if (!stakingContractRO) return { pendingRewards: [], remainingCaps: [] };
    const [pendingRewardsBN, remainingCapsBN] = await stakingContractRO.batchNFTData(tokenIds);
    const pendingRewards = pendingRewardsBN.map(bn => Number(ethers.utils.formatEther(bn)));
    const remainingCaps = remainingCapsBN.map(bn => Number(ethers.utils.formatEther(bn)));
    return { pendingRewards, remainingCaps };
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
const stakingContractAddress = "0x54B0f30D3bad0b1Ba7414770A947a5064B9c9756";
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
  },
  
{
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "currentRemainingYAM",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [{ "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }],
    "name": "currentRemainingBatch",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
},

{
  "inputs": [{ "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }],
  "name": "batchNFTData",
  "outputs": [
    { "internalType": "uint256[]", "name": "pendingRewards", "type": "uint256[]" },
    { "internalType": "uint256[]", "name": "remainingCaps", "type": "uint256[]" }
  ],
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
        const totalPending = Number(
  ethers.utils.formatEther(result.total)
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

function formatYAM(value) {
    let formatted = ethers.utils.formatUnits(value, 18); 
    return parseFloat(formatted).toFixed(2);          
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
        const remainingBN = await stakingContractRO.currentRemainingYAM(tokenId);
        const remainingNum = Math.max(0, Number(ethers.utils.formatEther(remainingBN)));
        nftRemainingYAMCache[tokenId] = remainingNum;

        const { remainingCaps } = await stakingContractRO.batchNFTData([tokenId]);
        const yearlyCap = Number(ethers.utils.formatEther(remainingCaps[0]));

        let progress = calculateProgressPercent(remainingNum, yearlyCap);
        progress = Math.min(100, Math.max(0, progress));

        remainingDiv.textContent = `${remainingNum.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} $YAM`;

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
        const totalSupply = await nftContractRO.totalSupply();

        for (let tokenId = 1; tokenId <= totalSupply.toNumber(); tokenId++) {
          
            const isStaked = await stakingContractRO.userStaked(userAddress, tokenId);

            if (isStaked) {
                await renderNFT(tokenId, stakedContainer, true);
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
    try {
        setProgress("unstakeProgress", "Waiting for wallet confirmation...");
        document.getElementById("unstakeBtn").disabled = true;

        setProgress("unstakeProgress", "Unstaking YAMADOGS...");
        await (await stakingContract.unstake(tokenId)).wait();

        showProgress("unstakeProgress", "Unstaking successful ✅", 5000);
        selectedNFT.classList.remove("active");
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
        const remainingNum = await getRemainingYAM(tokenId);
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

async function updateNFTYam() {
    const stakedContainer = document.getElementById("stakedNFTs");

    for (let card of stakedContainer.children) {
        const tokenId = Number(card.dataset.tokenId);
        const progressFill = card.querySelector(".yam-progress-fill");
        const remainingDiv = card.querySelector(".remaining-yam");

        try {
            const remainingBN = await stakingContractRO.currentRemainingYAM(tokenId);
            const remainingNum = Math.max(0, Number(ethers.utils.formatEther(remainingBN)));
            nftRemainingYAMCache[tokenId] = remainingNum;

            const { remainingCaps } = await stakingContractRO.batchNFTData([tokenId]);
            const yearlyCap = Number(ethers.utils.formatEther(remainingCaps[0]));

            let progress = calculateProgressPercent(remainingNum, yearlyCap);
            progress = Math.min(100, Math.max(0, progress));

            remainingDiv.textContent = `${remainingNum.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} $YAM`;

            progressFill.style.width = `${progress.toFixed(2)}%`;
            progressFill.style.transition = "width 0.5s ease-in-out";

        } catch (err) {
            console.error("Error updating NFT YAM:", tokenId, err);
        }
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
