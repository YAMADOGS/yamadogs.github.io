// --------------------- DEBUG LOG PANEL ---------------------
function logToPage(...args) {
  const logDiv = document.getElementById("debugLogs") || (() => {
    const div = document.createElement("div");
    div.id = "debugLogs";
    div.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 5px;
      z-index: 9999;
    `;
    document.body.appendChild(div);
    return div;
  })();

  logDiv.innerText += args.join(" ") + "\n";
  logDiv.scrollTop = logDiv.scrollHeight; // auto-scroll
}

// --------------------- RPC & Contracts ---------------------
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
let signer, userAddress;

const stakingContractAddress = "0x8AC5f61bCe8D3b0766ADD7392F30aA254b285221";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// Simplified ABIs (same as your original)
const nftABI = [ /* ... copy your nftABI here ... */ ];
const stakingABI = [ /* ... copy your stakingABI here ... */ ];

let stakingContract, nftContract;
let unstakedNFTs = [], stakedNFTs = [];
let selectedUnstaked = [], selectedStaked = [];

// --------------------- INITIAL BUTTON DISABLE ---------------------
document.addEventListener("DOMContentLoaded", () => {
  logToPage("DOM fully loaded, disabling buttons...");
  document.getElementById("stakeBtn").disabled = true;
  document.getElementById("unstakeBtn").disabled = true;
  document.getElementById("claimAllBtn").disabled = true;
});

// --------------------- WALLET CONNECT ---------------------
document.getElementById("connectWalletBtn").addEventListener("click", async () => {
  logToPage("Connect Wallet clicked...");
  if (window.ethereum) {
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await web3Provider.getNetwork();
    logToPage("Network chainId:", network.chainId);
    if (network.chainId !== 11155111) {
      alert("Please switch to Sepolia network");
      logToPage("Wallet not on Sepolia, aborting connection.");
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];
    signer = web3Provider.getSigner();
    logToPage("Wallet connected:", userAddress);

    // Attach contracts
    stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, signer);
    nftContract = new ethers.Contract(nftAddress, nftABI, signer);
    logToPage("Contracts instantiated");

    document.getElementById("walletAddress").innerText = userAddress;
    document.getElementById("stakeBtn").disabled = false;
    document.getElementById("unstakeBtn").disabled = false;
    document.getElementById("claimAllBtn").disabled = false;

    // Load NFTs and stats
    await loadUserNFTs();
    await loadGlobalStats();
    startHalvingCountdown();
  } else {
    alert("Please install MetaMask!");
    logToPage("window.ethereum not found, MetaMask required");
  }
});

// --------------------- LOAD USER NFTs ---------------------
async function loadUserNFTs() {
  try {
    logToPage("Loading user NFTs...");
    unstakedNFTs = [];
    stakedNFTs = [];

    const balanceBN = await nftContract.balanceOf(userAddress);
    const balance = balanceBN.toNumber();
    logToPage("NFT balance:", balance);

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
      const isStaked = await stakingContract.userStaked(userAddress, tokenId);
      let uri = await nftContract.tokenURI(tokenId);
      if (uri.startsWith("data:application/json;base64,")) {
        const json = JSON.parse(atob(uri.split(",")[1]));
        uri = json.image;
      }

      (isStaked ? stakedNFTs : unstakedNFTs).push({ tokenId: tokenId.toString(), uri });

      logToPage(`Token #${i} ID: ${tokenId.toString()} Staked: ${isStaked} URI:`, uri);

      if (isStaked) await updateNFTRewardForDebug(tokenId);
    }

    renderNFTs();
    updateTotalRewards();
    logToPage("Finished loading NFTs");
  } catch (err) {
    logToPage("NFT load failed:", err.message || err);
  }
}

// --------------------- UPDATE INDIVIDUAL NFT REWARD ---------------------
async function updateNFTRewardForDebug(tokenId) {
  try {
    const reward = await stakingContract.pending(userAddress, tokenId);
    logToPage(`Pending reward for Token ID ${tokenId}:`, ethers.utils.formatEther(reward), "YAM");
  } catch (err) {
    logToPage(`Failed to get reward for Token ID ${tokenId}:`, err.message || err);
  }
}

// --------------------- UPDATE TOTAL REWARDS ---------------------
async function updateTotalRewards() {
  if (!stakedNFTs.length) {
    document.getElementById("totalRewards").innerText = "0";
    return;
  }

  let total = ethers.BigNumber.from(0);
  for (const nft of stakedNFTs) {
    const reward = await stakingContract.pending(userAddress, nft.tokenId);
    total = total.add(reward);
  }
  document.getElementById("totalRewards").innerText = ethers.utils.formatEther(total);
}

// --------------------- BUTTON ACTIONS ---------------------
document.getElementById("stakeBtn").addEventListener("click", async () => {
  if (!selectedUnstaked.length) return;
  const btn = document.getElementById("stakeBtn");
  btn.disabled = true;
  logToPage("Staking selected tokens:", selectedUnstaked);
  try {
    const tx = await stakingContract.stake(selectedUnstaked);
    await tx.wait();
    logToPage("Stake transaction confirmed");
    await loadUserNFTs();
  } catch (err) {
    logToPage("Stake failed:", err.message || err);
  }
  btn.disabled = false;
});

document.getElementById("unstakeBtn").addEventListener("click", async () => {
  if (!selectedStaked.length) return;
  const btn = document.getElementById("unstakeBtn");
  btn.disabled = true;
  logToPage("Unstaking selected tokens:", selectedStaked);
  try {
    const tx = await stakingContract.unstake(selectedStaked);
    await tx.wait();
    logToPage("Unstake transaction confirmed");
    await loadUserNFTs();
  } catch (err) {
    logToPage("Unstake failed:", err.message || err);
  }
  btn.disabled = false;
});

document.getElementById("claimAllBtn").addEventListener("click", async () => {
  if (!selectedStaked.length) return;
  const btn = document.getElementById("claimAllBtn");
  btn.disabled = true;
  logToPage("Claiming rewards for selected tokens:", selectedStaked);
  try {
    const tx = await stakingContract.claimAll(selectedStaked);
    await tx.wait();
    logToPage("ClaimAll transaction confirmed");
    await loadUserNFTs();
  } catch (err) {
    logToPage("ClaimAll failed:", err.message || err);
  }
  btn.disabled = false;
});

// --------------------- RENDER NFT ON PAGE ---------------------
function renderOnChainNFT(div, tokenURI) {
  if (!tokenURI.startsWith("data:")) return;

  const meta = JSON.parse(atob(tokenURI.split(",")[1]));
  const svgBase64 = meta.image.split(",")[1];
  const svg = atob(svgBase64);

  const wrapper = document.createElement("div");
  wrapper.className = "nft-svg";
  wrapper.innerHTML = svg;

  const idDiv = document.createElement("div");
  idDiv.innerText = `ID: ${meta.id || 'unknown'}`;
  wrapper.appendChild(idDiv);

  div.appendChild(wrapper);
}

function renderNFTs() {
  const unstakeContainer = document.getElementById("unstakedNFTs");
  const stakedContainer = document.getElementById("stakedNFTs");
  unstakeContainer.innerHTML = "";
  stakedContainer.innerHTML = "";

  unstakedNFTs.forEach(nft => {
    const div = document.createElement("div");
    div.className = "nft-item";
    renderOnChainNFT(div, nft.uri);
    div.addEventListener("click", () => {
      div.classList.toggle("active");
      if (selectedUnstaked.includes(nft.tokenId))
        selectedUnstaked = selectedUnstaked.filter(id => id !== nft.tokenId);
      else selectedUnstaked.push(nft.tokenId);

      document.getElementById("stakeBtn").disabled = selectedUnstaked.length === 0;
      document.getElementById("unstakeBtn").disabled = selectedStaked.length === 0;
      document.getElementById("claimAllBtn").disabled = selectedStaked.length === 0;
    });
    unstakeContainer.appendChild(div);
  });

  stakedNFTs.forEach(nft => {
    const div = document.createElement("div");
    div.className = "nft-item";
    renderOnChainNFT(div, nft.uri);

    const rewardDiv = document.createElement("div");
    rewardDiv.className = "reward";
    rewardDiv.innerText = "Loading...";
    div.appendChild(rewardDiv);

    div.addEventListener("click", () => {
      div.classList.toggle("active");
      if (selectedStaked.includes(nft.tokenId))
        selectedStaked = selectedStaked.filter(id => id !== nft.tokenId);
      else selectedStaked.push(nft.tokenId);

      document.getElementById("stakeBtn").disabled = selectedUnstaked.length === 0;
      document.getElementById("unstakeBtn").disabled = selectedStaked.length === 0;
      document.getElementById("claimAllBtn").disabled = selectedStaked.length === 0;
    });

    stakedContainer.appendChild(div);
    updateNFTRewardForDebug(nft.tokenId);
  });
}

// --------------------- GLOBAL STATS ---------------------
async function loadGlobalStats() {
  try {
    logToPage("Loading global stats...");
    const apy = await stakingContract.currentAPY();
    const totalStaked = await stakingContract.totalStakedNFTs();
    const totalMinted = await stakingContract.totalMintedYAM();
    const yearBN = await stakingContract.currentYear();
    const year = yearBN.toNumber();
    const remaining = await stakingContract.remainingEmission(year);

    document.getElementById("currentAPY").innerText = apy.toString();
    document.getElementById("totalStakedNFTs").innerText = totalStaked.toString();
    document.getElementById("totalMintedYAM").innerText = ethers.utils.formatEther(totalMinted);
    document.getElementById("remainingEmission").innerText = ethers.utils.formatEther(remaining);

    logToPage("Global stats loaded: APY", apy.toString(), "Total Staked:", totalStaked.toString());
  } catch (err) {
    logToPage("Failed to load global stats:", err.message || err);
  }
}

// --------------------- HALVING COUNTDOWN ---------------------
async function startHalvingCountdown() {
  try {
    const startTimeBN = await stakingContract.startTime();
    const startTime = startTimeBN.toNumber();
    const halvingPeriod = 365*24*3600;

    setInterval(() => {
      const now = Math.floor(Date.now()/1000);
      const yearsPassed = Math.floor((now - startTime) / halvingPeriod);
      const nextHalving = startTime + (yearsPassed + 1) * halvingPeriod;

      const diff = nextHalving - now;
      const days = Math.floor(diff/86400);
      const hours = Math.floor((diff%86400)/3600);
      const mins = Math.floor((diff%3600)/60);
      const secs = diff%60;
      document.getElementById("halvingCountdown").innerText = `${days}d ${hours}h ${mins}m ${secs}s`;
    }, 1000);

    setInterval(() => {
      if (stakedNFTs.length) updateTotalRewards();
    }, 10000);

    logToPage("Halving countdown started");
  } catch (err) {
    logToPage("Halving countdown error:", err.message || err);
  }
}
