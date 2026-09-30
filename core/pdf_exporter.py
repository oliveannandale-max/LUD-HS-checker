"""
PDF Exporter for LUD Logistics Customs Auditor
Generates professional SARS Customs Audit Reports using ReportLab.
"""

import os
import time
from typing import Dict, Any, List, Optional
from pathlib import Path

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)


class PDFExporter:
    """
    Renders an official customs audit memorandum with risk badges, duty exposure calculations,
    and WCO GRI legal citations.
    """

    def __init__(self, output_dir: Optional[str] = None):
        if output_dir is None:
            base_dir = Path(__file__).resolve().parent.parent
            output_dir = str(base_dir / "audit_reports")
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_audit_report(
        self,
        audit_data: Dict[str, Any],
        filename: Optional[str] = None
    ) -> str:
        """
        Creates a PDF audit document and returns the absolute path to the file.
        """
        doc_ref = audit_data.get("document_reference", "AUDIT-CUSTOMS-2026")
        safe_ref = "".join(c for c in doc_ref if c.isalnum() or c in ("-", "_"))
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        if not filename:
            filename = f"LUD_Audit_Report_{safe_ref}_{timestamp}.pdf"

        file_path = os.path.join(self.output_dir, filename)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=12,
            spaceAfter=6,
        )
        cell_text = ParagraphStyle(
            "CellText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1e293b"),
        )
        cell_bold = ParagraphStyle(
            "CellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a"),
        )

        elements = []

        # Header Banner
        header_table_data = [
            [
                Paragraph("<b>LUD LOGISTICS (PTY) LTD</b><br/><font size=8 color='#475569'>Customs & Border Compliance Division | SARS Accredited</font>", styles["Normal"]),
                Paragraph(f"<b>AUDIT MEMORANDUM</b><br/><font size=8 color='#475569'>Ref: {doc_ref}<br/>Date: {time.strftime('%d %b %Y %H:%M')}</font>", styles["Normal"])
            ]
        ]
        header_table = Table(header_table_data, colWidths=[320, 200])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(header_table)
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=14))

        # Title
        elements.append(Paragraph("AI WCO & SARS Customs Tariff Audit Report", title_style))
        elements.append(Paragraph("Automated cross-examination of handwritten / declared HS codes against WCO GRI and SARS Schedule 1 Part 1", subtitle_style))
        elements.append(Spacer(1, 12))

        # Executive Summary Metrics
        risk_summary = audit_data.get("risk_summary", {})
        comp_count = risk_summary.get("compliant_count", 0)
        warn_count = risk_summary.get("warning_count", 0)
        crit_count = risk_summary.get("critical_count", 0)
        total_items = audit_data.get("total_items_audited", comp_count + warn_count + crit_count)

        # Financial exposure roll-up
        total_exposure = 0.0
        total_penalty = 0.0
        for item in audit_data.get("line_items", []):
            exp = item.get("exposure", {})
            total_exposure += exp.get("duty_shortfall_zar", 0.0)
            total_penalty += exp.get("potential_penalty_zar", 0.0)

        summary_box_data = [
            [
                Paragraph("<b>Items Audited</b>", cell_bold),
                Paragraph("<b>Compliant</b>", cell_bold),
                Paragraph("<b>Warnings</b>", cell_bold),
                Paragraph("<b>Critical Mismatch</b>", cell_bold),
                Paragraph("<b>Duty Shortfall (ZAR)</b>", cell_bold),
                Paragraph("<b>SARS Sec 84 Exposure</b>", cell_bold),
            ],
            [
                Paragraph(f"<font size=11><b>{total_items}</b></font>", cell_text),
                Paragraph(f"<font size=11 color='#16a34a'><b>{comp_count}</b></font>", cell_text),
                Paragraph(f"<font size=11 color='#d97706'><b>{warn_count}</b></font>", cell_text),
                Paragraph(f"<font size=11 color='#dc2626'><b>{crit_count}</b></font>", cell_text),
                Paragraph(f"<font size=11 color='#dc2626'><b>R {total_exposure:,.2f}</b></font>", cell_text),
                Paragraph(f"<font size=11 color='#b91c1c'><b>R {total_penalty:,.2f}</b></font>", cell_text),
            ]
        ]
        summary_table = Table(summary_box_data, colWidths=[70, 75, 75, 95, 105, 100])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 14))

        # Audit Findings Table
        elements.append(Paragraph("Detailed Line Item Audit Findings", section_heading))
        
        table_rows = [
            [
                Paragraph("<b>#</b>", cell_bold),
                Paragraph("<b>Goods Description</b>", cell_bold),
                Paragraph("<b>Declared Code</b>", cell_bold),
                Paragraph("<b>Recommended SARS Code</b>", cell_bold),
                Paragraph("<b>Duty Delta</b>", cell_bold),
                Paragraph("<b>Audit Status</b>", cell_bold),
            ]
        ]

        for idx, item in enumerate(audit_data.get("line_items", []), 1):
            status = item.get("final_status") or item.get("audit_status", "WARNING")
            
            if status == "COMPLIANT":
                status_color = "#16a34a"
                status_label = "COMPLIANT"
            elif status == "WARNING":
                status_color = "#d97706"
                status_label = "WARNING"
            else:
                status_color = "#dc2626"
                status_label = "CRITICAL"

            dec_code = item.get("declared_code", "N/A")
            rec_code = item.get("recommended_code") or item.get("recommended_sars8", "N/A")
            cd = item.get("recommended_check_digit") or item.get("check_digit", "")
            if cd and "/" not in rec_code:
                rec_code_full = f"{rec_code} / {cd}"
            else:
                rec_code_full = rec_code

            dec_duty = item.get("declared_duty_rate", "Free")
            rec_duty = item.get("recommended_duty_rate", "Free")

            desc = item.get("commercial_description", "")
            if len(desc) > 70:
                desc = desc[:67] + "..."

            table_rows.append([
                Paragraph(str(idx), cell_text),
                Paragraph(f"<b>{desc}</b>", cell_text),
                Paragraph(f"<code>{dec_code}</code><br/><font color='#64748b'>{dec_duty}</font>", cell_text),
                Paragraph(f"<b><code>{rec_code_full}</code></b><br/><font color='#2563eb'>{rec_duty}</font>", cell_text),
                Paragraph(f"{dec_duty} &rarr; {rec_duty}", cell_text),
                Paragraph(f"<font color='{status_color}'><b>[{status_label}]</b></font>", cell_text),
            ])

        findings_table = Table(table_rows, colWidths=[20, 190, 80, 100, 65, 65])
        findings_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(findings_table)
        elements.append(Spacer(1, 14))

        # Legal Notes & Observations
        elements.append(Paragraph("Legal Rationale & Compliance Observations", section_heading))
        
        for idx, item in enumerate(audit_data.get("line_items", []), 1):
            notes = item.get("verdict") or item.get("audit_notes", "")
            gri = item.get("gri_justification", "")
            
            note_content = f"<b>Line {idx}:</b> {notes}"
            if gri:
                note_content += f"<br/><i>Legal Citation:</i> <b>{gri}</b>"
            
            elements.append(Paragraph(note_content, cell_text))
            elements.append(Spacer(1, 4))

        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

        # Sign-off Block
        sign_block = [
            [
                Paragraph("<b>Lead Customs Auditor:</b><br/>LUD Automated Tariff Engine (Google Gemini 2.5 Flash)", cell_text),
                Paragraph("<b>Broker Validation Sign-Off:</b><br/>____________________________<br/><font size=7 color='#64748b'>Accredited Customs Practitioner</font>", cell_text)
            ]
        ]
        sign_table = Table(sign_block, colWidths=[260, 260])
        elements.append(KeepTogether(sign_table))

        doc.build(elements)
        return file_path
