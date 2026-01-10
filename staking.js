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
let nftContract;
let nftContractRO;

const stakingContractAddress = "0x8AC5f61bCe8D3b0766ADD7392F30aA254b285221";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// =====================
// ABIs
// =====================
const stakingABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Staked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Unstaked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"yam","type":"address"}],"name":"YamSet","type":"event"},{"inputs":[],"name":"BASE_YEARLY_EMISSION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_PER_NFT_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"year","type":"uint256"}],"name":"baseEmission","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"claimAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"currentAPY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"emittedPerYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastProcessedYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nft","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"pending","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"pendingBatch","outputs":[{"internalType":"uint256","name":"total","type":"uint256"},{"internalType":"uint256[]","name":"perNFT","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"year","type":"uint256"}],"name":"remainingEmission","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_yam","type":"address"}],"name":"setYam","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalMinted","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userStaked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}];

const nftABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"o","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}];

// =====================
// On page load
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  logToPage("DOM fully loaded, disabling buttons...");
  document.getElementById("stakeBtn").disabled = true;
  document.getElementById("unstakeBtn").disabled = true;
  document.getElementById("claimAllBtn").disabled = true;
});

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
    logToPage("Wallet connected: " + userAddress);

    // Read-only contracts
    stakingContractRO = new ethers.Contract(stakingContractAddress, stakingABI, provider);
    nftContractRO = new ethers.Contract(nftAddress, nftABI, provider);

    // Signer contract
    stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, signer);

    document.getElementById("stakeBtn").disabled = false;
    document.getElementById("unstakeBtn").disabled = false;
    document.getElementById("claimAllBtn").disabled = false;

    logToPage("Contracts instantiated");
    await loadUserNFTs();
    await updateGlobalStats();
  } catch (err) {
    logToPage("Wallet connection failed: " + err.message, true);
  }
}

// =====================
// Load user NFTs
// =====================
async function loadUserNFTs() {
  logToPage("Loading user NFTs...");
  try {
    const nftBalance = (await nftContractRO.balanceOf(userAddress)).toNumber();
    logToPage("NFT balance: " + nftBalance);

    const nftContainer = document.getElementById("nftContainer");
    if (nftContainer) nftContainer.innerHTML = "";

    for (let i = 0; i < nftBalance; i++) {
      try {
        const tokenId = await nftContractRO.tokenOfOwnerByIndex(userAddress, i);
        const isStaked = await stakingContractRO.userStaked(userAddress, tokenId);
        const tokenURI = await nftContractRO.tokenURI(tokenId);

        logToPage(`Token #${i} ID: ${tokenId.toString()} - Staked: ${isStaked}`);

        const nftDiv = document.createElement("div");
        nftDiv.style.border = "1px solid #ccc";
        nftDiv.style.margin = "5px";
        nftDiv.style.padding = "5px";

        const img = document.createElement("img");
        img.src = tokenURI.startsWith("data:") ? tokenURI : "https://via.placeholder.com/150";
        img.width = 150;
        img.height = 150;

        const info = document.createElement("div");
        info.textContent = `Token ID: ${tokenId.toString()} - ${isStaked ? "Staked" : "Not staked"}`;

        nftDiv.appendChild(img);
        nftDiv.appendChild(info);
        if (nftContainer) nftContainer.appendChild(nftDiv);

        if (isStaked) {
          const reward = await stakingContractRO.pending(tokenId);
          logToPage(`Token #${i} pending reward: ${ethers.utils.formatEther(reward)} YAM`);
        }
      } catch (nftErr) {
        logToPage(`NFT render error at index ${i}: ${nftErr.message}`, true);
      }
    }
  } catch (err) {
    logToPage("NFT load failed: " + err.message, true);
  }
}

// =====================
// Update global stats
// =====================
async function updateGlobalStats() {
  logToPage("Loading global stats...");
  try {
    const year = await stakingContractRO.currentYear();
    const apy = await stakingContractRO.currentAPY();
    const totalStaked = await stakingContractRO.totalStaked();
    const totalYam = await stakingContractRO.totalMinted();
    const remainingPool = await stakingContractRO.remainingEmission(year);

    logToPage("Current APY: " + apy.toString());
    logToPage("Total NFTs Staked: " + totalStaked.toString());
    logToPage("Total YAM Minted: " + ethers.utils.formatEther(totalYam));
    logToPage("Remaining Reward Pool: " + ethers.utils.formatEther(remainingPool));
  } catch (err) {
    logToPage("Failed to load global stats: " + err.message, true);
  }
}

// =====================
// Hook up buttons
// =====================
document.getElementById("connectWalletBtn")?.addEventListener("click", connectWallet);
document.getElementById("stakeBtn")?.addEventListener("click", () => logToPage("Stake clicked"));
document.getElementById("unstakeBtn")?.addEventListener("click", () => logToPage("Unstake clicked"));
document.getElementById("claimAllBtn")?.addEventListener("click", () => logToPage("Claim All clicked"));
