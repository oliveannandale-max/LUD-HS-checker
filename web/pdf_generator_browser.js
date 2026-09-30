/**
 * LUD Logistics - Pure Client-Side PDF Report Generator
 * Uses jsPDF and jspdf-autotable via CDN to generate official SARS Audit Memoranda on GitHub Pages.
 */

class ClientPDFGenerator {
  generateReport(auditData) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("jsPDF library is loading... Please retry in a moment, or use browser print.");
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const docRef = auditData.document_reference || "INV-2026-SA-0482";
    const dateStr = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

    // Top Header
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 595.28, 60, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LUD LOGISTICS (PTY) LTD", 40, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text("SARS Accredited Customs Compliance & Tariff Advisory", 40, 44);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`AUDIT REF: ${docRef}`, 420, 28);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${dateStr}`, 420, 42);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AI WCO & SARS Customs Tariff Audit Report", 40, 90);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Legal cross-examination of declared HS codes against WCO GRI 1-6 & SARS Schedule 1 Part 1", 40, 104);

    // Executive Metrics Summary Box
    const summary = auditData.risk_summary || {};
    let totalExposure = 0;
    let totalPenalty = 0;
    (auditData.line_items || []).forEach(item => {
      const exp = item.exposure || {};
      totalExposure += (exp.duty_shortfall_zar || 0);
      totalPenalty += (exp.potential_penalty_zar || 0);
    });

    const summaryData = [
      ["Items Audited", "Compliant", "Warnings", "Critical", "Duty Shortfall", "Sec 84 Exposure"],
      [
        String(auditData.total_items_audited || (auditData.line_items || []).length),
        String(summary.compliant_count || 0),
        String(summary.warning_count || 0),
        String(summary.critical_count || 0),
        `R ${totalExposure.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
        `R ${totalPenalty.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`
      ]
    ];

    doc.autoTable({
      startY: 118,
      margin: { left: 40, right: 40 },
      head: [summaryData[0]],
      body: [summaryData[1]],
      theme: "grid",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        fontSize: 10,
        fontStyle: "bold",
        textColor: [15, 23, 42],
        halign: "center"
      }
    });

    // Detailed Line Items Table
    const tableRows = (auditData.line_items || []).map((item, index) => {
      const status = item.final_status || item.audit_status || "WARNING";
      const rec = item.recommended_code || item.recommended_sars8 || "";
      const cd = item.recommended_check_digit || item.check_digit || "";
      const fullRec = cd ? `${rec} / ${cd}` : rec;
      return [
        String(index + 1),
        item.commercial_description || "",
        `${item.declared_code || "N/A"}\n(${item.declared_duty_rate || "Unknown"})`,
        `${fullRec}\n(${item.recommended_duty_rate || "Free"})`,
        status,
        item.verdict || item.audit_notes || ""
      ];
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      margin: { left: 40, right: 40 },
      head: [["#", "Commercial Description", "Declared Code", "Audited SARS Code", "Status", "Legal Audit Verdict"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold"
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 140 },
        2: { cellWidth: 75 },
        3: { cellWidth: 85 },
        4: { cellWidth: 65, fontStyle: "bold" },
        5: { cellWidth: 130 }
      },
      didParseCell: function(data) {
        if (data.column.index === 4) {
          if (data.cell.raw === "COMPLIANT") {
            data.cell.styles.textColor = [22, 163, 74];
          } else if (data.cell.raw === "WARNING") {
            data.cell.styles.textColor = [217, 119, 6];
          } else if (data.cell.raw === "CRITICAL_MISMATCH") {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    });

    // Sign-off Block
    let finalY = doc.lastAutoTable.finalY + 24;
    if (finalY > 740) {
      doc.addPage();
      finalY = 40;
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(40, finalY, 555, finalY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Lead Customs Auditor: LUD Automated Tariff Engine (Google Gemini 2.5 Flash Free Tier)", 40, finalY + 16);
    doc.text("Accredited Customs Practitioner Sign-Off: __________________________________", 310, finalY + 16);

    doc.save(`LUD_Customs_Audit_${docRef}.pdf`);
  }
}

window.ClientPDFGenerator = new ClientPDFGenerator();
