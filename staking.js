// =====================
// Global Variables
// =====================
let provider;
let signer;
let userAddress;

let stakingContract;          // wallet (write)
let stakingContractRO;        // read-only (public)
let nftContract;              // wallet (write)
let nftContractRO;            // read-only (public)

let selectedNFT = null;
let loadingNFTs = false;

let maxYAMPerNFTThisYear = null;
let nftRemainingYAMCache = {};

let publicProvider;

// =====================
// Utility UI Helpers
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

// =====================
// Public Provider Init
// =====================
function initPublicProvider() {
    publicProvider = new ethers.providers.JsonRpcProvider(
        "https://sepolia.drpc.org"
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

// =====================
// Contract Addresses
// =====================
const stakingContractAddress = "0xA2bEf7A4b780eB16B52c81D169AB04783E5cA139";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// =====================
// ABIs
// =====================
const stakingABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },

  { "anonymous": false, "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ], "name": "Claimed", "type": "event" },

  { "anonymous": false, "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ], "name": "Staked", "type": "event" },

  { "anonymous": false, "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ], "name": "Unstaked", "type": "event" },

  { "inputs": [], "name": "currentAPY", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "currentYear", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "YEAR", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "startTime", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },

  { "inputs": [], "name": "totalStaked", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalMinted", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "year", "type": "uint256" }], "name": "remainingEmission", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },

  { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "currentRemainingYAM", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "name": "currentRemainingBatch", "outputs": [{ "type": "uint256[]" }], "stateMutability": "view", "type": "function" },

  { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "pending", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "name": "pendingBatch",
    "outputs": [
      { "name": "total", "type": "uint256" },
      { "name": "perNFT", "type": "uint256[]" }
    ],
    "stateMutability": "view", "type": "function"
  },

  { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "stake", "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "unstake", "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "name": "claimAll", "stateMutability": "nonpayable", "type": "function" },

  { "inputs": [
      { "name": "user", "type": "address" },
      { "name": "tokenId", "type": "uint256" }
    ], "name": "userStaked", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function"
  }
];

const nftABI = [
  { "inputs": [{ "name": "o", "type": "address" }], "name": "balanceOf", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "ownerAddress", "type": "address" }, { "name": "index", "type": "uint256" }],
    "name": "tokenOfOwnerByIndex", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "id", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "id", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalSupply", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// =====================
// Emission Max (Per NFT / Year)
// =====================
async function loadMaxYAMPerNFTThisYear() {
    if (maxYAMPerNFTThisYear !== null) return;

    const year = await stakingContractRO.currentYear();
    const supply = await nftContractRO.totalSupply();
    const emission = await stakingContractRO.remainingEmission(year);

    maxYAMPerNFTThisYear =
        Number(ethers.utils.formatEther(emission)) / supply.toNumber();
}

// =====================
// Batch Remaining YAM
// =====================
async function fetchRemainingYAMBatch(tokenIds) {
    if (!stakingContractRO || tokenIds.length === 0) return [];

    const bnArr = await stakingContractRO.currentRemainingBatch(tokenIds);
    return bnArr.map(v => Number(ethers.utils.formatEther(v)));
}

// =====================
// Update Remaining YAM + Progress
// =====================
async function updateNFTYam() {
    await loadMaxYAMPerNFTThisYear();

    const containers = [
        document.getElementById("stakedNFTs"),
        document.getElementById("unstakedNFTs")
    ];

    for (const container of containers) {
        if (!container || container.children.length === 0) continue;

        const tokenIds = Array.from(container.children).map(c => Number(c.dataset.tokenId));
        const remainingArr = await fetchRemainingYAMBatch(tokenIds);

        tokenIds.forEach((tokenId, i) => {
            const card = container.children[i];
            const remainingNum = remainingArr[i];

            nftRemainingYAMCache[tokenId] = remainingNum;

            const text = card.querySelector(".remaining-yam");
            const fill = card.querySelector(".yam-progress-fill");

            const progress = Math.min(
                100,
                Math.max(0, ((maxYAMPerNFTThisYear - remainingNum) / maxYAMPerNFTThisYear) * 100)
            );

            text.textContent =
                `${remainingNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $YAM`;
            fill.style.width = `${progress.toFixed(2)}%`;
        });
    }
}

// =====================
// Render NFT (UI ONLY)
// =====================
async function renderNFT(tokenId, container, isStaked) {
    const tokenURI = await nftContractRO.tokenURI(tokenId);
    const meta = JSON.parse(atob(tokenURI.split(",")[1]));

    const card = document.createElement("div");
    card.className = "nft-card";
    card.dataset.tokenId = tokenId;

    const remaining = document.createElement("div");
    remaining.className = "remaining-yam";
    remaining.textContent = "Loading...";
    card.appendChild(remaining);

    const bar = document.createElement("div");
    bar.className = "yam-progress";
    const fill = document.createElement("div");
    fill.className = "yam-progress-fill";
    bar.appendChild(fill);
    card.appendChild(bar);

    const img = document.createElement("img");
    img.src = meta.image;
    img.className = "nft-image";
    card.appendChild(img);

    const id = document.createElement("div");
    id.className = "token-id";
    id.textContent = `#${tokenId}`;
    card.appendChild(id);

    card.onclick = () => {
        if (selectedNFT) selectedNFT.classList.remove("active");
        selectedNFT = card;
        card.classList.add("active");
        document.getElementById("stakeBtn").disabled = isStaked;
        document.getElementById("unstakeBtn").disabled = !isStaked;
    };

    container.appendChild(card);
}

// =====================
// Wallet Connection
// =====================
async function connectWallet() {
    if (!window.ethereum) return;

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, signer);
    nftContract = new ethers.Contract(nftAddress, nftABI, signer);

    await loadUserNFTs();
    await updateNFTYam();
}

// =====================
// Load User NFTs
// =====================
async function loadUserNFTs() {
    if (loadingNFTs) return;
    loadingNFTs = true;

    const unstaked = document.getElementById("unstakedNFTs");
    const staked = document.getElementById("stakedNFTs");
    unstaked.innerHTML = "";
    staked.innerHTML = "";

    const supply = await nftContractRO.totalSupply();

    for (let i = 1; i <= supply.toNumber(); i++) {
        if (userAddress && await stakingContractRO.userStaked(userAddress, i)) {
            await renderNFT(i, staked, true);
        } else {
            try {
                const owner = await nftContractRO.ownerOf(i);
                if (owner.toLowerCase() === userAddress?.toLowerCase()) {
                    await renderNFT(i, unstaked, false);
                }
            } catch {}
        }
    }

    loadingNFTs = false;
}

// =====================
// Init
// =====================
window.addEventListener("load", () => {
    initPublicProvider();
});

setInterval(() => {
    if (stakingContractRO) updateNFTYam();
}, 10000);
