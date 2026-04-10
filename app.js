/* ============================================================
   TruthLens — app.js
   Soft Pink & Rose Gold Theme
   ============================================================ */

"use strict";

/* ── Constants ──────────────────────────────────────────────── */
const EXAMPLES = [
  "The Great Wall of China is visible from space.",
  "Humans only use 10% of their brains.",
  "Lightning never strikes the same place twice.",
  "Mount Everest is the tallest mountain on Earth.",
  "Albert Einstein failed math as a child.",
  "A goldfish has a 3-second memory.",
  "Bananas are berries but strawberries are not.",
  "Water boils at 100°C at sea level."
];

const LOADING_MSGS = [
  "🌸 Scanning patterns…",
  "🌺 Checking knowledge base…",
  "🌷 Weighing evidence…",
  "💮 Running fact checks…",
  "✨ Computing probability…"
];

const SIGNAL_CONFIG = [
  { key: "factualAccuracy",    label: "Factual Accuracy",    emoji: "📊", color: "#e11d48", grad: "linear-gradient(90deg,#fda4af,#e11d48)", box: "signal-box-0", name: "signal-name-0" },
  { key: "sourceReliability",  label: "Source Reliability",  emoji: "📰", color: "#b45309", grad: "linear-gradient(90deg,#fcd34d,#b45309)", box: "signal-box-1", name: "signal-name-1" },
  { key: "logicalConsistency", label: "Logical Consistency", emoji: "🧩", color: "#7c3aed", grad: "linear-gradient(90deg,#c4b5fd,#7c3aed)", box: "signal-box-2", name: "signal-name-2" },
  { key: "scientificConsensus",label: "Scientific Consensus",emoji: "🔬", color: "#c2410c", grad: "linear-gradient(90deg,#fdba74,#c2410c)", box: "signal-box-3", name: "signal-name-3" }
];

const VERDICT_ICONS   = { TRUE: "✅", FALSE: "❌", UNCERTAIN: "⚠️" };
const CHIP_CLASSES    = ["chip-0","chip-1","chip-2","chip-3","chip-4","chip-5","chip-6","chip-7"];

/* ── DOM Refs ───────────────────────────────────────────────── */
const inputEl      = document.getElementById("inputText");
const charCountEl  = document.getElementById("charCount");
const analyzeBtn   = document.getElementById("analyzeBtn");
const clearBtn     = document.getElementById("clearBtn");
const loadingEl    = document.getElementById("loading");
const loadingText  = document.getElementById("loadingText");
const resultEl     = document.getElementById("result");
const errorBanner  = document.getElementById("errorBanner");
const errorMsg     = document.getElementById("errorMsg");
const examplesRow  = document.getElementById("examplesRow");

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  buildExamples();
  spawnPetals();
  inputEl.addEventListener("input", onInput);
  analyzeBtn.addEventListener("click", analyze);
  clearBtn.addEventListener("click", clearAll);
});

/* ── Build example chips ────────────────────────────────────── */
function buildExamples() {
  EXAMPLES.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "chip " + CHIP_CLASSES[i % CHIP_CLASSES.length];
    btn.textContent = text;
    btn.addEventListener("click", () => {
      inputEl.value = text;
      onInput();
      inputEl.focus();
    });
    examplesRow.appendChild(btn);
  });
}

/* ── Spawn floating petals ──────────────────────────────────── */
function spawnPetals() {
  const petals = ["🌸", "🌺", "🌷", "💮", "🌼"];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("div");
    p.style.cssText = `
      position: fixed;
      font-size: ${10 + Math.random() * 10}px;
      left: ${Math.random() * 100}vw;
      pointer-events: none;
      z-index: 0;
      opacity: 0;
      animation: petalFall ${10 + Math.random() * 14}s linear ${Math.random() * 14}s infinite;
    `;
    p.textContent = petals[Math.floor(Math.random() * petals.length)];
    document.body.appendChild(p);
  }

  // inject petalFall keyframe once
  if (!document.getElementById("petalStyle")) {
    const style = document.createElement("style");
    style.id = "petalStyle";
    style.textContent = `
      @keyframes petalFall {
        0%   { opacity:0; transform: translateY(-20px) rotate(0deg); }
        10%  { opacity: 0.7; }
        90%  { opacity: 0.5; }
        100% { opacity:0; transform: translateY(100vh) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

/* ── Input handler ──────────────────────────────────────────── */
function onInput() {
  const len = inputEl.value.length;
  charCountEl.textContent = `${len} / 500`;
  charCountEl.classList.toggle("warn", len > 450);
  inputEl.classList.remove("shake");
  errorBanner.setAttribute("hidden", "");
}

/* ── Clear ──────────────────────────────────────────────────── */
function clearAll() {
  inputEl.value = "";
  charCountEl.textContent = "0 / 500";
  charCountEl.classList.remove("warn");
  resultEl.setAttribute("hidden", "");
  loadingEl.setAttribute("hidden", "");
  errorBanner.setAttribute("hidden", "");
  analyzeBtn.disabled = false;
}

/* ── Loading messages ───────────────────────────────────────── */
let msgTimer = null;

function startLoading() {
  let i = 0;
  loadingText.textContent = LOADING_MSGS[0];
  loadingEl.removeAttribute("hidden");
  msgTimer = setInterval(() => {
    i = (i + 1) % LOADING_MSGS.length;
    loadingText.textContent = LOADING_MSGS[i];
  }, 1800);
}

function stopLoading() {
  clearInterval(msgTimer);
  loadingEl.setAttribute("hidden", "");
}

/* ── Analyze ────────────────────────────────────────────────── */
async function analyze() {
  const statement = inputEl.value.trim();

  if (!statement) {
    inputEl.classList.add("shake");
    errorMsg.textContent = "Please enter a statement first! 🌸";
    errorBanner.removeAttribute("hidden");
    return;
  }

  resultEl.setAttribute("hidden", "");
  errorBanner.setAttribute("hidden", "");
  startLoading();
  analyzeBtn.disabled = true;

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statement })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    stopLoading();
    renderResult(data);

  } catch (err) {
    stopLoading();
    errorMsg.textContent = err.message || "Something went wrong 🌺 Please try again!";
    errorBanner.removeAttribute("hidden");
    console.error("[TruthLens]", err);
  }

  analyzeBtn.disabled = false;
}

/* ── Render Result ──────────────────────────────────────────── */
function renderResult(data) {
  const prob    = clamp(Math.round(data.truthProbability ?? 50), 0, 100);
  const verdict = (data.verdict || deriveVerdict(prob)).toUpperCase();
  const cls     = verdict.toLowerCase();

  // Verdict
  document.getElementById("verdictIcon").textContent = VERDICT_ICONS[verdict] ?? "🌸";
  const badge = document.getElementById("verdictBadge");
  badge.textContent = verdict;
  badge.className   = `verdict-badge ${cls}`;

  // Ring arc
  const arc   = document.getElementById("pctArc");
  arc.className = `pct-arc ${cls}`;
  const circ  = 2 * Math.PI * 75;
  setTimeout(() => {
    arc.style.strokeDashoffset = circ - (prob / 100) * circ;
  }, 80);

  // Percentage counter
  const pctEl = document.getElementById("pctNumber");
  pctEl.className = `pct-number ${cls}`;
  animateCount(pctEl, 0, prob, 1300, v => v + "%");

  // Meter bar
  const fill = document.getElementById("meterFill");
  fill.className = `meter-fill ${cls}`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.width = prob + "%";
  }));

  // Signal boxes
  const sigContainer = document.getElementById("signals");
  sigContainer.innerHTML = "";

  SIGNAL_CONFIG.forEach(({ key, label, emoji, color, grad, box, name }, idx) => {
    const val = clamp(Math.round((data.signals ?? {})[key] ?? 50), 0, 100);
    const div = document.createElement("div");
    div.className = box;
    div.innerHTML = `
      <div class="signal-name ${name}">${emoji} ${label}</div>
      <div class="signal-track">
        <div class="signal-fill" id="sf-${idx}" style="background:${grad}"></div>
      </div>
      <div class="signal-value" id="sv-${idx}" style="color:${color}">0%</div>
    `;
    sigContainer.appendChild(div);

    setTimeout(() => {
      document.getElementById(`sf-${idx}`).style.width = val + "%";
      animateCount(document.getElementById(`sv-${idx}`), 0, val, 1400, v => v + "%");
    }, 130 + idx * 75);
  });

  // Key facts
  const factsWrap = document.getElementById("factsWrap");
  const factsList = document.getElementById("factsList");
  factsList.innerHTML = "";
  const facts = data.keyFacts ?? [];
  if (facts.length) {
    facts.forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      factsList.appendChild(li);
    });
    factsWrap.removeAttribute("hidden");
  } else {
    factsWrap.setAttribute("hidden", "");
  }

  // Explanation
  document.getElementById("breakdownText").textContent =
    data.explanation || "Analysis complete.";

  resultEl.removeAttribute("hidden");
}

/* ── Helpers ────────────────────────────────────────────────── */
function deriveVerdict(p) {
  return p >= 65 ? "TRUE" : p >= 35 ? "UNCERTAIN" : "FALSE";
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function animateCount(el, from, to, duration, format) {
  const startTime = performance.now();
  (function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(step);
  })(performance.now());
}