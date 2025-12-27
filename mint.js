document.addEventListener("DOMContentLoaded", () => {
  // ---------------- CONFIG ----------------
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT_ADDRESS = "0x715B3f16ec032aA81f4FE0828E913689295ea7Cc";
  const ABI = [
    "function mint() payable",
    "function totalSupply() view returns (uint256)"
  ];

  // ---------------- ELEMENTS ----------------
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const statusBox = document.getElementById("statusBox");
  const mintedEl = document.getElementById("minted");
  const successModal = document.getElementById("successModal");
  const closeModal = document.getElementById("closeModal");
  const contractCopy = document.getElementById("contractCopy");
  const toast = document.getElementById("toast");
  const copyLinks = document.querySelectorAll(".copy-link");

  // Show contract address
  contractCopy.textContent = CONTRACT_ADDRESS;

  // ---------------- HELPERS ----------------
  function showStatus(msg) {
    statusBox.textContent = msg;
  }

  function showToast(msg = "Copied!") {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // ---------------- COPY FUNCTION ----------------
  copyLinks.forEach(el => {
    el.addEventListener("click", () => {
      navigator.clipboard.writeText(el.dataset.copy || el.textContent)
        .then(() => showToast())
        .catch(() => showToast("Copy failed"));
    });
  });

  // ---------------- WALLET & CONTRACT ----------------
  let provider, signer, contract;

  async function connectWallet() {
    if (!window.ethereum) {
      showStatus("⚠️ MetaMask not detected!");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      showStatus("✅ Wallet connected!");
      connectBtn.textContent = "WALLET CONNECTED";
      mintBtn.disabled = false;
      updateSupply();
    } catch (err) {
      console.error(err);
      showStatus("❌ Connection failed");
    }
  }

  async function updateSupply() {
    try {
      const total = await contract.totalSupply();
      mintedEl.textContent = total.toString();
    } catch (err) {
      console.error(err);
      mintedEl.textContent = "—";
    }
  }

  async function mintNFT() {
    if (!contract) {
      showStatus("⚠️ Wallet not connected!");
      return;
    }
    try {
      showStatus("⏳ Minting...");
      const tx = await contract.mint({ value: ethers.utils.parseEther("0.01") }); // adjust price if needed
      await tx.wait();
      showStatus("✅ Mint successful!");
      successModal.style.display = "block";
      updateSupply();
    } catch (err) {
      console.error(err);
      showStatus("❌ Mint failed: " + (err.message || err));
    }
  }

  // ---------------- EVENT LISTENERS ----------------
  connectBtn.addEventListener("click", connectWallet);
  mintBtn.addEventListener("click", mintNFT);
  closeModal.addEventListener("click", () => {
    successModal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === successModal) successModal.style.display = "none";
  });

  // ---------------- INITIALIZATION ----------------
  // Populate contract copy
  contractCopy.textContent = CONTRACT_ADDRESS;
});
