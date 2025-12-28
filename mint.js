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
  
function launchConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
     }, 250);
     }

  /* =======================
     DOM ELEMENTS
  ======================= */
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const walletAddressEl = document.getElementById("walletAddress");
  const mintStatusEl = document.getElementById("mintStatus");
  const mintCounterEl = document.getElementById("mintCounter");
  const copyToast = document.getElementById("mintToast");
  const copyToastClose = document.getElementById("closeToast");
  const toastOverlay = document.getElementById("toastOverlay");
  const contractEl = document.getElementById("contractLink");
  const linkEl = document.getElementById("websiteLink");
  const viewSourceBtn = document.getElementById("viewSourceBtn");

  /* =======================
     TOAST FUNCTIONS
  ======================= */
  function showToast(msg) {
    if (!copyToast || !toastOverlay) return;
    const body = copyToast.querySelector(".mint-toast-body");
    if (!body) return;
    body.textContent = msg;
    copyToast.classList.add("show");
    toastOverlay.classList.add("show");
  }

  function hideToast() {
    copyToast?.classList.remove("show");
    toastOverlay?.classList.remove("show");
  }

  copyToastClose?.addEventListener("click", hideToast);
  toastOverlay?.addEventListener("click", hideToast);

  /* =======================
     COPY FUNCTIONS
  ======================= */
  function copyContract() {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    showToast("Contract address copied!");
  }

  function copyLink() {
    navigator.clipboard.writeText("https://yamadogs.org");
    showToast("Link copied!");
  }

  contractEl?.addEventListener("click", copyContract);
  linkEl?.addEventListener("click", copyLink);
  
const altLinkEl = document.getElementById("altWebsiteLink");

function copyAltLink() {
  navigator.clipboard.writeText("https://yamadogs.github.io");
  showToast("Alternate website link copied!");
}

altLinkEl?.addEventListener("click", copyAltLink);


  /* =======================
     UPDATE MINT COUNTER
  ======================= */
  async function updateMintCounter() {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const total = await contract.totalSupply();
      if (mintCounterEl) {
        mintCounterEl.textContent = `Minted: ${total} / ${MAX_SUPPLY}`;
      }
    } catch (err) {
      console.error("Counter error:", err);
    }
  }

  /* =======================
     WALLET STATUS UTILITY
  ======================= */
  function setMintStatus(msg, color = "#6fdcff") {
    if (!mintStatusEl) return;
    mintStatusEl.textContent = msg;
    mintStatusEl.style.color = color;
  }

  /* =======================
     CONNECT WALLET
  ======================= */
  let provider, signer, contract;

  async function connectWallet() {
    if (!window.ethereum) {
  showToast("⚠️ Please install MetaMask or a compatible wallet.");
  setMintStatus("Wallet not detected", "#ff6b6b"); 
  return;
}


    try {
      setMintStatus("Connecting wallet...");

      await window.ethereum.request({ method: "eth_requestAccounts" });

      provider = new ethers.providers.Web3Provider(window.ethereum);

      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) { // replace with Base chain ID if needed
        alert("Please switch to Base Chain");
        setMintStatus("Wrong network", "#ff6b6b");
        return;
      }

      signer = provider.getSigner();
      const address = await signer.getAddress();
      if (walletAddressEl) walletAddressEl.textContent = `Wallet: ${address}`;

      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      connectBtn?.setAttribute("disabled", true);
      mintBtn?.removeAttribute("disabled");

      setMintStatus("Wallet connected");
      updateMintCounter();

    } catch (err) {
      console.error("Connect error:", err);
      setMintStatus("Wallet connection failed", "#ff6b6b");
    }
  }

  /* =======================
     MINT NFT
  ======================= */
  async function mintNFT() {
    if (!contract) return;

    try {
      mintBtn?.setAttribute("disabled", true);
      setMintStatus("Minting YAMADOG..");

      const tx = await contract.mint({
        value: ethers.utils.parseEther(MINT_PRICE)
      });

      await tx.wait();

      setMintStatus("Mint successful!");
      updateMintCounter();
      showToast("🎉 Mint success! Your YAMADOG is now part of the pack and ready for some pup-tastic journeys! 🐾");
        launchConfetti();
    } catch (err) {
      console.error("Mint error:", err);
      setMintStatus("Mint failed", "#ff6b6b");
    } finally {
      mintBtn?.removeAttribute("disabled");
    }
  }

  /* =======================
     VIEW SOURCE BUTTON
  ======================= */
  viewSourceBtn?.addEventListener("click", () => {
    window.open("https://github.com/YAMADOGS/yamadogs.github.io", "_blank", "noopener,noreferrer");
  });

  /* =======================
     EVENT LISTENERS
  ======================= */
  connectBtn?.addEventListener("click", connectWallet);
  mintBtn?.addEventListener("click", mintNFT);

});
