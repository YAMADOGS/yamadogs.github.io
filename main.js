const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const NFT_ADDRESS = "0x4378682659304853EbD0146E85CF78EdECaE9647";
const NFT_ABI = ["function totalSupply() view returns(uint256)"];

async function loadSupply() {
  if (typeof ethers === "undefined") {
    console.warn("ethers not loaded");
    const el = document.getElementById("minted");
    if (el) el.innerText = "—";
    return;
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
    const minted = await contract.totalSupply();
    const el = document.getElementById("minted");
    if (el) el.innerText = minted.toString();
  } catch (e) {
    console.warn("RPC error:", e);
    const el = document.getElementById("minted");
    if (el) el.innerText = "—";
  }
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

function copyContract() {
  navigator.clipboard?.writeText(NFT_ADDRESS);
  showToast("Contract address copied!");
}

function copyLink() {
  navigator.clipboard?.writeText("https://yamadogs.org");
  showToast("Link copied! Open inside wallet browser.");
}

document.addEventListener("DOMContentLoaded", () => {
  loadSupply();
  document.querySelectorAll(".nft-container img").forEach(img => {
    img.addEventListener("click", () => {
      document.querySelectorAll(".nft-container img").forEach(i => {
        if (i !== img) i.classList.remove("active");
      });
      img.classList.toggle("active");
    });
  });

  // FAQ toggle
  document.querySelectorAll(".faq-question").forEach(q => {
    q.addEventListener("click", () => {
      q.parentElement.classList.toggle("active");
    });
  });

  // Mint button
  const mintBtn = document.getElementById("mintBtn");
  if (mintBtn) {
    mintBtn.addEventListener("click", () => {
      window.location.href = "/NFTmint/";
    });
  }
  
  const mintBtn2 = document.getElementById("mintBtn2");
  if (mintBtn2) {
    mintBtn2.addEventListener("click", () => {
      window.location.href = "/NFTstaking/";
    });
  }


  // Copy contract
  const contractEl = document.querySelector(".contract-address");
  if (contractEl) {
    contractEl.addEventListener("click", copyContract);
  }

  // Copy link
  const linkEl = document.querySelector(".copy-link");
  if (linkEl) {
    linkEl.addEventListener("click", copyLink);
  }

  // External links
  document.querySelectorAll(".link-buttons button").forEach(btn => {
    const url = btn.dataset.url;
    if (url) {
      btn.addEventListener("click", () => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
    }
  });

  // View source
  const viewSourceBtn = document.getElementById("viewSourceBtn");
  if (viewSourceBtn) {
    viewSourceBtn.addEventListener("click", () => {
      window.open("https://github.com/YAMADOGS/yamadogs.github.io", "_blank", "noopener,noreferrer");
    });
  }
  
// ===============================
// STARTUP INTRO (7s) → THEN NOTIFICATION
// ===============================
const intro = document.getElementById("startupIntro");
const progressBar = document.getElementById("introProgressBar");

const pageLoadNotif = document.getElementById("pageLoadNotification");
const pageLoadOverlay = document.getElementById("pageLoadOverlay");
const closePageLoadBtn = document.getElementById("closePageLoad");

// Hide warning at first
if (pageLoadNotif && pageLoadOverlay) {
  pageLoadNotif.style.display = "none";
  pageLoadOverlay.style.display = "none";
}

const INTRO_DURATION = 7000;
const startTime = performance.now();

function introLoop(now) {
  const elapsed = now - startTime;
  const progress = Math.min(elapsed / INTRO_DURATION, 1);

  if (progressBar) {
    progressBar.style.width = (progress * 100) + "%";
  }

  if (progress < 1) {
    requestAnimationFrame(introLoop);
  } else {
    if (intro) intro.style.display = "none";
    if (pageLoadNotif && pageLoadOverlay) {
      pageLoadNotif.style.display = "block";
      pageLoadOverlay.style.display = "block";
      document.body.classList.add("blurred");
    }
  }
}
requestAnimationFrame(introLoop);
if (closePageLoadBtn) {
  closePageLoadBtn.addEventListener("click", () => {
    pageLoadNotif.style.display = "none";
    pageLoadOverlay.style.display = "none";
    document.body.classList.remove("blurred");
  });
}

// DOWNLOAD LOGO
const downloadSvgBtn = document.getElementById("downloadSvg");
const downloadPngBtn = document.getElementById("downloadPng");

if (downloadSvgBtn) {
  downloadSvgBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = "logo.svg"; // must be served from your domain
    link.download = "YAMADOGS_logo.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

if (downloadPngBtn) {
  downloadPngBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = "logo.png"; // must be served from your domain
    link.download = "YAMADOGS_logo.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}


});


