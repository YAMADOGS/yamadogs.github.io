document.addEventListener("DOMContentLoaded", () => {
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT_ADDRESS = "0x715B3f16ec032aA81f4FE0828E913689295ea7Cc";
  const ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINT_PRICE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TREASURY","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}];

  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const walletAddressEl = document.getElementById("walletAddress");
  const mintStatusEl = document.getElementById("mintStatus");
  const mintCounterEl = document.getElementById("mintCounter");

  let provider;
  let signer;
  let contract;

  async function updateMintCounter() {
    try {
      const total = await contract.totalSupply();
      mintCounterEl.textContent = `Minted: ${total} / 2026`;
    } catch (err) {
      console.error(err);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask or another wallet!");
      return;
    }

    try {
      mintStatusEl.textContent = "Connecting wallet...";
      
      // Request accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Initialize provider & signer using UMD ethers
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      const address = await signer.getAddress();
      walletAddressEl.textContent = `Wallet: ${address}`;

      // Connect to contract
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // Disable connect button and enable mint button
      connectBtn.disabled = true;
      mintBtn.disabled = false;
      mintStatusEl.textContent = "Wallet connected";

      // Update mint counter
      updateMintCounter();
    } catch (err) {
      console.error(err);
      mintStatusEl.textContent = "Connection failed";
    }
}


  async function mintNFT() {
    if (!contract) return;
    try {
        mintBtn.disabled = true;
        mintStatusEl.textContent = "Minting...";
        
        // v5 syntax for parseEther
        const tx = await contract.mint({ value: ethers.utils.parseEther("0.0005") });
        await tx.wait();
        
        mintStatusEl.textContent = "Mint successful!";
        updateMintCounter();
    } catch (err) {
        console.error(err);
        mintStatusEl.textContent = "Mint failed";
    } finally {
        mintBtn.disabled = false;
    }
}


  connectBtn.addEventListener("click", connectWallet);
  mintBtn.addEventListener("click", mintNFT);

  // Copy to clipboard function
  window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  };
});
