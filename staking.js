const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
let signer;
let userAddress;
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("stakeBtn").disabled = true;
  document.getElementById("unstakeBtn").disabled = true;
  document.getElementById("claimAllBtn").disabled = true;
});

const stakingContractAddress = "0x8AC5f61bCe8D3b0766ADD7392F30aA254b285221";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// Simplified ABIs
const nftABI = [   {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
  {"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"MINT_PRICE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"TREASURY","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"s","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"o","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"o","type":"address"},{"internalType":"address","name":"op","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"o","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"f","type":"address"},{"internalType":"address","name":"t","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"f","type":"address"},{"internalType":"address","name":"t","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bytes","name":"d","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"op","type":"address"},{"internalType":"bool","name":"a","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"f","type":"address"},{"internalType":"address","name":"t","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"} ];
const stakingABI = [   {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"claimAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"userStaked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"pending","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"currentAPY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalStakedNFTs","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalMintedYAM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"currentYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"year","type":"uint256"}],"name":"remainingEmission","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"startTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"} ];

let stakingContract, nftContract;
let unstakedNFTs = [], stakedNFTs = [];
let selectedUnstaked = [], selectedStaked = [];

// --------------------- WALLET CONNECT ---------------------
document.getElementById("connectWalletBtn").addEventListener("click", async () => {
  if (window.ethereum) {
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await web3Provider.getNetwork();
    if (network.chainId !== 11155111) {
        alert("Please switch to Sepolia network");
        return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];
    signer = web3Provider.getSigner();

    document.getElementById("walletAddress").innerText = userAddress;
    stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, signer);
    nftContract = new ethers.Contract(nftAddress, nftABI, signer);

    document.getElementById("stakeBtn").disabled = false;
    document.getElementById("unstakeBtn").disabled = false;
    document.getElementById("claimAllBtn").disabled = false;

    await loadUserNFTs();
    await loadGlobalStats();
    startHalvingCountdown();
  } else {
    alert("Please install MetaMask!");
  }
});

// --------------------- RENDER NFT ---------------------
async function loadUserNFTs() {
  unstakedNFTs = [];
  stakedNFTs = [];
  selectedUnstaked = [];
  selectedStaked = [];

  const balance = await nftContract.balanceOf(userAddress);
  for (let i = 0; i < balance; i++) {
    const tokenId = (await nftContract.tokenOfOwnerByIndex(userAddress, i)).toString();
    const isStaked = await stakingContract.userStaked(userAddress, tokenId);

    let uri = await nftContract.tokenURI(tokenId);
    // Handle base64 JSON
    if (uri.startsWith("data:application/json;base64,")) {
      const json = JSON.parse(atob(uri.split(",")[1]));
      uri = json.image;
    }

    const nftData = { tokenId, uri };
    if (isStaked) stakedNFTs.push(nftData);
    else unstakedNFTs.push(nftData);
  }

  renderNFTs();
await updateTotalRewards();

}

function renderNFTs() {
  const unstakeContainer = document.getElementById("unstakedNFTs");
  const stakedContainer = document.getElementById("stakedNFTs");
  unstakeContainer.innerHTML = "";
  stakedContainer.innerHTML = "";

  unstakedNFTs.forEach(nft => {
    const div = document.createElement("div");
    div.className = "nft-item";
    div.innerHTML = `<img src="${nft.uri}" alt="NFT ${nft.tokenId}"><div>ID: ${nft.tokenId}</div>`;
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
    div.innerHTML = `<img src="${nft.uri}" alt="NFT ${nft.tokenId}"><div>ID: ${nft.tokenId}</div><div class="reward">Loading...</div>`;
    stakedContainer.appendChild(div);
    updateNFTReward(div, nft.tokenId);
    div.addEventListener("click", () => {
      div.classList.toggle("active");
      if (selectedStaked.includes(nft.tokenId))
        selectedStaked = selectedStaked.filter(id => id !== nft.tokenId);
      else selectedStaked.push(nft.tokenId);
      document.getElementById("stakeBtn").disabled = selectedUnstaked.length === 0;
     document.getElementById("unstakeBtn").disabled = selectedStaked.length === 0;
      document.getElementById("claimAllBtn").disabled = selectedStaked.length === 0;

    });
  });
}

async function updateNFTReward(div, tokenId){
  const reward = await stakingContract.pending(userAddress, tokenId);
  div.querySelector(".reward").innerText = `Rewards: ${ethers.utils.formatEther(reward)} YAM`;

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

  try {
    const tx = await stakingContract.stake(selectedUnstaked);
    await tx.wait();
    await loadUserNFTs();
  } catch (err) {
    console.error("Stake failed:", err);
  }

  btn.disabled = false;
});

document.getElementById("unstakeBtn").addEventListener("click", async () => {
  if (!selectedStaked.length) return;

  const btn = document.getElementById("unstakeBtn");
  btn.disabled = true;

  try {
    const tx = await stakingContract.unstake(selectedStaked);
    await tx.wait();
    await loadUserNFTs();
  } catch (err) {
    console.error("Unstake failed:", err);
  }

  btn.disabled = false;
});


document.getElementById("claimAllBtn").addEventListener("click", async () => {
  if (!selectedStaked.length) return;

  const btn = document.getElementById("claimAllBtn");
  btn.disabled = true;

  try {
    const tx = await stakingContract.claimAll(selectedStaked);
    await tx.wait();
    await loadUserNFTs();
  } catch (err) {
    console.error("Claim failed:", err);
  }

  btn.disabled = false;
});


// --------------------- GLOBAL STATS ---------------------
async function loadGlobalStats() {
  const apy = await stakingContract.currentAPY();
  const totalStaked = await stakingContract.totalStakedNFTs();
  const totalMinted = await stakingContract.totalMintedYAM();
const year = await stakingContract.currentYear();
const remaining = await stakingContract.remainingEmission(year);

  document.getElementById("remainingEmission").innerText =
  ethers.utils.formatEther(remaining);

  document.getElementById("currentAPY").innerText = apy.toString();
  document.getElementById("totalStakedNFTs").innerText = totalStaked.toString();
  document.getElementById("totalMintedYAM").innerText = ethers.utils.formatEther(totalMinted);
}

// --------------------- HALVING COUNTDOWN ---------------------
async function startHalvingCountdown() {
  const startTime = await stakingContract.startTime();
  const halvingPeriod = 365*24*3600;
  setInterval(() => {
    const now = Math.floor(Date.now()/1000);
    const yearsPassed = Math.floor((now - startTime) / halvingPeriod);
   const nextHalving = Number(startTime) + (yearsPassed + 1) * halvingPeriod;

    const diff = nextHalving - now;
    const days = Math.floor(diff/86400);
    const hours = Math.floor((diff%86400)/3600);
    const mins = Math.floor((diff%3600)/60);
    const secs = diff%60;
    document.getElementById("halvingCountdown").innerText = `${days}d ${hours}h ${mins}m ${secs}s`;
  }, 1000);
  
  // Refresh total rewards every 10 seconds
setInterval(() => {
    if (stakedNFTs.length) updateTotalRewards();
}, 10000);

}
