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
  "function totalSupply() view returns(uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

  
function launchConfetti() {
  if (document.querySelector(".confetti-canvas")) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = 999999;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLOR = "#ffb703";

  const particles = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 200,
    size: Math.random() * 6 + 6,
    vx: (Math.random() - 0.5) * 3,
    vy: -(Math.random() * 6 + 4),
    rotation: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.08,
    life: 130,
    type: Math.random() < 0.6 ? "paw" : "bone" // 60% paws, 40% bones
  }));

  function drawPaw(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = COLOR;

    // Main pad
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Toe pads
    const toeOffset = size * 0.9;
    const toeSize = size * 0.45;

    [
      [-toeOffset, -toeOffset],
      [0, -toeOffset * 1.2],
      [toeOffset, -toeOffset],
      [-toeOffset * 0.6, -toeOffset * 1.6]
    ].forEach(([tx, ty]) => {
      ctx.beginPath();
      ctx.arc(tx, ty, toeSize, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawBone(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = COLOR;

    const r = size * 0.45;
    const length = size * 2;

    // Left nub
    ctx.beginPath();
    ctx.arc(-length / 2, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Right nub
    ctx.beginPath();
    ctx.arc(length / 2, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Center bar
    ctx.beginPath();
    ctx.rect(-length / 2, -r, length, r * 2);
    ctx.fill();

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.rotation += p.vr;
      p.life--;

      if (p.type === "paw") {
        drawPaw(p.x, p.y, p.size, p.rotation);
      } else {
        drawBone(p.x, p.y, p.size, p.rotation);
      }
    });

    if (particles.some(p => p.life > 0)) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  animate();
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
  function showToast(msg, type = "info") {
  if (!copyToast || !toastOverlay) return;
  const body = copyToast.querySelector(".mint-toast-body");
  if (!body) return;

  body.innerHTML = msg;
  copyToast.classList.remove("success", "warning", "error", "info");
  copyToast.classList.add(type);
  copyToast.classList.add("show");
  toastOverlay.classList.add("show");
}

function hideToast() {
  if (!copyToast || !toastOverlay) return;
  copyToast.classList.remove("show", "success", "warning", "error", "info");
  toastOverlay.classList.remove("show");
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
      if (network.chainId !== 11155111) { 
        showToast("Please switch to Base Chain");
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
  
function openSepoliaNFT(tokenId) {
  const url = `https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}?a=${tokenId}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function showMintingOverlay() {
  const overlay = document.getElementById("mintingOverlay");
  if (!overlay) return;

  overlay.style.display = "flex";
  
  // Force reflow for CSS animation
  void overlay.offsetWidth;

  document.body.classList.add("minting-active");

  const logo = overlay.querySelector(".minting-logo");
  if (logo) logo.classList.add("jump-active");

  const bar = overlay.querySelector(".progress-bar");
  if (bar) {
    bar.style.width = "0%"; // reset
    // restart progress bar animation
    bar.style.animation = "none";
    void bar.offsetWidth; // force reflow
    bar.style.animation = "progressAnim 1.5s linear forwards";
  }
}



function hideMintingOverlay() {
  const overlay = document.getElementById("mintingOverlay");
  if (!overlay) return;
  overlay.style.display = "none";               
  document.body.classList.remove("minting-active");

  // Remove jump animation
  const logo = overlay.querySelector(".minting-logo");
  if (logo) logo.classList.remove("jump-active");
}

  /* =======================
     MINT NFT
  ======================= */
  async function mintNFT() {
  if (!contract) return;

  mintBtn?.setAttribute("disabled", true);
  setMintStatus("Waiting for wallet confirmation..."); // step 1: user confirms in wallet

  try {
    // Send transaction (wallet popup)
    const tx = await contract.mint({
      value: ethers.utils.parseEther(MINT_PRICE)
    });

    // ✅ step 2: show minting animation AFTER wallet confirmed
    showMintingOverlay();
    setMintStatus("Minting YAMADOGS...");

    // Wait for blockchain confirmation
    const receipt = await tx.wait();

    // ✅ step 3: hide overlay when mint is confirmed
    hideMintingOverlay();

    // Find tokenId from Transfer event
    const transferEvent = receipt.events?.find(
      e => e.event === "Transfer" && e.args?.from === ethers.constants.AddressZero
    );
    const tokenId = transferEvent?.args?.tokenId?.toString();

    // Update counter & status
    updateMintCounter();
    setMintStatus("Mint successful!");

    // Show toast
    if (tokenId) {
      showToast(`
        🎉 Mint success! Your YAMADOGS is now part of the pack and ready for some pup-tastic journeys!🐾<b>YAMADOGS #${tokenId}</b><br>
        <a href="#" id="viewNftLink" style="color:#ffb703; text-decoration:underline;">
          🔗 View on Sepolia
        </a>
      `, "success");

      setTimeout(() => {
        document.getElementById("viewNftLink")?.addEventListener("click", (e) => {
          e.preventDefault();
          openSepoliaNFT(tokenId);
        });
      }, 50);
    } else {
      showToast("🎉 Mint successful! Your YAMADOG has joined the pack 🐾", "success");
    }

    // Launch confetti
    launchConfetti();

  } catch (err) {
    console.error("Mint error:", err);
    hideMintingOverlay();
    setMintStatus("Mint failed", "#ff6b6b");
    showToast("❌ Mint failed. Try again!", "error");
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
  
// Ensure overlay is hidden initially
hideMintingOverlay();


});
