document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     CONFIG
  ======================= */
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT_ADDRESS = "0x715B3f16ec032aA81f4FE0828E913689295ea7Cc";
  const MAX_SUPPLY = 2026;
  const MINT_PRICE = "0.0005"; // ETH

  const ABI = [
    "function mint() payable",
    "function totalSupply() view returns(uint256)"
  ];

  /* =======================
     DOM ELEMENTS
  ======================= */
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const walletAddressEl = document.getElementById("walletAddress");
  const mintStatusEl = document.getElementById("mintStatus");
  const mintCounterEl = document.getElementById("mintCounter");

  // Toast notification
  const toast = document.getElementById("mintToast");
  const closeToast = document.getElementById("closeToast");

  /* =======================
     ETHERS
  ======================= */
  let provider;
  let signer;
  let contract;

  /* =======================
     TOAST FUNCTIONS
  ======================= */
  function showToast() {
    toast.classList.add("show");
  }

  function hideToast() {
    toast.classList.remove("show");
  }

  closeToast.addEventListener("click", hideToast);

  /* =======================
     COPY TO CLIPBOARD
  ======================= */
  window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  };

  /* =======================
     UPDATE MINT COUNTER
  ======================= */
  async function updateMintCounter() {
    try {
      const total = await contract.totalSupply();
      mintCounterEl.textContent = `Minted: ${total} / ${MAX_SUPPLY}`;
    } catch (err) {
      console.error("Counter error:", err);
    }
  }

  /* =======================
     CONNECT WALLET
  ======================= */
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask or a compatible wallet.");
      return;
    }

    try {
      mintStatusEl.textContent = "Connecting wallet...";

      await window.ethereum.request({ method: "eth_requestAccounts" });

      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();

      const address = await signer.getAddress();
      walletAddressEl.textContent = `Wallet: ${address}`;

      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      connectBtn.disabled = true;
      mintBtn.disabled = false;

      mintStatusEl.textContent = "Wallet connected";
      updateMintCounter();

    } catch (err) {
      console.error("Connect error:", err);
      mintStatusEl.textContent = "Wallet connection failed";
    }
  }

  /* =======================
     MINT NFT
  ======================= */
  async function mintNFT() {
    if (!contract) return;

    try {
      mintBtn.disabled = true;
      mintStatusEl.textContent = "Minting...";

      const tx = await contract.mint({
        value: ethers.utils.parseEther(MINT_PRICE)
      });

      await tx.wait();

      mintStatusEl.textContent = "Mint successful!";
      updateMintCounter();
      showToast();

    } catch (err) {
      console.error("Mint error:", err);
      mintStatusEl.textContent = "Mint failed";
    } finally {
      mintBtn.disabled = false;
    }
  }

  /* =======================
     EVENTS
  ======================= */
  connectBtn.addEventListener("click", connectWallet);
  mintBtn.addEventListener("click", mintNFT);

});
