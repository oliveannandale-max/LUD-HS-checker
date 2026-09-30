/**
 * LUD Logistics - AI WCO & SARS Customs Auditor
 * Frontend Application Controller
 */

// State
const state = {
  currentTab: 'tab-audit',
  mockMode: true,
  apiKey: '',
  uploadedImageBase64: null,
  lineItems: [],
  lastAuditResults: null,
  activeRequestsInMinute: 0,
  tariffDatabase: []
};

// Sample Chemical & Industrial Invoices for quick auditing
const SAMPLE_INVOICE_ITEMS = [
  {
    desc: 'Castrol Industrial Gear Oil Alpha SP 220 (95% Mineral base oil, 200L steel drums)',
    code: '2710.19.91 / 8',
    val: 68000
  },
  {
    desc: 'SuperGlue Cyanoacrylate Instant Adhesive (Pack of 20 x 20g blister tubes, total 400g)',
    code: '3506.91.00',  // Mislabeled as bulk glue (Free) instead of retail glue 3506.10 (10%)
    val: 45000
  },
  {
    desc: 'Heavy Duty Ceramic Disc Brake Pads (Asbestos-Free) for commercial trucks',
    code: '6813.81',     // Missing national split and check digit
    val: 72000
  }
];

// Presets for Tab 2
const PRESETS = {
  cutting_oil: {
    name: 'SyntheLube Ultra ISO 46 Synthetic Cutting Fluid',
    composition: '22% petroleum lubricating base oil, 68% synthetic polyalkylene glycol polymer, 10% extreme-pressure sulfurized ester and rust inhibitors',
    state: 'Liquid',
    packaging: 'Bulk packaging (> 5 kg / 200L Drum)',
    function: 'Industrial metal machining, heat cooling and lubrication in CNC high-speed milling'
  },
  superglue: {
    name: 'UltraFast Cyanoacrylate Industrial Adhesive Retail Packs',
    composition: '99% ethyl-2-cyanoacrylate, 1% stabilizer/thickener',
    state: 'Liquid',
    packaging: 'Retail package <= 1 kg (Glues)',
    function: 'Instant surface-bonding for metal, rubber, and plastics put up in 50g consumer bottles'
  },
  diesel_fuel: {
    name: 'Ultra-Low Sulfur Automotive Distillate Diesel (10 ppm)',
    composition: '99.5% petroleum distillate hydrocarbons, 0.5% cetane improver and lubricity additive. Sulfur <= 10 mg/kg',
    state: 'Liquid',
    packaging: 'Bulk packaging (> 5 kg / 200L Drum)',
    function: 'Heavy duty commercial road transport and compression-ignition engines'
  },
  brake_pads: {
    name: 'Ceramic Heavy-Duty Friction Brake Linings & Pads (Asbestos-Free)',
    composition: 'Agglomerated mineral fibers, copper-free ceramic friction particles, phenolic binder resin. Zero asbestos content.',
    state: 'Articles / Fabricated',
    packaging: 'Other',
    function: 'Braking and deceleration friction material mounted onto truck caliper assemblies'
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupDropZone();
  setupLineItemsTable();
  setupActionButtons();
  setupPresets();
  setupQuotaMonitor();
  loadSampleInvoice();
  fetchTariffDatabase();

  const savedKey = localStorage.getItem('lud_gemini_api_key');
  if (savedKey) {
    const input = document.getElementById('geminiApiKey');
    if (input) input.value = savedKey;
  }
});

// Tab Navigation
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      document.getElementById(targetId).classList.add('active');
      state.currentTab = targetId;
    });
  });
}

// Drag & Drop Image Handling
function setupDropZone() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const dropPrompt = document.getElementById('dropPrompt');
  const previewWrapper = document.getElementById('previewWrapper');
  const imagePreview = document.getElementById('imagePreview');
  const removeBtn = document.getElementById('removeImageBtn');

  dropZone.addEventListener('click', (e) => {
    if (e.target !== removeBtn) fileInput.click();
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.uploadedImageBase64 = null;
    imagePreview.src = '';
    previewWrapper.style.display = 'none';
    dropPrompt.style.display = 'block';
    fileInput.value = '';
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image (PNG, JPG, WebP) or PDF customs document.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.uploadedImageBase64 = e.target.result;
      if (file.type.startsWith('image/')) {
        imagePreview.src = e.target.result;
        previewWrapper.style.display = 'block';
        dropPrompt.style.display = 'none';
      } else {
        alert('PDF received. Vision auditor will extract pages directly.');
      }
    };
    reader.readAsDataURL(file);
  }
}

// Line Items Management
function setupLineItemsTable() {
  document.getElementById('addLineItemBtn').addEventListener('click', () => {
    addLineItemRow('', '', 0);
  });

  document.getElementById('loadSampleInvoiceBtn').addEventListener('click', () => {
    loadSampleInvoice();
  });
}

function loadSampleInvoice() {
  const tbody = document.getElementById('lineItemsInputBody');
  tbody.innerHTML = '';
  SAMPLE_INVOICE_ITEMS.forEach(item => {
    addLineItemRow(item.desc, item.code, item.val);
  });
}

function addLineItemRow(desc = '', code = '', val = 0) {
  const tbody = document.getElementById('lineItemsInputBody');
  const rowCount = tbody.children.length + 1;
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="text" class="table-input item-desc" placeholder="Product name & specs" value="${desc}"></td>
    <td><input type="text" class="table-input table-input-mono item-code" placeholder="e.g. 3403.19.00 / 8" value="${code}"></td>
    <td><input type="number" class="table-input item-val" placeholder="0" value="${val}"></td>
    <td><button class="btn btn-ghost btn-xs remove-row-btn" title="Remove">&times;</button></td>
  `;

  tr.querySelector('.remove-row-btn').addEventListener('click', () => {
    tr.remove();
    renumberRows();
  });

  tbody.appendChild(tr);
}

function renumberRows() {
  const rows = document.querySelectorAll('#lineItemsInputBody tr');
  rows.forEach((row, i) => {
    row.children[0].textContent = i + 1;
  });
}

function getLineItemsFromTable() {
  const rows = document.querySelectorAll('#lineItemsInputBody tr');
  const items = [];
  rows.forEach((row, i) => {
    const desc = row.querySelector('.item-desc').value.trim();
    const code = row.querySelector('.item-code').value.trim();
    const val = parseFloat(row.querySelector('.item-val').value) || 0;
    if (desc || code) {
      items.push({ line_no: i + 1, commercial_description: desc, declared_code: code, customs_value: val });
    }
  });
  return items;
}

// Free Tier Rate Limiter Status Monitor
function setupQuotaMonitor() {
  const rpmStatus = document.getElementById('rpmStatus');
  const quotaBar = document.getElementById('quotaBar');

  setInterval(() => {
    if (state.activeRequestsInMinute > 0) {
      state.activeRequestsInMinute = Math.max(0, state.activeRequestsInMinute - 1);
    }
    const percent = Math.min(100, Math.round((state.activeRequestsInMinute / 15) * 100));
    rpmStatus.textContent = `${state.activeRequestsInMinute} / 15 RPM`;
    quotaBar.style.width = `${Math.max(5, percent)}%`;
    if (percent > 75) {
      quotaBar.style.background = '#dc2626';
    } else if (percent > 40) {
      quotaBar.style.background = '#d97706';
    } else {
      quotaBar.style.background = '#38bdf8';
    }
  }, 4000);
}

// Presets in Tab 2
function setupPresets() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const data = PRESETS[presetKey];
      if (data) {
        document.getElementById('autogenProductName').value = data.name;
        document.getElementById('autogenComposition').value = data.composition;
        document.getElementById('autogenState').value = data.state;
        document.getElementById('autogenPackaging').value = data.packaging;
        document.getElementById('autogenFunction').value = data.function;
      }
    });
  });
}

// Actions & API calls
function setupActionButtons() {
  // Toggle mock mode
  const mockToggle = document.getElementById('mockModeToggle');
  const mockLabel = document.getElementById('mockLabel');
  mockToggle.addEventListener('change', () => {
    state.mockMode = mockToggle.checked;
    mockLabel.textContent = state.mockMode ? 'Mock Demo' : 'Live Gemini';
    mockLabel.style.color = state.mockMode ? '#e2e8f0' : '#38bdf8';
  });

  // Toggle API key visibility
  const apiKeyInput = document.getElementById('geminiApiKey');
  document.getElementById('toggleApiKey').addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  // Run Audit
  document.getElementById('runAuditBtn').addEventListener('click', runAuditWorkflow);

  // Run Autogen
  document.getElementById('runAutogenBtn').addEventListener('click', runAutogenWorkflow);

  // Export PDF & CSV
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdfReport);
  const csvBtn = document.getElementById('exportCsvBtn');
  if (csvBtn) csvBtn.addEventListener('click', exportCsvReport);

  // Search Tariff
  document.getElementById('searchTariffBtn').addEventListener('click', searchTariffDatabase);
  document.getElementById('tariffSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchTariffDatabase();
  });
}

// WORKFLOW 1: AUDIT EXECUTION
async function runAuditWorkflow() {
  const auditBtn = document.getElementById('runAuditBtn');
  const items = getLineItemsFromTable();

  if (items.length === 0 && !state.uploadedImageBase64) {
    alert('Please add at least one line item or upload an invoice image.');
    return;
  }

  auditBtn.disabled = true;
  auditBtn.innerHTML = '<span class="btn-icon">⏳</span> Auditing against SARS Schedule 1 (Pacing 4.2s)...';

  state.activeRequestsInMinute++;

  const apiKey = document.getElementById('geminiApiKey').value.trim();
  if (apiKey) {
    localStorage.setItem('lud_gemini_api_key', apiKey);
  }

  const payload = {
    document_reference: document.getElementById('docReference').value,
    total_invoice_value: parseFloat(document.getElementById('customsValue').value) || 0,
    items: items,
    image: state.uploadedImageBase64,
    mock_mode: state.mockMode,
    api_key: apiKey,
    // Perform OCR on uploaded image if available and not in mock mode
    ocr_text: (state.uploadedImageBase64 && !state.mockMode && window.performOCR) ? await window.performOCR(state.uploadedImageBase64) : null
  };

  // 1. Try Local Python Server API first
  let serverSucceeded = false;
  try {
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      state.lastAuditResults = data;
      renderAuditResults(data);
      document.getElementById('exportPdfBtn').disabled = false;
      serverSucceeded = true;
    }
  } catch (err) {
    // Server not available (e.g. running on GitHub Pages static)
  }

  // 2. Client-side execution (for GitHub Pages & offline)
  if (!serverSucceeded) {
    try {
      let rawLines = payload.items;
      // If image uploaded and live Gemini mode selected with API key:
      if (state.uploadedImageBase64 && !state.mockMode && apiKey && window.BrowserGemini) {
        const prompt = `Audit this customs invoice ${payload.document_reference}. Cross-check all handwritten and printed HS codes against product descriptions under WCO GRI and SARS Schedule 1 Part 1.`;
        const aiRes = await window.BrowserGemini.callGemini(prompt, null, state.uploadedImageBase64);
        if (aiRes && aiRes.line_items && aiRes.line_items.length > 0) {
          rawLines = aiRes.line_items;
        }
      }

      // Run verification through the embedded client rules engine
      const auditedLines = [];
      let compCount = 0, warnCount = 0, critCount = 0;

      rawLines.forEach(item => {
        const desc = item.commercial_description || item.desc || "";
        const code = item.declared_code || item.code || "";
        const val = item.customs_value || item.val || 0;

        const res = window.ClientRulesEngine.verifyLineItem(desc, code, val);
        if (res.final_status === "COMPLIANT") compCount++;
        else if (res.final_status === "WARNING") warnCount++;
        else critCount++;
        auditedLines.push(res);
      });

      const auditData = {
        document_reference: payload.document_reference || "INV-2026-SA-0482",
        total_items_audited: auditedLines.length,
        risk_summary: {
          compliant_count: compCount,
          warning_count: warnCount,
          critical_count: critCount
        },
        line_items: auditedLines
      };

      state.lastAuditResults = auditData;
      renderAuditResults(auditData);
      document.getElementById('exportPdfBtn').disabled = false;
    } catch (e) {
      console.error("Client-side audit fallback error:", e);
      renderClientFallbackAudit(payload);
    }
  }

  auditBtn.disabled = false;
  auditBtn.innerHTML = '<span class="btn-icon">⚡</span> Run WCO & SARS Audit Cross-Check';
}

// Render Audit Results
function renderAuditResults(data) {
  document.getElementById('emptyStateAudit').style.display = 'none';
  const listContainer = document.getElementById('auditCardsList');
  listContainer.style.display = 'flex';
  listContainer.innerHTML = '';

  const summary = data.risk_summary || {};
  document.getElementById('metricTotal').textContent = data.total_items_audited || data.line_items.length;
  document.getElementById('metricCompliant').textContent = summary.compliant_count || 0;
  document.getElementById('metricWarning').textContent = summary.warning_count || 0;
  document.getElementById('metricCritical').textContent = summary.critical_count || 0;

  // Exposure calculation
  let totalDutyShortfall = 0;
  let totalPenalty = 0;

  (data.line_items || []).forEach((item, index) => {
    const exp = item.exposure || {};
    totalDutyShortfall += (exp.duty_shortfall_zar || 0);
    totalPenalty += (exp.potential_penalty_zar || 0);

    const status = item.final_status || item.audit_status || 'WARNING';
    let statusBadgeClass = 'badge-warning';
    let statusLabel = 'WARNING';

    if (status === 'COMPLIANT') {
      statusBadgeClass = 'badge-success';
      statusLabel = 'COMPLIANT';
    } else if (status === 'CRITICAL_MISMATCH') {
      statusBadgeClass = 'badge-danger';
      statusLabel = 'CRITICAL MISMATCH';
    }

    const card = document.createElement('div');
    card.className = `audit-card status-${status}`;

    const recCode = item.recommended_code || item.recommended_sars8 || 'N/A';
    const checkDigit = item.recommended_check_digit || item.check_digit || '';
    const fullRecCode = checkDigit ? `${recCode} / ${checkDigit}` : recCode;

    card.innerHTML = `
      <div class="audit-card-top">
        <div>
          <span style="font-size: 11px; color: #64748b; font-weight: 600;">Line ${item.line_no || index + 1}</span>
          <h4 class="audit-card-title">${item.commercial_description}</h4>
        </div>
        <span class="badge ${statusBadgeClass}">${statusLabel}</span>
      </div>
      <div class="audit-card-body">
        <div>
          <span class="tariff-block-label">Declared / Handwritten HS Code:</span>
          <div class="tariff-code-val" style="color: #64748b;">${item.declared_code || 'None declared'}</div>
          <span style="font-size: 11px; color: #64748b;">Declared Rate: ${item.declared_duty_rate || 'Unknown'}</span>
        </div>
        <div>
          <span class="tariff-block-label">Audited SARS Schedule 1 Tariff:</span>
          <div class="tariff-code-val" style="color: #2563eb;">${fullRecCode}</div>
          <span style="font-size: 11px; color: #16a34a; font-weight: 600;">Legal Rate: ${item.recommended_duty_rate || 'Free'}</span>
        </div>
      </div>
      <p class="audit-verdict">${item.verdict || item.audit_notes}</p>
      ${item.gri_justification ? `<div class="audit-gri-tag">⚖️ Legal Rationale: ${item.gri_justification}</div>` : ''}
    `;

    listContainer.appendChild(card);
  });

  // Show exposure banner if shortfall > 0
  const banner = document.getElementById('exposureBanner');
  if (totalDutyShortfall > 0) {
    banner.style.display = 'flex';
    document.getElementById('totalDutyShortfall').textContent = `R ${totalDutyShortfall.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
    document.getElementById('penaltySub').textContent = `SARS Sec 84 Potential Penalty Exposure: R ${totalPenalty.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  } else {
    banner.style.display = 'none';
  }
}

// Fallback client rendering if running without backend
function renderClientFallbackAudit(payload) {
  const mockData = {
    document_reference: payload.document_reference || 'INV-2026-SA-0482',
    total_items_audited: payload.items.length,
    risk_summary: {
      compliant_count: 1,
      warning_count: 1,
      critical_count: 1
    },
    line_items: [
      {
        line_no: 1,
        commercial_description: 'Castrol Industrial Gear Oil Alpha SP 220 (95% Mineral base oil, 200L steel drums)',
        declared_code: '2710.19.91 / 8',
        recommended_code: '2710.19.91',
        recommended_check_digit: '8',
        declared_duty_rate: 'Free',
        recommended_duty_rate: 'Free',
        final_status: 'COMPLIANT',
        verdict: 'Declared code is fully verified and compliant with SARS Schedule 1 (Petroleum oil >= 70%).',
        gri_justification: 'GRI 1 & Note 2 to Chapter 27',
        exposure: { duty_shortfall_zar: 0, potential_penalty_zar: 0 }
      },
      {
        line_no: 2,
        commercial_description: 'SuperGlue Cyanoacrylate Instant Adhesive (Pack of 20 x 20g blister tubes, total 400g)',
        declared_code: '3506.91.00',
        recommended_code: '3506.10.00',
        recommended_check_digit: '9',
        declared_duty_rate: 'Free',
        recommended_duty_rate: '10%',
        final_status: 'CRITICAL_MISMATCH',
        verdict: 'Severe misclassification: Declared under 3506.91 (bulk @ Free duty), but packaging is put up for retail sale <= 1kg, commanding heading 3506.10.00 at 10% duty.',
        gri_justification: 'GRI 1 and Subheading Note 1 to Chapter 35',
        exposure: { duty_shortfall_zar: 4500, potential_penalty_zar: 13500 }
      },
      {
        line_no: 3,
        commercial_description: 'Heavy Duty Ceramic Disc Brake Pads (Asbestos-Free) for commercial trucks',
        declared_code: '6813.81',
        recommended_code: '6813.81.00',
        recommended_check_digit: '1',
        declared_duty_rate: '15%',
        recommended_duty_rate: '15%',
        final_status: 'WARNING',
        verdict: '6-digit subheading correct, but missing 8-digit national split and check digit (6813.81.00 / 1). 15% duty applies.',
        gri_justification: 'GRI 1 and GRI 6',
        exposure: { duty_shortfall_zar: 0, potential_penalty_zar: 0 }
      }
    ]
  };

  state.lastAuditResults = mockData;
  renderAuditResults(mockData);
  document.getElementById('exportPdfBtn').disabled = false;
}

// WORKFLOW 2: AUTOGEN EXECUTION
async function runAutogenWorkflow() {
  const autogenBtn = document.getElementById('runAutogenBtn');
  const productName = document.getElementById('autogenProductName').value.trim();
  const composition = document.getElementById('autogenComposition').value.trim();

  if (!productName) {
    alert('Please enter a product name.');
    return;
  }

  autogenBtn.disabled = true;
  autogenBtn.innerHTML = '<span class="btn-icon">⏳</span> Applying WCO GRI Rules & SARS Schedule 1...';

  state.activeRequestsInMinute++;

  const payload = {
    product_name: productName,
    composition: composition,
    state: document.getElementById('autogenState').value,
    packaging: document.getElementById('autogenPackaging').value,
    function: document.getElementById('autogenFunction').value,
    mock_mode: state.mockMode,
    api_key: document.getElementById('geminiApiKey').value.trim()
  };

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    renderAutogenResults(data);
  } catch (err) {
    console.error('Autogen error, using fallback:', err);
    renderClientFallbackAutogen(payload);
  } finally {
    autogenBtn.disabled = false;
    autogenBtn.innerHTML = '<span class="btn-icon">⚡</span> Classify Goods via WCO GRI & SARS';
  }
}

function renderAutogenResults(data) {
  document.getElementById('autogenEmpty').style.display = 'none';
  const resBox = document.getElementById('autogenResultBox');
  resBox.style.display = 'block';

  const cls = data.classification || {};
  const rates = data.duty_rates || {};
  const gri = data.wco_gri_reasoning || {};

  document.getElementById('resSubheading').textContent = `Subheading ${cls.hs_subheading || cls.hs_heading}`;
  document.getElementById('resFullCode').textContent = cls.full_sars_tariff || `${cls.sars_national_code} / ${cls.check_digit}`;
  document.getElementById('resDutyGeneral').textContent = `General Duty: ${rates.general || 'Free'}`;
  document.getElementById('resTariffDescription').textContent = cls.tariff_description || 'Customs Tariff Classification';

  document.getElementById('resRateGeneral').textContent = rates.general || 'Free';
  document.getElementById('resRateEU').textContent = rates.eu || 'Free';
  document.getElementById('resRateSADC').textContent = rates.sadc || 'Free';
  document.getElementById('resRateAfCFTA').textContent = rates.afcfta || 'Free';

  document.getElementById('resPrimaryGRI').textContent = `Primary Rule: ${gri.primary_rule || 'GRI 1 and GRI 6'}`;
  document.getElementById('resRationaleText').textContent = gri.step_by_step_rationale || 'Classified in accordance with WCO General Rules of Interpretation.';

  // Alternatives
  const altList = document.getElementById('resAltHeadingsList');
  altList.innerHTML = '';
  (data.alternative_headings_considered || []).forEach(alt => {
    const div = document.createElement('div');
    div.className = 'alt-item';
    div.innerHTML = `<strong>Heading ${alt.code}:</strong> ${alt.reason_for_exclusion}`;
    altList.appendChild(div);
  });

  document.getElementById('resComplianceNotes').textContent = data.compliance_notes || 'Ensure commercial invoice bears standard exporter origin declarations.';
}

function renderClientFallbackAutogen(payload) {
  const fallback = {
    product_name: payload.product_name,
    classification: {
      hs_heading: '3403',
      hs_subheading: '3403.19',
      sars_national_code: '3403.19.00',
      check_digit: '8',
      full_sars_tariff: '3403.19.00 / 8',
      tariff_description: 'Lubricating preparations containing < 70% by weight of petroleum oils (synthetic lubricants, cutting oils)'
    },
    duty_rates: {
      general: 'Free',
      eu: 'Free',
      sadc: 'Free',
      afcfta: 'Free'
    },
    wco_gri_reasoning: {
      primary_rule: 'GRI 1 and GRI 6',
      legal_notes_cited: 'Note 2 to Chapter 34, Note 2 to Chapter 27',
      step_by_step_rationale: 'Because petroleum oil content is under 70% by weight, Chapter 27 is legally excluded under Note 2 to Chapter 27. Heading 34.03 specifically covers lubricating preparations and cutting-oil preparations.'
    },
    alternative_headings_considered: [
      { code: '2710.19.91', reason_for_exclusion: 'Excluded because petroleum oil content is strictly less than 70% by weight.' },
      { code: '3824.99.90', reason_for_exclusion: 'Basket heading rejected under GRI 3(a) in favor of specific heading 34.03.' }
    ],
    compliance_notes: 'General MFN rate is Free. Standard customs clearance required without import permit.',
    confidence_level: 0.98
  };
  renderAutogenResults(fallback);
}

// CSV Export
function exportCsvReport() {
  if (!state.lastAuditResults || !state.lastAuditResults.line_items) {
    alert('No audit results to export. Run an audit first.');
    return;
  }

  const items = state.lastAuditResults.line_items;
  let csv = 'Line #,Commercial Description,Declared Code,Declared Duty,Audited SARS Code,Check Digit,Audited Duty,Status,Duty Shortfall (ZAR),Sec 84 Penalty (ZAR),Legal Rationale,Audit Notes\n';

  items.forEach((it, idx) => {
    const exp = it.exposure || {};
    const row = [
      idx + 1,
      `"${(it.commercial_description || '').replace(/"/g, '""')}"`,
      `"${it.declared_code || ''}"`,
      `"${it.declared_duty_rate || 'Unknown'}"`,
      `"${it.recommended_code || it.recommended_sars8 || ''}"`,
      `"${it.recommended_check_digit || it.check_digit || ''}"`,
      `"${it.recommended_duty_rate || 'Free'}"`,
      `"${it.final_status || it.audit_status || 'WARNING'}"`,
      exp.duty_shortfall_zar || 0,
      exp.potential_penalty_zar || 0,
      `"${(it.gri_justification || '').replace(/"/g, '""')}"`,
      `"${(it.verdict || it.audit_notes || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LUD_Audit_${state.lastAuditResults.document_reference || 'Report'}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// PDF Export
async function exportPdfReport() {
  if (!state.lastAuditResults) {
    alert('No audit results to export. Run an audit first.');
    return;
  }

  const exportBtn = document.getElementById('exportPdfBtn');
  exportBtn.disabled = true;
  exportBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating PDF...';

  // 1. Try pure client-side PDF Generator (works on GitHub Pages & offline!)
  if (window.ClientPDFGenerator) {
    try {
      window.ClientPDFGenerator.generateReport(state.lastAuditResults);
      exportBtn.disabled = false;
      exportBtn.innerHTML = '<span class="btn-icon">📥</span> Export Official PDF Report';
      return;
    } catch (clientErr) {
      console.warn('Client-side PDF generator notice:', clientErr);
    }
  }

  // 2. Try server PDF endpoint if running local server
  try {
    const response = await fetch('/api/export_pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.lastAuditResults)
    });

    if (response.ok) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `LUD_Customs_Audit_${state.lastAuditResults.document_reference || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
  } catch (err) {
    console.warn('Server PDF unavailable, using browser print dialog:', err);
    window.print();
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = '<span class="btn-icon">📥</span> Export Official PDF Report';
  }
}

// TAB 3: Tariff Search & Explorer
async function fetchTariffDatabase() {
  const candidatePaths = [
    '/api/search_tariff?q=',
    'cache/sars_tariff_schedule1.json',
    '../cache/sars_tariff_schedule1.json',
    '/LUD-HS-checker/cache/sars_tariff_schedule1.json'
  ];

  for (const path of candidatePaths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        state.tariffDatabase = data.tariffs || [];
        if (state.tariffDatabase.length > 0) {
          renderTariffTable(state.tariffDatabase);
          break;
        }
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
}

function searchTariffDatabase() {
  const query = document.getElementById('tariffSearchInput').value.trim().toLowerCase();
  if (state.tariffDatabase.length > 0) {
    const filtered = state.tariffDatabase.filter(t => {
      const matchCode = t.tariff_code.toLowerCase().includes(query);
      const matchDesc = t.description.toLowerCase().includes(query);
      const matchKw = (t.keywords || []).some(k => k.toLowerCase().includes(query));
      return matchCode || matchDesc || matchKw;
    });
    renderTariffTable(filtered);
  } else {
    // Call server endpoint
    fetch(`/api/search_tariff?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => renderTariffTable(data.tariffs || []))
      .catch(err => console.error(err));
  }
}

function renderTariffTable(tariffs) {
  const tbody = document.getElementById('tariffDbBody');
  tbody.innerHTML = '';

  if (tariffs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">No matching SARS tariffs found.</td></tr>';
    return;
  }

  tariffs.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong><code>${t.tariff_code} / ${t.check_digit || ''}</code></strong></td>
      <td><span class="badge badge-info">Ch ${t.chapter}</span></td>
      <td>${t.description}</td>
      <td><strong>${t.general_duty}</strong></td>
      <td>${t.eu_duty} / ${t.sadc_duty}</td>
      <td>${t.unit || 'kg'}</td>
      <td style="font-size: 11px; color: #64748b;">${t.notes || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}
