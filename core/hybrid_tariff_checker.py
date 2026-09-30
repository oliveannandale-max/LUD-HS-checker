"""
Hybrid Tariff Checker for LUD Logistics
Cross-references AI vision/text outputs against the local SARS Schedule 1 database.
Validates code existence, verifies check digits, detects tariff evasion risks, and calculates duty exposure.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple


class HybridTariffChecker:
    """
    Validates tariff codes against the local SARS Schedule 1 Part 1 database.
    Integrates GRI logic and financial exposure calculation.
    """

    def __init__(self, cache_file: Optional[str] = None):
        if cache_file is None:
            # Default to cache/sars_tariff_schedule1.json relative to project root
            base_dir = Path(__file__).resolve().parent.parent
            cache_file = str(base_dir / "cache" / "sars_tariff_schedule1.json")
        
        self.cache_file = cache_file
        self.tariff_data: Dict[str, Any] = {}
        self.tariffs_by_code: Dict[str, Dict[str, Any]] = {}
        self.tariffs_by_heading: Dict[str, List[Dict[str, Any]]] = {}
        self.tariffs_by_subheading: Dict[str, List[Dict[str, Any]]] = {}
        self._load_cache()

    def _load_cache(self):
        """Loads and indexes the local SARS tariff schedule."""
        if not os.path.exists(self.cache_file):
            return

        with open(self.cache_file, "r", encoding="utf-8") as f:
            self.tariff_data = json.load(f)

        for item in self.tariff_data.get("tariffs", []):
            raw_code = self.clean_code(item["tariff_code"])
            self.tariffs_by_code[raw_code] = item
            
            # Index by 4-digit heading
            heading = item.get("heading", raw_code[:4])
            self.tariffs_by_heading.setdefault(heading, []).append(item)
            
            # Index by 6-digit subheading
            subheading = item.get("subheading", "").replace(".", "")
            if not subheading and len(raw_code) >= 6:
                subheading = raw_code[:6]
            self.tariffs_by_subheading.setdefault(subheading, []).append(item)

    @staticmethod
    def clean_code(code: str) -> str:
        """Strips formatting, periods, spaces, and trailing check digits."""
        if not code:
            return ""
        # Remove anything after slash (e.g. '3402.90.10 / 4' -> '3402.90.10')
        code = code.split("/")[0].strip()
        # Remove dots and spaces
        cleaned = re.sub(r"[^0-9]", "", code)
        # If 9 digits (code + check digit without slash), trim last if standard 8-digit tariff
        if len(cleaned) == 9:
            cleaned = cleaned[:8]
        return cleaned

    @staticmethod
    def format_code(code: str) -> str:
        """Formats 8-digit code as XXXX.XX.XX."""
        clean = re.sub(r"[^0-9]", "", code)
        if len(clean) == 8:
            return f"{clean[:4]}.{clean[4:6]}.{clean[6:]}"
        elif len(clean) == 6:
            return f"{clean[:4]}.{clean[4:]}"
        return code

    def lookup_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Exact lookup by 8-digit SARS code."""
        clean = self.clean_code(code)
        return self.tariffs_by_code.get(clean)

    def lookup_subheading(self, subheading: str) -> List[Dict[str, Any]]:
        """Finds all 8-digit SARS national splits under a 6-digit subheading."""
        clean = re.sub(r"[^0-9]", "", subheading)[:6]
        return self.tariffs_by_subheading.get(clean, [])

    def search_by_keywords(self, query: str) -> List[Dict[str, Any]]:
        """Searches tariffs by keywords, descriptions, or partial code."""
        query_lower = query.lower().strip()
        clean_num = re.sub(r"[^0-9]", "", query)
        results = []

        for item in self.tariff_data.get("tariffs", []):
            score = 0
            code = self.clean_code(item["tariff_code"])
            desc = item.get("description", "").lower()
            keywords = [k.lower() for k in item.get("keywords", [])]

            if clean_num and clean_num in code:
                score += 50
            if query_lower in desc:
                score += 30
            for kw in keywords:
                if query_lower in kw or kw in query_lower:
                    score += 25
            
            if score > 0:
                results.append((score, item))

        results.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in results]

    @staticmethod
    def parse_duty_rate(rate_str: str) -> float:
        """Converts rate strings like '10%', '15%', 'Free' into decimal floats (e.g. 0.10)."""
        if not rate_str or rate_str.strip().lower() in ["free", "0", "0%", "none"]:
            return 0.0
        match = re.search(r"(\d+(\.\d+)?)%", rate_str)
        if match:
            return float(match.group(1)) / 100.0
        return 0.0

    def calculate_duty_exposure(
        self,
        customs_value: float,
        declared_rate_str: str,
        correct_rate_str: str
    ) -> Dict[str, Any]:
        """
        Calculates duty delta:
        Duty Exposure = Customs Value * (Correct Duty Rate - Declared Duty Rate)
        """
        declared_rate = self.parse_duty_rate(declared_rate_str)
        correct_rate = self.parse_duty_rate(correct_rate_str)
        
        declared_duty = customs_value * declared_rate
        correct_duty = customs_value * correct_rate
        exposure = max(0.0, correct_duty - declared_duty)
        
        # Section 84 Customs Act potential penalty (up to 3x duty unpaid)
        potential_penalty = exposure * 3.0

        return {
            "customs_value": customs_value,
            "declared_rate": declared_rate_str,
            "correct_rate": correct_rate_str,
            "declared_duty_zar": round(declared_duty, 2),
            "correct_duty_zar": round(correct_duty, 2),
            "duty_shortfall_zar": round(exposure, 2),
            "potential_penalty_zar": round(potential_penalty, 2),
        }

    def verify_line_item(
        self,
        commercial_description: str,
        declared_code: str,
        customs_value: float = 0.0,
        ai_recommendation: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive audit verification of a line item:
        1. Checks declared code syntax and check digit
        2. Validates declared code against SARS Schedule 1 Part 1
        3. Cross-checks with AI recommendation
        4. Calculates duty exposure
        5. Computes risk severity: COMPLIANT, WARNING, or CRITICAL_MISMATCH
        """
        clean_declared = self.clean_code(declared_code)
        formatted_declared = self.format_code(clean_declared)
        db_match = self.lookup_code(clean_declared)

        # AI recommended codes
        ai_rec_code = ""
        ai_rec_duty = "Free"
        ai_status = "WARNING"
        ai_justification = ""
        ai_notes = ""

        if ai_recommendation:
            ai_rec_code = ai_recommendation.get("recommended_sars8") or ai_recommendation.get("classification", {}).get("sars_national_code", "")
            ai_rec_code = self.clean_code(ai_rec_code)
            ai_rec_duty = ai_recommendation.get("recommended_duty_rate") or ai_recommendation.get("duty_rates", {}).get("general", "Free")
            ai_status = ai_recommendation.get("audit_status", "WARNING")
            ai_justification = ai_recommendation.get("gri_justification") or ai_recommendation.get("wco_gri_reasoning", {}).get("primary_rule", "")
            ai_notes = ai_recommendation.get("audit_notes") or ai_recommendation.get("wco_gri_reasoning", {}).get("step_by_step_rationale", "")

        # If no AI recommendation given, attempt keyword match
        if not ai_rec_code:
            search_hits = self.search_by_keywords(commercial_description)
            if search_hits:
                best = search_hits[0]
                ai_rec_code = self.clean_code(best["tariff_code"])
                ai_rec_duty = best.get("general_duty", "Free")
                ai_notes = f"Matched to SARS database entry: {best.get('description')}"
                ai_justification = "GRI 1 (Terms of Headings)"

        clean_rec = self.clean_code(ai_rec_code)
        rec_db_entry = self.lookup_code(clean_rec)
        if rec_db_entry:
            ai_rec_duty = rec_db_entry.get("general_duty", ai_rec_duty)

        # Verification logic
        declared_duty_str = db_match.get("general_duty", "0%") if db_match else "Unknown"
        
        # Check digit verification
        cd_valid = True
        declared_cd = ""
        if "/" in declared_code:
            declared_cd = declared_code.split("/")[1].strip()
            if db_match and db_match.get("check_digit") != declared_cd:
                cd_valid = False

        # Exposure calculation
        exposure = self.calculate_duty_exposure(
            customs_value=customs_value,
            declared_rate_str=declared_duty_str,
            correct_rate_str=ai_rec_duty
        )

        # Status determination
        if not clean_declared:
            final_status = "CRITICAL_MISMATCH"
            verdict = "Missing HS code declaration on customs document."
        elif len(clean_declared) == 6 and clean_declared == clean_rec[:6]:
            final_status = "WARNING"
            verdict = f"6-digit subheading is correct, but declared code is truncated: missing 8-digit national split and SARS check digit (Expected: {self.format_code(clean_rec)} / {rec_db_entry.get('check_digit') if rec_db_entry else ''})."
        elif not db_match and len(clean_declared) == 8:
            final_status = "CRITICAL_MISMATCH"
            verdict = f"Declared tariff {formatted_declared} does not exist in SARS Schedule 1 Part 1."
        elif clean_declared == clean_rec:
            if not cd_valid:
                final_status = "WARNING"
                verdict = f"Declared code is correct, but check digit is invalid (Declared: {declared_cd}, Expected: {db_match.get('check_digit')})."
            else:
                final_status = "COMPLIANT"
                verdict = "Declared code is fully verified and compliant with SARS Schedule 1."
        elif exposure["duty_shortfall_zar"] > 0:
            final_status = "CRITICAL_MISMATCH"
            verdict = (
                f"CRITICAL MISCLASSIFICATION & DUTY SHORTFALL: Declared under {formatted_declared} "
                f"(@ {declared_duty_str} duty), but legally classifiable under {self.format_code(clean_rec)} "
                f"(@ {ai_rec_duty} duty). Potential tariff hopping / duty underpayment under SARS Section 84."
            )
        elif clean_declared[:6] == clean_rec[:6]:
            final_status = "WARNING"
            verdict = f"6-digit subheading matches, but 8-digit national statistical split differs. Declared: {formatted_declared}, Recommended: {self.format_code(clean_rec)}."
        elif clean_declared[:4] == clean_rec[:4]:
            final_status = "WARNING"
            verdict = f"4-digit heading matches, but national split differs (Zero duty differential). Declared: {formatted_declared}, Recommended: {self.format_code(clean_rec)}."
        else:
            final_status = "CRITICAL_MISMATCH"
            verdict = f"Severe misclassification across headings/chapters! Declared: {formatted_declared} ({db_match.get('description', 'Unknown') if db_match else 'Invalid'}), Recommended: {self.format_code(clean_rec)} ({rec_db_entry.get('description', '') if rec_db_entry else ''})."

        return {
            "commercial_description": commercial_description,
            "declared_code": declared_code,
            "declared_formatted": formatted_declared,
            "declared_valid_sars": db_match is not None,
            "declared_duty_rate": declared_duty_str,
            "recommended_code": self.format_code(clean_rec),
            "recommended_check_digit": rec_db_entry.get("check_digit", "") if rec_db_entry else "",
            "recommended_duty_rate": ai_rec_duty,
            "recommended_description": rec_db_entry.get("description", "") if rec_db_entry else "",
            "final_status": final_status,
            "gri_justification": ai_justification,
            "verdict": verdict,
            "audit_notes": ai_notes,
            "exposure": exposure
        }
