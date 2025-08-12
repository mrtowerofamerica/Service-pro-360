// ---- simple SPA scaffold so you can test today ----
const $ = s => document.querySelector(s);
const tabs = ["dashboard","customers","jobs","invoices","settings"];

// Fill views with basic content
function render() {
  $("#build").textContent = "";
  $("#view-dashboard").innerHTML = `
    <div class="card">Welcome! Use the tabs above.</div>
    <div class="card" style="margin-top:12px">
      <b>Quick actions</b>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="alert('New customer')">+ New Customer</button>
        <button onclick="alert('Schedule job')">+ Schedule Job</button>
        <button onclick="alert('Create invoice')">+ Create Invoice</button>
      </div>
    </div>`;
  $("#view-customers").innerHTML = `<div class="card">Customers list (sample)</div>`;
  $("#view-jobs").innerHTML = `<div class="card">Jobs board (sample)</div>`;
  $("#view-invoices").innerHTML = `<div class="card">Invoices (sample)</div>`;
  $("#view-setting").innerHTML = `<div class="card">Settings (sample)</div>`;
}

// Tab switching
function showTab(name) {
  for (const t of tabs) {
    const el = document.querySelector(`#view-${t === "settings" ? "setting" : t}`);
    if (!el) continue;
    el.classList.toggle("hidden", t !== name);
  }
  document.querySelectorAll(".tabbar button").forEach(btn => {
    btn.classList.toggle("primary", btn.dataset.tab === name);
  });
}

// Hook up UI
function wireUI() {
  document.querySelectorAll(".tabbar button").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
  showTab("dashboard");

  // language dummy
  document.querySelector("header select").addEventListener("change", e => {
    alert("Language set to: " + e.target.value);
  });
}

// PWA install button
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = $("#btn_install");
  btn.disabled = false;
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.textContent = "Installed";
    btn.disabled = true;
  }, { once: true });
});

window.addEventListener("load", () => {
  render();
  wireUI();
});
