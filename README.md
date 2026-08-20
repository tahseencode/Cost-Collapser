# ⚡ ZERO-TOKEN SENTINEL (COST COLLAPSER)
> **Autonomous AI Procurement & Monitoring Infrastructure with 100% Token Cost Collapse**

---

## 🎯 The Problem: The Agentic Polling Tax
Traditional AI web agents consume **2,000 – 4,000 LLM reasoning tokens on every single polling step** (screenshot + vision model + reasoning + action loop). 
- Monitoring a single supplier price every minute costs **~3.6 Million tokens / day ($54.00+ / day per item)**.
- At enterprise scale with 1,000 parts, this amounts to **$54,000 / day in wasted LLM polling spend** on static pages.

## 🚀 The Solution: Zero-Token Sentinel
Zero-Token Sentinel combines the **webcmd Layer 2 deterministic adapter architecture** with an **event-driven Agentic Wake-Up Engine** and a **Human-in-the-Loop Approval Gate**:

1. **Continuous 0-Token Polling (Layer 2)**: High-speed deterministic DOM selectors execute in `<20ms` with **0 LLM reasoning tokens ($0.00)**.
2. **Deterministic Trigger Logic**: Evaluates price thresholds, stock levels, or custom conditional triggers locally without calling an LLM.
3. **Agentic Wake-Up**: When a price target is breached, the Sentinel **awakens the AI reasoning agent** to analyze margins, ROI, lot savings, and vendor reliability.
4. **Human-in-the-Loop Gate**: The AI agent proposes an executive procurement briefing and halts for human authorization before executing any financial action (Purchase Order transmission).

---

## 🏗️ Architecture & Phases

```
┌────────────────────────────────────────────────────────────────────────┐
│               LAYER 2: ZERO-TOKEN DETERMINISTIC LOOP                   │
│                                                                        │
│   Scheduler / Interval (every 5-60s)                                  │
│           │                                                            │
│           ▼                                                            │
│   Deterministic Webcmd CLI Adapter (apex-industrial, etc.)            │
│           │                                                            │
│           ▼                                                            │
│   Target DOM Fetch & Clean JSON Extraction  ───► 0 TOKENS BURNED       │
│           │                                                            │
│           ▼                                                            │
│   Evaluate: Price <= $50.00 Threshold?                                 │
└───────────┬────────────────────────────────────────────────────────────┘
            │
            ├──── [NO: Price Normal] ────► Log 0-Token Check & Sleep
            │
            └──── [YES: Price Drop Detected!]
                        │
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│             PHASE 5: AGENTIC WAKE-UP & HUMAN APPROVAL GATE             │
│                                                                        │
│   Wake-Up Engine Dispatches JSON to LLM Reasoning Agent                │
│           │                                                            │
│           ▼                                                            │
│   AI Generates Strategic Procurement Briefing (Tokens: ~380)           │
│   - Recommendation: STRONG_BUY (69% Discount)                          │
│   - Financial Impact: $2,250 Lot Savings                               │
│           │                                                            │
│           ▼                                                            │
│   Human-in-the-Loop Approval Gate (Web UI Modal / Webhook)             │
│           │                                                            │
│           ▼                                                            │
│   [Human Decision: APPROVE] ───► Transmit ERP Purchase Order (PO-XXXX) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Start Unified Command Center & Mock Target Store
```bash
npm start
```
- **Command Center Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Live Mock Industrial Store:** [http://localhost:3000/products/titan-carbide-drill-5000](http://localhost:3000/products/titan-carbide-drill-5000) (or port 4100)

### 3. Run Automated Tests
```bash
npm test
```

### 4. CLI Execution
```bash
# Run deterministic 0-token check
node src/sentinel/cli.js check --adapter apex-industrial

# Test agentic wake-up & human gate in terminal
node src/sentinel/cli.js wake-test

# Compile adapter into standalone executable script
node src/sentinel/cli.js compile apex-industrial
```

---

## 🎪 Hackathon Live Demo Presentation Guide

1. **Split-Screen Setup**:
   - Left Side: Open **Command Center Dashboard** (`http://localhost:3000`).
   - Right Side: Open the embedded **Target Store Simulator** tab or open `http://localhost:4100`.
2. **Demonstrate 0-Token Cost Collapse**:
   - Point out the real-time **Sentinel Polling Burn (0 TOKENS)** counter vs **Traditional Agent Burn**.
   - Show the live rolling terminal streaming checks every few seconds with 0 tokens.
3. **Trigger Live Flash Price Drop**:
   - Click the big red button: `🚨 Simulate Flash Drop ($39.99)` or drag the price slider below $50.00.
4. **Demonstrate Agentic Wake-Up & AI Briefing**:
   - Hear the alarm chime and watch the **Agentic Wake-Up Alert** trigger instantly.
   - Walk through the AI reasoning briefing: `STRONG_BUY`, 69% discount, $2,250 lot savings.
5. **Demonstrate Human-in-the-Loop Approval Gate**:
   - Click `✓ Authorize Purchase Order`.
   - Watch the autonomous ERP Purchase Order (`PO-XXXXXX`) get dispatched and audited.
6. **Demonstrate Adapter Compiler Studio**:
   - Switch to the Adapter Compiler tab and show how Layer 0 exploration compiles into deterministic Layer 2 CLI tools.

---

## 📊 Benchmark Financial Impact

| Metric | Traditional Agent Polling | Zero-Token Sentinel | Savings |
| :--- | :--- | :--- | :--- |
| **Tokens / Check** | 2,450 tokens | **0 tokens** | **100%** |
| **Cost / Check** | $0.03675 | **$0.00000** | **100%** |
| **Daily Cost (1 check/10s)** | $317.52 / day | **$0.0285 / day** | **$317.49 / day** |
| **Monthly Run-Rate (1 Part)** | $9,525.60 / mo | **$0.85 / mo** | **$9,524.75 / mo** |
| **Enterprise (500 Parts)** | $4.76 Million / yr | **$425 / yr** | **$4,759,575 / yr** |

---

## 🔒 Security & Human Safety
- **No Autonomous Spending Without Authorization**: Financial actions are strictly halted until a human operator provides explicit approval via the interactive gate or verified webhook.
- **Full Audit Trail**: Every check, price alert, AI recommendation, human approval, and PO transmission is recorded with timestamped cryptographic IDs.
