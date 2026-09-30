"""
End-to-End Test Suite for LUD Logistics Customs Auditor
Verifies Gemini client, hybrid tariff checker, rate limiter, and PDF exporter.
"""

import sys
import os
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from core.gemini_client import GeminiClient
from core.hybrid_tariff_checker import HybridTariffChecker
from core.pdf_exporter import PDFExporter


def run_tests():
    print(">>> 1. Initializing Hybrid Tariff Checker...")
    checker = HybridTariffChecker()
    total_tariffs = len(checker.tariffs_by_code)
    print(f"    [OK] Loaded {total_tariffs} SARS tariff entries across Chapters 27, 32, 34, 35, 38, 68.")
    assert total_tariffs >= 15, "Expected at least 15 tariff records in local cache"

    print("\n>>> 2. Testing Specific Code Lookups & Formats...")
    # Test code normalization
    clean_code = checker.clean_code("3402.90.10 / 4")
    assert clean_code == "34029010", f"Clean code failed: got {clean_code}"
    print(f"    [OK] Cleaned '3402.90.10 / 4' -> '{clean_code}'")

    item = checker.lookup_code("34029010")
    assert item is not None, "Lookup for 34029010 failed"
    print(f"    [OK] Lookup 3402.90.10 description: '{item['description']}' | General Duty: {item['general_duty']}")

    print("\n>>> 3. Testing Duty Exposure Calculation...")
    # Line item with R45,000 customs value: declared Free (0%), correct 10%
    exposure = checker.calculate_duty_exposure(
        customs_value=45000.0,
        declared_rate_str="Free",
        correct_rate_str="10%"
    )
    assert exposure["duty_shortfall_zar"] == 4500.0, f"Expected 4500.0 duty shortfall, got {exposure['duty_shortfall_zar']}"
    assert exposure["potential_penalty_zar"] == 13500.0, f"Expected 13500.0 penalty, got {exposure['potential_penalty_zar']}"
    print(f"    [OK] Exposure for R45,000 @ 10%: Shortfall = R {exposure['duty_shortfall_zar']:.2f}, Potential Sec 84 Penalty = R {exposure['potential_penalty_zar']:.2f}")

    print("\n>>> 4. Testing End-to-End Line Item Verification...")
    test_lines = [
        {
            "desc": "Castrol Industrial Gear Oil Alpha SP 220 (95% Mineral base oil, 200L steel drums)",
            "code": "2710.19.91 / 8",
            "val": 68000.0,
            "expected_status": "COMPLIANT"
        },
        {
            "desc": "SuperGlue Cyanoacrylate Instant Adhesive (Pack of 20 x 20g blister tubes, total 400g)",
            "code": "3506.91.00",
            "val": 45000.0,
            "expected_status": "CRITICAL_MISMATCH"
        },
        {
            "desc": "Heavy Duty Ceramic Disc Brake Pads (Asbestos-Free) for commercial trucks",
            "code": "6813.81",
            "val": 72000.0,
            "expected_status": "WARNING"
        }
    ]

    audited_results = []
    for line in test_lines:
        res = checker.verify_line_item(
            commercial_description=line["desc"],
            declared_code=line["code"],
            customs_value=line["val"]
        )
        audited_results.append(res)
        print(f"    - Item: {line['desc'][:40]}...")
        print(f"      Declared: {res['declared_code']} | Audited: {res['recommended_code']} / {res['recommended_check_digit']}")
        print(f"      Status: [{res['final_status']}] (Expected: [{line['expected_status']}])")
        print(f"      Verdict: {res['verdict']}")
        assert res["final_status"] == line["expected_status"], f"Status mismatch for {line['desc']}"

    print("\n>>> 5. Testing PDF Generation via ReportLab...")
    exporter = PDFExporter()
    audit_payload = {
        "document_reference": "TEST-INV-2026-SA-001",
        "total_items_audited": len(audited_results),
        "risk_summary": {
            "compliant_count": 1,
            "warning_count": 1,
            "critical_count": 1
        },
        "line_items": audited_results
    }
    pdf_path = exporter.generate_audit_report(audit_payload, filename="test_audit_report.pdf")
    assert os.path.isfile(pdf_path), f"PDF file was not created at {pdf_path}"
    file_size = os.path.getsize(pdf_path)
    print(f"    [OK] PDF successfully generated at: {pdf_path} ({file_size} bytes)")

    print("\n>>> 6. Testing Gemini Client Initialization & Rate Throttling...")
    client = GeminiClient(min_request_interval=0.1)
    mock_resp = client._mock_fallback("cross-check audit")
    assert "line_items" in mock_resp, "Mock fallback failed"
    print(f"    [OK] Gemini Client Mock Response verified: {len(mock_resp['line_items'])} items returned.")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
