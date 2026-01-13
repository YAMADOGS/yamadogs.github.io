// =====================
// Global Variables
// =====================
let provider;
let signer;
let userAddress;

let stakingContract;
let stakingContractRO;
let nftContract;
let nftContractRO;

let selectedNFT = null;
let loadingNFTs = false;

let maxYAMPerNFTThisYear = null;
let nftRemainingYAMCache = {};

let publicProvider;

// =====================
// Contract Addresses
// =====================
const stakingContractAddress =
    "0x552BdB7b104433C2F6C1B315f46462ABeC3Ec238";

const nftAddress =
    "0x4378682659304853EbD0146E85CF78EdECaE9647";

// =====================
// ABIs (FULL)
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

    { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "stake", "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "unstake", "stateMutability": "nonpayable", "type": "function" },

    { "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "name": "claimAll", "stateMutability": "nonpayable", "type": "function" },

    { "inputs": [
        { "name": "user", "type": "address" },
        { "name": "tokenId", "type": "uint256" }
    ], "name": "userStaked", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" },

    { "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "name": "pendingBatch",
      "outputs": [
        { "name": "total", "type": "uint256" },
        { "name": "perNFT", "type": "uint256[]" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];

const nftABI = [
    { "inputs": [{ "name": "o", "type": "address" }], "name": "balanceOf", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "ownerAddress", "type": "address" }, { "name": "index", "type": "uint256" }], "name": "tokenOfOwnerByIndex", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "id", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "type": "string" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "id", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalSupply", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// =====================
// Providers
// =====================
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

// =====================
// Helpers
// =====================
async function loadMaxYAMPerNFTThisYear() {
    if (maxYAMPerNFTThisYear !== null) return;

    const year = await stakingContractRO.currentYear();
    const totalSupply = await nftContractRO.totalSupply();
    const emission = await stakingContractRO.remainingEmission(year);

    maxYAMPerNFTThisYear =
        Number(ethers.utils.formatEther(emission)) /
        totalSupply.toNumber();
}

async function fetchRemainingYAMBatch(tokenIds) {
    if (tokenIds.length === 0) return [];

    const remainingBN =
        await stakingContractRO.currentRemainingBatch(tokenIds);

    return remainingBN.map(v =>
        Number(ethers.utils.formatEther(v))
    );
}

// =====================
// NFT Rendering
// =====================
async function renderNFT(tokenId, container, isStaked) {
    const tokenURI = await nftContractRO.tokenURI(tokenId);
    const json = JSON.parse(atob(tokenURI.split(",")[1]));

    const card = document.createElement("div");
    card.className = "nft-card";
    card.dataset.tokenId = tokenId;

    const remainingDiv = document.createElement("div");
    remainingDiv.className = "remaining-yam";
    remainingDiv.textContent = "Loading...";
    card.appendChild(remainingDiv);

    const progress = document.createElement("div");
    progress.className = "yam-progress";
    const fill = document.createElement("div");
    fill.className = "yam-progress-fill";
    progress.appendChild(fill);
    card.appendChild(progress);

    const img = document.createElement("img");
    img.src = json.image;
    img.className = "nft-image";
    card.appendChild(img);

    container.appendChild(card);

    await loadMaxYAMPerNFTThisYear();

    const remaining = Number(
        ethers.utils.formatEther(
            await stakingContractRO.currentRemainingYAM(tokenId)
        )
    );

    nftRemainingYAMCache[tokenId] = remaining;

    const pct = ((maxYAMPerNFTThisYear - remaining) / maxYAMPerNFTThisYear) * 100;

    remainingDiv.textContent =
        `${remaining.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} $YAM`;

    fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
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

    const total = await nftContractRO.totalSupply();

    for (let i = 1; i <= total; i++) {
        const isStaked =
            await stakingContractRO.userStaked(userAddress, i);

        if (isStaked) {
            await renderNFT(i, staked, true);
        } else {
            try {
                const owner = await nftContractRO.ownerOf(i);
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    await renderNFT(i, unstaked, false);
                }
            } catch {}
        }
    }

    loadingNFTs = false;
}

// =====================
// Wallet Connect
// =====================
async function connectWallet() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    stakingContract = new ethers.Contract(
        stakingContractAddress,
        stakingABI,
        signer
    );

    stakingContractRO = new ethers.Contract(
        stakingContractAddress,
        stakingABI,
        provider
    );

    nftContract = new ethers.Contract(
        nftAddress,
        nftABI,
        signer
    );

    nftContractRO = new ethers.Contract(
        nftAddress,
        nftABI,
        provider
    );

    await loadUserNFTs();
}

// =====================
// Query NFT Remaining YAM
// =====================
async function queryNFTRemainingYAM() {
    const tokenId = document.getElementById("queryTokenId").value;

    const remaining = Number(
        ethers.utils.formatEther(
            await stakingContractRO.currentRemainingYAM(tokenId)
        )
    ).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById("queryResultYAM").textContent =
        `${remaining} YAM`;
}

// =====================
// Init
// =====================
window.addEventListener("load", () => {
    initPublicProvider();
});

document.getElementById("connectWalletBtn")
    ?.addEventListener("click", connectWallet);

document.getElementById("queryNFTBtn")
    ?.addEventListener("click", queryNFTRemainingYAM);
