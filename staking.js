// --------------------- CONFIG ---------------------
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
let signer;
let userAddress;

// --------------------- CONTRACT ADDRESSES ---------------------
const stakingContractAddress = "0x8AC5f61bCe8D3b0766ADD7392F30aA254b285221";
const nftAddress = "0x4378682659304853EbD0146E85CF78EdECaE9647";

// --------------------- NFT CONTRACT ABI ---------------------
const nftABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
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
  {"inputs":[{"internalType":"address","name":"f","type":"address"},{"internalType":"address","name":"t","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

// --------------------- STAKING CONTRACT ABI ---------------------
const stakingABI = [
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"claimAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"userStaked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"pending","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"currentAPY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalStakedNFTs","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalMintedYAM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"currentYear","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"year","type":"uint256"}],"name":"remainingEmission","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"startTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// --------------------- CONTRACT INSTANCES ---------------------
const stakingContract = new ethers.Contract(stakingContractAddress, stakingABI, provider);
const nftContract = new ethers.Contract(nftAddress, nftABI, provider);

// --------------------- STATE ---------------------
let unstakedNFTs = [];
let stakedNFTs = [];
let selectedUnstaked = [];
let selectedStaked = [];

// --------------------- WALLET CONNECT ---------------------
async function connectWallet() {
  if(window.ethereum){
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];
    signer = provider.getSigner();
    await loadUserNFTs();
    await loadGlobalStats();
    startHalvingCountdown();
  } else {
    alert("Please install MetaMask!");
  }
}

// --------------------- LOAD USER NFTs ---------------------
async function loadUserNFTs() {
  unstakedNFTs = [];
  stakedNFTs = [];

  const balance = await nftContract.balanceOf(userAddress);
  for(let i=0; i<balance; i++){
    const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress,i);
    const isStaked = await stakingContract.userStaked(userAddress, tokenId);
    const uri = await nftContract.tokenURI(tokenId);
    const nftData = {tokenId: tokenId.toString(), uri};

    if(isStaked){
      stakedNFTs.push(nftData);
    } else {
      unstakedNFTs.push(nftData);
    }
  }

  renderNFTs();
}

// --------------------- RENDER NFT CONTAINERS ---------------------
function renderNFTs() {
  const unstakeContainer = document.getElementById("unstakeNFTs");
  const stakedContainer = document.getElementById("stakedNFTs");
  unstakeContainer.innerHTML = "";
  stakedContainer.innerHTML = "";

  // Unstaked NFTs
  unstakedNFTs.forEach(nft=>{
    const div = document.createElement("div");
    div.className = "nft-item";
    div.innerHTML = `<img src="${nft.uri}" alt="NFT ${nft.tokenId}"><div>ID: ${nft.tokenId}</div>`;
    div.onclick = ()=>{
      div.classList.toggle("active");
      if(selectedUnstaked.includes(nft.tokenId)){
        selectedUnstaked = selectedUnstaked.filter(id=>id!==nft.tokenId);
      } else {
        selectedUnstaked.push(nft.tokenId);
      }
      document.getElementById("stakeBtn").classList.toggle("glow", selectedUnstaked.length>0);
    };
    unstakeContainer.appendChild(div);
  });

  // Staked NFTs
  stakedNFTs.forEach(nft=>{
    const div = document.createElement("div");
    div.className = "nft-item";
    div.innerHTML = `<img src="${nft.uri}" alt="NFT ${nft.tokenId}"><div>ID: ${nft.tokenId}</div><div class="reward">Loading...</div>`;
    stakedContainer.appendChild(div);
    updateNFTReward(div, nft.tokenId);
    div.onclick = ()=>{
      div.classList.toggle("active");
      if(selectedStaked.includes(nft.tokenId)){
        selectedStaked = selectedStaked.filter(id=>id!==nft.tokenId);
      } else {
        selectedStaked.push(nft.tokenId);
      }
      document.getElementById("unstakeBtn").classList.toggle("glow", selectedStaked.length>0);
    };
  });
}

// --------------------- UPDATE NFT REWARD ---------------------
async function updateNFTReward(div, tokenId){
  const reward = await stakingContract.pending(userAddress, tokenId);
  div.querySelector(".reward").innerText = `Rewards: ${ethers.utils.formatEther(reward)} YAM`;
}

// --------------------- STAKE/UNSTAKE/CLAIM ---------------------
async function stakeSelected(){
  if(selectedUnstaked.length===0) return;
  const tx = await stakingContract.connect(signer).stake(selectedUnstaked);
  await tx.wait();
  selectedUnstaked = [];
  await loadUserNFTs();
}

async function unstakeSelected(){
  if(selectedStaked.length===0) return;
  const tx = await stakingContract.connect(signer).unstake(selectedStaked);
  await tx.wait();
  selectedStaked = [];
  await loadUserNFTs();
}

async function claimAllRewards(){
  const tokenIds = stakedNFTs.map(nft=>nft.tokenId);
  if(tokenIds.length===0) return;
  const tx = await stakingContract.connect(signer).claimAll(tokenIds);
  await tx.wait();
  await loadUserNFTs();
}

// --------------------- GLOBAL STATS ---------------------
async function loadGlobalStats(){
  const apy = await stakingContract.currentAPY();
  const totalStaked = await stakingContract.totalStakedNFTs();
  const totalMinted = await stakingContract.totalMintedYAM();
  document.getElementById("currentAPY").innerText = `Current APY: ${apy.toString()}%`;
  document.getElementById("totalStaked").innerText = `Total NFTs Staked: ${totalStaked.toString()}`;
  document.getElementById("totalMinted").innerText = `Total YAM Minted: ${ethers.utils.formatEther(totalMinted)} YAM`;
}

// --------------------- HALVING COUNTDOWN ---------------------
async function startHalvingCountdown(){
  const startTime = await stakingContract.startTime();
  const halvingPeriod = 365*24*3600;
  setInterval(()=>{
    const now = Math.floor(Date.now()/1000);
    const nextHalving = startTime.toNumber() + halvingPeriod;
    const diff = nextHalving - now;
    const days = Math.floor(diff/86400);
    const hours = Math.floor((diff%86400)/3600);
    const mins = Math.floor((diff%3600)/60);
    const secs = diff%60;
    document.getElementById("halvingCountdown").innerText = `Next Halving: ${days}d ${hours}h ${mins}m ${secs}s`;
  },1000);
}

// --------------------- INIT ---------------------
window.onload = connectWallet;

// --------------------- BUTTON HANDLERS ---------------------
document.getElementById("stakeBtn").onclick = stakeSelected;
document.getElementById("unstakeBtn").onclick = unstakeSelected;
document.getElementById("claimBtn").onclick = claimAllRewards;
