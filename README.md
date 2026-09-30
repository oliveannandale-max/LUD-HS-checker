# LUD Logistics: AI WCO & SARS Customs Auditor

**Target Platform:** Google Antigravity Agentic IDE  
**Cost Model:** Free Tier ($0.00) via Google AI Studio Gemini 2.5 Flash / Flash-Lite Vision  
**Target Tariff System:** World Customs Organization (WCO) Harmonized System & South African Revenue Service (SARS) Schedule 1 Part 1  

---

## 🌟 Executive Summary

The **LUD Logistics AI Customs Auditor** is an agentic customs compliance platform built for South African clearing agents, freight forwarders, and logistics auditors. It automates the cross-examination of handwritten or printed Harmonized System (HS) codes declared on commercial shipping invoices, packing lists, and SARS SAD500 declarations against actual physical item specifications.

### Core Capabilities:
1. **Workflow 1: Validate & Audit Documents:**
   - Ingests commercial invoice scans, handwritten bills of entry, and PDF packing lists.
   - Extracts declared HS codes and product descriptions.
   - Cross-references declarations against WCO General Rules of Interpretation (GRI 1–6) and SARS Schedule 1 Part 1 national splits.
   - Highlights discrepancies with color-coded risk badges (`🟢 COMPLIANT`, `🟡 WARNING`, `🔴 CRITICAL MISMATCH`).
   - Calculates duty exposure differential in ZAR and flags potential Section 84 Customs Act penalties.
   - Exports professional PDF Audit Memoranda using ReportLab.

2. **Workflow 2: Autogen HS & SARS Codes:**
   - Accepts raw technical descriptions, chemical formulas, SDS parameters, and packaging specs.
   - Applies GRI 1–6 algorithmic decision trees.
   - Recommends the compliant 6-digit WCO subheading and 8-digit SARS national code + check digit.
   - Displays preferential duty rates across General (MFN), EU EPA, SADC, and AfCFTA.

3. **SARS Tariff Schedule 1 Explorer:**
   - High-speed local database of South African industrial and chemical chapters:
     - **Chapter 27:** Mineral fuels, mineral oils, diesel, lubricants (>= 70% oil threshold)
     - **Chapter 32:** Paints, varnishes, mastic sealants, printing inks
     - **Chapter 34:** Soaps, surface-active agents, synthetic lubricants (< 70% oil)
     - **Chapter 35:** Glues, adhesives, modified starches (<= 1kg retail packaging threshold)
     - **Chapter 38:** Anti-freeze, composite thinners, oil additives, foundry binders
     - **Chapter 68:** Abrasive paper/cloth, grinding wheels, friction materials (brake pads)

---

## 📁 Repository & Workspace Architecture

```text
lud-customs-auditor/
├── .antigravity/
│   ├── rules/
│   │   ├── 01_wco_gri_rules.md       # WCO General Rules of Interpretation guidelines (GRI 1-6)
│   │   ├── 02_sars_schedule1.md       # SARS South African National Split tariff rules
│   │   └── 03_free_tier_limits.md    # Google AI Studio rate-limit constraints (15 RPM / 1500 RPD)
│   └── workflows/
│       ├── validate_and_highlight.md # Workflow 1: Cross-check handwritten HS codes
│       └── autogen_hs_codes.md       # Workflow 2: Generate codes directly from text/specs
├── cache/
│   └── sars_tariff_schedule1.json    # Local JSON database of SARS chapters (27, 32, 34, 35, 38, 68)
├── core/
│   ├── __init__.py
│   ├── gemini_client.py              # Zero-cost Google AI Studio vision & text caller
│   ├── hybrid_tariff_checker.py      # Cross-references AI outputs with local SARS cache
│   └── pdf_exporter.py               # Generates export PDF audit reports
├── web/
│   ├── index.html                    # Lightweight single-page dual-mode UI
│   ├── app.js                        # Frontend UI bindings and batch queue
│   └── styles.css                    # Responsive mobile/desktop stylesheet
├── prompts/
│   ├── validation_prompt.txt         # Vision system prompt for cross-checking
│   └── generation_prompt.txt         # Vision system prompt for auto-generation
├── audit_reports/                    # Generated PDF audit memos
├── server.py                         # Zero-dependency Python standard library HTTP server
├── test_auditor.py                   # Automated end-to-end test suite
└── README.md
```

---

## ⏱️ Zero-Cost Free Tier Rate-Limit Architecture

The system operates strictly within Google AI Studio's free tier quotas:
- **RPM:** 15 requests per minute
- **RPD:** 1,500 requests per day
- **TPM:** 1,000,000 tokens per minute

### Mitigation Features:
- **Client-Side Queue Pacing:** Calls are paced at **4.2 seconds minimum interval** (~14.2 RPM), preventing `429 RESOURCE_EXHAUSTED` errors.
- **Visual Meter:** Real-time quota gauge in the header indicates active RPM status.
- **Image Optimization:** Images are resized down to $\le 1568\text{px}$ to conserve vision tokens.
- **Exponential Backoff:** Automatic retry on HTTP 429 errors.
- **Offline / Mock Mode:** Built-in demo mode allows testing all workflows and PDF generation without an API key.

---

## 🚀 Getting Started

### 1. Launch the Server
The application uses Python's standard library (no `pip install` required for the server):
```powershell
python server.py 8080
```
Open your browser at: **[http://127.0.0.1:8080](http://127.0.0.1:8080)**

### 2. Run Automated Verification Tests
Verify the complete pipeline (tariff cache, exposure formula, ReportLab PDF generation, client mock):
```powershell
python test_auditor.py
```

### 3. Using the Web Interface
1. **Validate an Invoice:**
   - Click **"Load Sample Chemical Invoice"** or drag-and-drop a shipping document.
   - Click **"Run WCO & SARS Audit Cross-Check"**.
   - Review the color-coded audit cards, duty shortfalls, and legal citations.
   - Click **"Export Official PDF Report"** to download the signed audit memorandum.
2. **Auto-Generate a Tariff Code:**
   - Switch to **"Workflow 2: Autogen HS & SARS Codes"**.
   - Select an industrial preset (e.g., *Synthetic Cutting Fluid* or *Cyanoacrylate Retail Glue*).
   - Click **"Classify Goods via WCO GRI & SARS"** to view the full legal classification hierarchy.
3. **Explore the Tariff Schedule:**
   - Switch to **"SARS Schedule 1 Tariff Explorer"** to inspect or search rates and legal notes across Chapters 27, 32, 34, 35, 38, and 68.

---

## ⚖️ Legal Formulas & Rules Applied

### 1. Duty Exposure Calculation:
$$\Delta\text{Duty} = \text{Customs Value (ZAR)} \times (\text{Correct SARS Duty Rate} - \text{Declared Duty Rate})$$

### 2. SARS Section 84 Penalty Exposure:
Under Section 84 of the South African Customs and Excise Act 91 of 1964, false declarations can incur penalties up to **300% (3x)** of the unpaid customs duties:
$$\text{Penalty Exposure} = 3 \times \Delta\text{Duty}$$

### 3. WCO GRI Priority:
- **GRI 1:** Terms of Headings and Section/Chapter Notes.
- **GRI 2:** Incomplete/unfinished goods or mixtures.
- **GRI 3(a):** Most specific description preferred over general.
- **GRI 3(b):** Essential character of composite goods.
- **GRI 3(c):** Heading occurring last in numerical order.
- **GRI 6:** Subheading classification mutatis mutandis.
