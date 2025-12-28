document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     COMMON CONFIG
  ======================= */
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

  /* =======================
     COMMON FUNCTIONS
  ======================= */
  function showToast(msg, toastEl = null, overlayEl = null) {
    // fallback for index.html toast
    const t = toastEl || document.getElementById("toast");
    const overlay = overlayEl || document.getElementById("toastOverlay");
    if (!t) return;
    t.innerText ??= msg;
    t.classList.add("show");
    if (overlay) overlay.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
    if (overlay) overlay.classList.remove("show");
  }

  function copyToClipboard(text, toastEl = null, overlayEl = null) {
    navigator.clipboard?.writeText(text);
    showToast("Copied!", toastEl, overlayEl);
  }

  /* =======================
     INDEX.HTML SPECIFIC
  ======================= */
  if (document.getElementById("minted")) {
    const NFT_ADDRESS = "0x715B3f16ec032aA81f4FE0828E913689295ea7Cc";
    const NFT_ABI = ["function totalSupply() view returns(uint256)"];

    async function loadSupply() {
      if (typeof ethers === "undefined") return;
      try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
        const minted = await contract.totalSupply();
        document.getElementById("minted").innerText = minted.toString();
      } catch (e) {
        console.warn("RPC error:", e);
        document.getElementById("minted").innerText = "—";
      }
    }

    // Run index.html specific scripts
    loadSupply();

    // NFT click, FAQ toggle, mint button navigation, copy buttons...
    document.querySelectorAll(".nft-container img").forEach(img => {
      img.addEventListener("click", () => {
        document.querySelectorAll(".nft-container img").forEach(i => i !== img && i.classList.remove("active"));
        img.classList.toggle("active");
      });
    });

    document.querySelectorAll(".faq-question").forEach(q => {
      q.addEventListener("click", () => q.parentElement.classList.toggle("active"));
    });

    document.getElementById("mintBtn")?.addEventListener("click", () => {
      window.location.href = "/NFTmint.html";
    });

    document.querySelector(".contract-address")?.addEventListener("click", () => copyToClipboard(NFT_ADDRESS));
    document.querySelector(".copy-link")?.addEventListener("click", () => copyToClipboard("https://yamadogs.github.io"));

    document.querySelectorAll(".link-buttons button").forEach(btn => {
      const url = btn.dataset.url;
      if (url) btn.addEventListener("click", () => window.open(url, "_blank", "noopener"));
    });

    document.getElementById("viewSourceBtn")?.addEventListener("click", () => {
      window.open("https://github.com/YAMADOGS/yamadogs.github.io", "_blank", "noopener");
    });
  }

  /* =======================
     NFTMINT.HTML SPECIFIC
  ======================= */
  if (document.getElementById("connectBtn")) {
    const CONTRACT_ADDRESS = "0x715B3f16ec032aA81f4FE0828E913689295ea7Cc";
    const MAX_SUPPLY = 2026;
    const MINT_PRICE = "0.0005"; // ETH
    const ABI = ["function mint() payable", "function totalSupply() view returns(uint256)"];

    // Elements
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

    // Toast
    copyToastClose?.addEventListener("click", () => copyToast?.classList.remove("show"));
    toastOverlay?.addEventListener("click", () => copyToast?.classList.remove("show"));

    function setMintStatus(msg, color = "#6fdcff") {
      if (!mintStatusEl) return;
      mintStatusEl.textContent = msg;
      mintStatusEl.style.color = color;
    }

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
        if (network.chainId !== 11155111) {
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
        console.error(err);
        setMintStatus("Wallet connection failed", "#ff6b6b");
      }
    }

    async function mintNFT() {
      if (!contract) return;
      try {
        mintBtn?.setAttribute("disabled", true);
        setMintStatus("Minting...");
        const tx = await contract.mint({ value: ethers.utils.parseEther(MINT_PRICE) });
        await tx.wait();
        setMintStatus("Mint successful!");
        updateMintCounter();
        showToast("🎉 Mint success! Your YAMADOG is now part of the pack!");
      } catch (err) {
        console.error(err);
        setMintStatus("Mint failed", "#ff6b6b");
      } finally {
        mintBtn?.removeAttribute("disabled");
      }
    }

    async function updateMintCounter() {
      try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const total = await contract.totalSupply();
        mintCounterEl.textContent = `Minted: ${total} / ${MAX_SUPPLY}`;
      } catch (err) {
        console.error(err);
      }
    }

    // Event listeners
    connectBtn?.addEventListener("click", connectWallet);
    mintBtn?.addEventListener("click", mintNFT);
    contractEl?.addEventListener("click", () => copyToClipboard(CONTRACT_ADDRESS, copyToast, toastOverlay));
    linkEl?.addEventListener("click", () => copyToClipboard("https://yamadogs.org", copyToast, toastOverlay));
    viewSourceBtn?.addEventListener("click", () => window.open("https://github.com/YAMADOGS/yamadogs.github.io", "_blank", "noopener"));
  }

});
