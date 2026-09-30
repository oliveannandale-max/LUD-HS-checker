/**
 * LUD Logistics - Embedded WCO GRI & SARS Decision Engine
 * Runs 100% client-side in the browser on GitHub Pages or locally.
 */

const SARS_DATABASE = [
  {
    tariff_code: "2710.12.02",
    check_digit: "4",
    heading: "2710",
    subheading: "2710.12",
    chapter: "27",
    description: "Petrol (motor spirits), unleaded, containing >= 70% petroleum oils",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "l",
    keywords: ["petrol", "gasoline", "motor spirit", "fuel", "unleaded"],
    notes: "Subject to Fuel Levy and Road Accident Fund (RAF) levy under Schedule 1 Part 2."
  },
  {
    tariff_code: "2710.19.26",
    check_digit: "0",
    heading: "2710",
    subheading: "2710.19",
    chapter: "27",
    description: "Distillate fuel (diesel), with sulfur content <= 10 mg/kg (10 ppm), containing >= 70% petroleum oil",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "l",
    keywords: ["diesel", "automotive diesel", "distillate fuel", "gasoil", "10ppm", "50ppm"],
    notes: "Must satisfy petroleum oil content >= 70% by weight."
  },
  {
    tariff_code: "2710.19.91",
    check_digit: "8",
    heading: "2710",
    subheading: "2710.19",
    chapter: "27",
    description: "Lubricating oils, containing >= 70% petroleum oils or bituminous mineral oils as basic constituents",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "l",
    keywords: ["mineral lubricating oil", "engine oil", "motor oil", "crankcase oil", "gear oil"],
    notes: "Crucial distinction: If petroleum oil < 70%, classify under heading 34.03."
  },
  {
    tariff_code: "2710.19.92",
    check_digit: "6",
    heading: "2710",
    subheading: "2710.19",
    chapter: "27",
    description: "Lubricating greases, containing >= 70% petroleum oil",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["grease", "bearing grease", "chassis grease", "mineral grease"],
    notes: "Contains soap thickeners and >= 70% petroleum base oil."
  },
  {
    tariff_code: "2712.10.00",
    check_digit: "3",
    heading: "2712",
    subheading: "2712.10",
    chapter: "27",
    description: "Petroleum jelly (petrolatum)",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["petroleum jelly", "vaseline", "petrolatum", "white petrolatum"],
    notes: "Heading 27.12 covers mineral waxes, petroleum jelly, whether or not colored."
  },
  {
    tariff_code: "3208.10.10",
    check_digit: "1",
    heading: "3208",
    subheading: "3208.10",
    chapter: "32",
    description: "Paints and varnishes based on polyesters, dispersed or dissolved in a non-aqueous medium",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "l",
    keywords: ["paint", "varnish", "polyester paint", "solvent-based paint", "non-aqueous"],
    notes: "Non-aqueous solvent medium exceeds 50% by weight of solvent."
  },
  {
    tariff_code: "3208.20.90",
    check_digit: "9",
    heading: "3208",
    subheading: "3208.20",
    chapter: "32",
    description: "Paints and varnishes based on acrylic or vinyl polymers, non-aqueous medium, other",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "l",
    keywords: ["acrylic paint", "vinyl varnish", "solvent enamel", "clearcoat", "automotive paint"],
    notes: "Commonly imported for industrial and automotive refinishing."
  },
  {
    tariff_code: "3209.10.00",
    check_digit: "7",
    heading: "3209",
    subheading: "3209.10",
    chapter: "32",
    description: "Paints and varnishes based on acrylic or vinyl polymers, dispersed or dissolved in an aqueous medium",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "l",
    keywords: ["water-based paint", "emulsion paint", "latex paint", "acrylic emulsion", "aqueous paint"],
    notes: "Water is the continuous phase / solvent."
  },
  {
    tariff_code: "3214.10.00",
    check_digit: "4",
    heading: "3214",
    subheading: "3214.10",
    chapter: "32",
    description: "Glaziers' putty, grafting putty, resin cements, caulking compounds and other mastics; painters' fillings",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "kg",
    keywords: ["mastic", "caulk", "sealant", "putty", "resin cement", "silicone sealant", "painters filling"],
    notes: "Includes silicone and polyurethane gap sealants."
  },
  {
    tariff_code: "3215.11.00",
    check_digit: "0",
    heading: "3215",
    subheading: "3215.11",
    chapter: "32",
    description: "Printing ink: Black",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["black ink", "printing ink", "offset ink", "flexographic ink"],
    notes: "Must be formulated specifically for printing machinery."
  },
  {
    tariff_code: "3401.11.00",
    check_digit: "5",
    heading: "3401",
    subheading: "3401.11",
    chapter: "34",
    description: "Soap and organic surface-active products and preparations, in the form of bars, cakes, moulded pieces or shapes, for toilet use",
    general_duty: "20%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "15%",
    unit: "kg",
    keywords: ["toilet soap", "bath soap", "soap bar", "medicated soap bar"],
    notes: "High import duty (20%) protects domestic South African soap manufacturing."
  },
  {
    tariff_code: "3402.31.00",
    check_digit: "2",
    heading: "3402",
    subheading: "3402.31",
    chapter: "34",
    description: "Anionic organic surface-active agents: Linear alkylbenzene sulfonic acids and their salts (LABSA)",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["labsa", "linear alkylbenzene sulfonic acid", "surfactant", "anionic surfactant"],
    notes: "Key raw material for detergents and washing powder."
  },
  {
    tariff_code: "3402.42.00",
    check_digit: "1",
    heading: "3402",
    subheading: "3402.42",
    chapter: "34",
    description: "Non-ionic organic surface-active agents (other than polyoxyethylene fatty alcohols)",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["non-ionic surfactant", "ethoxylate", "tween", "triton", "alkyl polyglucoside"],
    notes: "Industrial raw materials are duty-free."
  },
  {
    tariff_code: "3402.90.10",
    check_digit: "4",
    heading: "3402",
    subheading: "3402.90",
    chapter: "34",
    description: "Surface-active preparations and washing preparations, put up for retail sale in packages <= 5 kg",
    general_duty: "20%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "16%",
    unit: "kg",
    keywords: ["laundry detergent", "dishwashing liquid", "washing powder", "retail cleaning agent"],
    notes: "Retail threshold: <= 5 kg packaging carries 20% general duty."
  },
  {
    tariff_code: "3402.90.90",
    check_digit: "2",
    heading: "3402",
    subheading: "3402.90",
    chapter: "34",
    description: "Surface-active preparations, washing and cleaning preparations, bulk packaging (> 5 kg)",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["bulk detergent", "industrial degreaser", "tank cleaner", "surface cleaner bulk"],
    notes: "Bulk packaging carries Free general duty compared to 20% for retail packs."
  },
  {
    tariff_code: "3403.19.00",
    check_digit: "8",
    heading: "3403",
    subheading: "3403.19",
    chapter: "34",
    description: "Lubricating preparations containing < 70% by weight of petroleum oils (synthetic lubricants, cutting oils)",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["synthetic lubricant", "cutting fluid", "bolt release", "penetrating oil", "anti-rust lubricant"],
    notes: "Oil content must be under 70% by weight. If >= 70%, reclassify to 27.10."
  },
  {
    tariff_code: "3405.30.00",
    check_digit: "7",
    heading: "3405",
    subheading: "3405.30",
    chapter: "34",
    description: "Polishes and similar preparations for coachwork (car wax, polish)",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "kg",
    keywords: ["car wax", "car polish", "coachwork polish", "automotive glaze"],
    notes: "Covers vehicle detailing waxes and polishes."
  },
  {
    tariff_code: "3505.10.10",
    check_digit: "9",
    heading: "3505",
    subheading: "3505.10",
    chapter: "35",
    description: "Dextrins and other modified starches",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["dextrin", "modified starch", "pregelatinized starch", "esterified starch"],
    notes: "Used in paper sizing, textile finishing, and food thickeners."
  },
  {
    tariff_code: "3506.10.00",
    check_digit: "9",
    heading: "3506",
    subheading: "3506.10",
    chapter: "35",
    description: "Products suitable for use as glues or adhesives, put up for retail sale in packages <= 1 kg net weight",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "kg",
    keywords: ["superglue", "super glue", "retail adhesive", "craft glue", "epoxy syringe <=1kg", "wood glue retail"],
    notes: "Strict 1 kg retail packaging rule (GRI 1 / Subheading Note 1)."
  },
  {
    tariff_code: "3506.91.00",
    check_digit: "5",
    heading: "3506",
    subheading: "3506.91",
    chapter: "35",
    description: "Adhesives based on polymers of headings 39.01 to 39.13 or on rubber (> 1 kg net weight)",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["hot melt adhesive", "industrial adhesive", "pva bulk glue", "polyurethane adhesive bulk"],
    notes: "Net weight strictly exceeds 1 kg."
  },
  {
    tariff_code: "3507.90.00",
    check_digit: "2",
    heading: "3507",
    subheading: "3507.90",
    chapter: "35",
    description: "Enzymes; prepared enzymes not elsewhere specified or included",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["enzymes", "protease", "amylase", "cellulase", "lipase", "detergent enzyme"],
    notes: "Includes biocatalysts for detergents, brewing, and baking."
  },
  {
    tariff_code: "3811.21.00",
    check_digit: "8",
    heading: "3811",
    subheading: "3811.21",
    chapter: "38",
    description: "Additives for lubricating oils, containing petroleum oils or oils obtained from bituminous minerals",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["oil additive", "lubricating oil additive", "anti-wear additive", "detergent additive oil"],
    notes: "Formulated packages to blend finished lubricating oils."
  },
  {
    tariff_code: "3814.00.00",
    check_digit: "6",
    heading: "3814",
    subheading: "3814.00",
    chapter: "38",
    description: "Organic composite solvents and thinners, not elsewhere specified; prepared paint or varnish removers",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "l",
    keywords: ["lacquer thinner", "paint stripper", "composite solvent", "white spirits mix", "gun wash"],
    notes: "Applies to blends; single pure chemical solvents classify under Chapter 29."
  },
  {
    tariff_code: "3820.00.00",
    check_digit: "5",
    heading: "3820",
    subheading: "3820.00",
    chapter: "38",
    description: "Anti-freezing preparations and prepared de-icing fluids",
    general_duty: "10%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "8%",
    unit: "l",
    keywords: ["antifreeze", "radiator coolant", "de-icing fluid", "glycol coolant", "engine coolant"],
    notes: "Ready-to-use or concentrated automotive and aviation coolants."
  },
  {
    tariff_code: "3824.99.90",
    check_digit: "7",
    heading: "3824",
    subheading: "3824.99",
    chapter: "38",
    description: "Chemical products and preparations of the chemical or allied industries, not elsewhere specified: Other",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["chemical specialty", "foundry compound", "flocculant mixture", "industrial chemical blend"],
    notes: "Residual 'basket' heading. GRI 1 requires ensuring no earlier specific heading applies."
  },
  {
    tariff_code: "6804.22.00",
    check_digit: "6",
    heading: "6804",
    subheading: "6804.22",
    chapter: "68",
    description: "Millstones, grindstones, grinding wheels and the like, of other agglomerated abrasives or of ceramics",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["grinding wheel", "cutting disc", "abrasive disc", "grindstone", "ceramic abrasive"],
    notes: "Unmounted stones and wheels for grinding or cutting."
  },
  {
    tariff_code: "6805.20.00",
    check_digit: "1",
    heading: "6805",
    subheading: "6805.20",
    chapter: "68",
    description: "Natural or artificial abrasive powder or grain, on a base of paper or paperboard only",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["sandpaper", "abrasive paper", "emery paper", "glasspaper", "wet and dry sandpaper"],
    notes: "Backing is exclusively paper or paperboard."
  },
  {
    tariff_code: "6805.30.00",
    check_digit: "8",
    heading: "6805",
    subheading: "6805.30",
    chapter: "68",
    description: "Natural or artificial abrasive powder or grain, on a base of woven textile fabric, or combined with paper",
    general_duty: "Free",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "Free",
    unit: "kg",
    keywords: ["abrasive cloth", "emery cloth", "sanding belt", "abrasive flap disc"],
    notes: "Textile or vulcanized fiber backing."
  },
  {
    tariff_code: "6813.81.00",
    check_digit: "1",
    heading: "6813",
    subheading: "6813.81",
    chapter: "68",
    description: "Friction material and articles thereof, not containing asbestos: Brake linings and pads",
    general_duty: "15%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "12%",
    unit: "kg",
    keywords: ["brake pads", "brake linings", "friction pads", "ceramic brake pads", "semi-metallic brake pads"],
    notes: "Carries 15% general duty rate. Must be certified asbestos-free."
  },
  {
    tariff_code: "6813.89.00",
    check_digit: "4",
    heading: "6813",
    subheading: "6813.89",
    chapter: "68",
    description: "Friction material and articles thereof, not containing asbestos: Clutch facings and other friction elements",
    general_duty: "15%",
    eu_duty: "Free",
    sadc_duty: "Free",
    afcfta_duty: "12%",
    unit: "kg",
    keywords: ["clutch plate facing", "clutch friction disc", "clutch disc facing"],
    notes: "Non-asbestos clutch friction material."
  }
];

class ClientRulesEngine {
  constructor() {
    this.tariffs = SARS_DATABASE;
    this.codeIndex = new Map();
    this.tariffs.forEach(t => {
      this.codeIndex.set(this.cleanCode(t.tariff_code), t);
    });
  }

  cleanCode(code) {
    if (!code) return "";
    let clean = code.split("/")[0].trim().replace(/[^0-9]/g, "");
    if (clean.length === 9) clean = clean.slice(0, 8);
    return clean;
  }

  formatCode(code) {
    const clean = this.cleanCode(code);
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6)}`;
    }
    if (clean.length === 6) {
      return `${clean.slice(0, 4)}.${clean.slice(4)}`;
    }
    return code;
  }

  lookupCode(code) {
    const clean = this.cleanCode(code);
    return this.codeIndex.get(clean) || null;
  }

  searchKeywords(query) {
    const q = query.toLowerCase().trim();
    const cleanNum = q.replace(/[^0-9]/g, "");
    const results = [];

    this.tariffs.forEach(item => {
      let score = 0;
      const code = this.cleanCode(item.tariff_code);
      const desc = item.description.toLowerCase();
      const keywords = item.keywords || [];

      if (cleanNum && code.includes(cleanNum)) score += 50;
      if (desc.includes(q)) score += 30;
      keywords.forEach(k => {
        if (q.includes(k.toLowerCase()) || k.toLowerCase().includes(q)) score += 25;
      });

      if (score > 0) results.push({ score, item });
    });

    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.item);
  }

  parseDutyRate(rateStr) {
    if (!rateStr || ["free", "0", "0%", "none"].includes(rateStr.trim().toLowerCase())) return 0.0;
    const match = rateStr.match(/(\d+(\.\d+)?)%/);
    return match ? parseFloat(match[1]) / 100.0 : 0.0;
  }

  calculateExposure(customsValue, declaredRateStr, correctRateStr) {
    const decRate = this.parseDutyRate(declaredRateStr);
    const corRate = this.parseDutyRate(correctRateStr);
    const declaredDuty = customsValue * decRate;
    const correctDuty = customsValue * corRate;
    const shortfall = Math.max(0, correctDuty - declaredDuty);
    const penalty = shortfall * 3.0; // SARS Sec 84
    const interest = shortfall * 0.1125 * (60 / 365); // 60 days default audit exposure

    return {
      customs_value: customsValue,
      declared_duty_zar: Math.round(declaredDuty * 100) / 100,
      correct_duty_zar: Math.round(correctDuty * 100) / 100,
      duty_shortfall_zar: Math.round(shortfall * 100) / 100,
      potential_penalty_zar: Math.round(penalty * 100) / 100,
      interest_zar: Math.round(interest * 100) / 100
    };
  }

  verifyLineItem(description, declaredCode, customsValue = 0) {
    const cleanDeclared = this.cleanCode(declaredCode);
    const formattedDeclared = this.formatCode(cleanDeclared);
    const dbMatch = this.lookupCode(cleanDeclared);

    // Keyword match
    const hits = this.searchKeywords(description);
    const bestMatch = hits.length > 0 ? hits[0] : null;

    let cleanRec = bestMatch ? this.cleanCode(bestMatch.tariff_code) : "";
    let recDuty = bestMatch ? bestMatch.general_duty : "Free";
    let recDesc = bestMatch ? bestMatch.description : "";
    let recCd = bestMatch ? bestMatch.check_digit : "";
    let justification = "GRI 1 (Terms of Headings) and GRI 6 (Subheadings)";

    const declaredDutyStr = dbMatch ? dbMatch.general_duty : "Unknown";

    let cdValid = true;
    let declaredCd = "";
    if (declaredCode.includes("/")) {
      declaredCd = declaredCode.split("/")[1].trim();
      if (dbMatch && dbMatch.check_digit !== declaredCd) {
        cdValid = false;
      }
    }

    const exposure = this.calculateExposure(customsValue, declaredDutyStr, recDuty);

    let finalStatus = "WARNING";
    let verdict = "";

    if (!cleanDeclared) {
      finalStatus = "CRITICAL_MISMATCH";
      verdict = "Missing HS code declaration on customs document.";
    } else if (cleanDeclared.length === 6 && cleanDeclared === cleanRec.slice(0, 6)) {
      finalStatus = "WARNING";
      verdict = `6-digit subheading is correct, but declared code is truncated: missing 8-digit national split and SARS check digit (Expected: ${this.formatCode(cleanRec)} / ${recCd}).`;
    } else if (!dbMatch && cleanDeclared.length === 8) {
      finalStatus = "CRITICAL_MISMATCH";
      verdict = `Declared tariff ${formattedDeclared} does not exist in SARS Schedule 1 Part 1.`;
    } else if (cleanDeclared === cleanRec) {
      if (!cdValid) {
        finalStatus = "WARNING";
        verdict = `Declared code is correct, but check digit is invalid (Declared: ${declaredCd}, Expected: ${dbMatch.check_digit}).`;
      } else {
        finalStatus = "COMPLIANT";
        verdict = "Declared code is fully verified and compliant with SARS Schedule 1.";
      }
    } else if (exposure.duty_shortfall_zar > 0) {
      finalStatus = "CRITICAL_MISMATCH";
      verdict = `CRITICAL MISCLASSIFICATION & DUTY SHORTFALL: Declared under ${formattedDeclared} (@ ${declaredDutyStr} duty), but legally classifiable under ${this.formatCode(cleanRec)} (@ ${recDuty} duty). Potential tariff hopping / duty underpayment under SARS Section 84.`;
      justification = "GRI 1 & Specific Chapter Notes";
    } else if (cleanDeclared.slice(0, 6) === cleanRec.slice(0, 6)) {
      finalStatus = "WARNING";
      verdict = `6-digit subheading matches, but 8-digit national statistical split differs. Declared: ${formattedDeclared}, Recommended: ${this.formatCode(cleanRec)}.`;
    } else if (cleanDeclared.slice(0, 4) === cleanRec.slice(0, 4)) {
      finalStatus = "WARNING";
      verdict = `4-digit heading matches, but national split differs (Zero duty differential). Declared: ${formattedDeclared}, Recommended: ${this.formatCode(cleanRec)}.`;
    } else {
      finalStatus = "CRITICAL_MISMATCH";
      verdict = `Severe misclassification across headings/chapters! Declared: ${formattedDeclared}, Recommended: ${this.formatCode(cleanRec)} (${recDesc}).`;
    }

    return {
      commercial_description: description,
      declared_code: declaredCode,
      declared_formatted: formattedDeclared,
      declared_valid_sars: dbMatch !== null,
      declared_duty_rate: declaredDutyStr,
      recommended_code: this.formatCode(cleanRec),
      recommended_check_digit: recCd,
      recommended_duty_rate: recDuty,
      recommended_description: recDesc,
      final_status: finalStatus,
      gri_justification: justification,
      verdict: verdict,
      exposure: exposure
    };
  }
}

// Attach to window
window.ClientRulesEngine = new ClientRulesEngine();
window.SARS_TARIFF_DB = SARS_DATABASE;
