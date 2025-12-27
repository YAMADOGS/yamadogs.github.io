document.addEventListener("DOMContentLoaded", () => {

  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT = "0x715B3f16ec032aA81f4FE0828E913689295ea7Cc";
  const ABI = [
    "function mint() payable",
    "function totalSupply() view returns(uint256)"
  ];

  const mintedEl = document.getElementById("minted");
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const statusBox = document.getElementById("statusBox");
  const modal = document.getElementById("successModal");

  let provider, signer, contract;

  // -------------------------------
  // Toast notification
  // -------------------------------
  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
  }

  // -------------------------------
  // Clipboard copy with fallback
  // -------------------------------
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern API
      navigator.clipboard.writeText(text).then(() => showToast("Copied!"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      showToast("Copied!");
    } catch {
      alert("Copy failed. Please copy manually: " + text);
    }
    textarea.remove();
  }

  // -------------------------------
  // Load current supply
  // -------------------------------
  async function loadSupply() {
    try {
      const tempProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const tempContract = new ethers.Contract(CONTRACT, ABI, tempProvider);
      const supply = await tempContract.totalSupply();
      mintedEl.innerText = supply.toString();
    } catch (e) {
      mintedEl.innerText = "—";
      console.warn("Failed to load supply:", e);
    }
  }

  // -------------------------------
  // Update status box
  // -------------------------------
  function setStatus(msg) {
    statusBox.innerText = msg;
  }

  // -------------------------------
  // Connect wallet
  // -------------------------------
  connectBtn.onclick = async () => {
    if (!window.ethereum) return setStatus("No wallet detected");

    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      contract = new ethers.Contract(CONTRACT, ABI, signer);

      const addr = await signer.getAddress();
      setStatus("Wallet connected:\n" + addr);
      connectBtn.disabled = true;
      mintBtn.disabled = false;
    } catch (e) {
      setStatus("Connection failed");
      console.warn("Wallet connect error:", e);
    }
  };

  // -------------------------------
  // Mint NFT
  // -------------------------------
  mintBtn.onclick = async () => {
    if (!contract) return setStatus("Wallet not connected");

    try {
      setStatus("Minting...");
      const tx = await contract.mint({ value: ethers.utils.parseEther("0.0005") });
      await tx.wait();
      setStatus("Mint successful!");
      modal.style.display = "flex";
      loadSupply();
    } catch (e) {
      setStatus("Mint failed or rejected");
      console.warn("Mint error:", e);
    }
  };

  // -------------------------------
  // Close modal
  // -------------------------------
  document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
  };

  // -------------------------------
  // View source
  // -------------------------------
  document.getElementById("viewSourceBtn").onclick = () => {
    window.open("https://yamadogs.github.io", "_blank", "noopener");
  };

  // -------------------------------
  // Copy links and contract
  // -------------------------------
  document.querySelectorAll(".copy-link").forEach(el => {
    el.onclick = () => copyText(el.dataset.copy || CONTRACT);
  });

  const contractEl = document.getElementById("contractCopy");
  contractEl.innerText = CONTRACT;
  contractEl.dataset.copy = CONTRACT;

  // -------------------------------
  // Initial load
  // -------------------------------
  loadSupply();

});
