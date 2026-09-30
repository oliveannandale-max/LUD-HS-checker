# SARS Schedule 1 Part 1 (South African National Split Tariff Rules)

## Overview & Legal Context
The South African Revenue Service (SARS) customs tariff is governed by the Customs and Excise Act 91 of 1964. Schedule 1, Part 1 sets forth the ordinary customs duties applicable to imported goods.

---

## 1. SARS Tariff Code Architecture
Every SARS tariff classification consists of:
- **Heading (4 digits):** Derived from WCO Harmonized System (e.g., `34.02`).
- **Subheading (6 digits):** International WCO standard (e.g., `3402.90`).
- **National Split (8 digits):** 2 additional digits created specifically by SARS for national statistical and duty policy purposes (e.g., `3402.90.10`).
- **Check Digit (CD):** A single verification digit calculated via SARS Modulus 10 or published in the official tariff book (e.g., `3402.90.10 / 4`).

### Format Standards
All valid SARS tariff entries must be represented in one of the following canonical formats:
- Form A: `3402.90.10` (8 digits with periods)
- Form B: `3402.90.10.4` or `3402.90.10 / 4` (with check digit)
- Form C: `34029010` (unpunctuated 8 digits)

---

## 2. Priority Chapters (LUD Logistics Focus)

### Chapter 27: Mineral Fuels, Mineral Oils, and Products of their Distillation; Bituminous Substances; Mineral Waxes
- **Key Headings:**
  - `27.10`: Petroleum oils and oils obtained from bituminous minerals (other than crude); preparations containing >= 70% petroleum oil.
  - `27.11`: Petroleum gases and other gaseous hydrocarbons.
  - `27.12`: Petroleum jelly, paraffin wax, microcrystalline wax.
- **Audit Risks:** Check percentage of petroleum oil content (>= 70% threshold separates 27.10 from 34.03 lubricating preparations).

### Chapter 32: Tanning or Dyeing Extracts; Tannins; Dyes, Pigments, Paints, Varnishes; Putty; Inks
- **Key Headings:**
  - `32.08`: Paints and varnishes based on synthetic polymers in non-aqueous medium.
  - `32.09`: Paints and varnishes based on synthetic polymers in aqueous medium.
  - `32.14`: Glaziers' putty, grafting putty, resin cements, caulking compounds.
  - `32.15`: Printing ink, writing or drawing ink.
- **Audit Risks:** Aqueous vs non-aqueous solvents, solvent weight percentages.

### Chapter 34: Soap, Organic Surface-Active Agents, Washing Preparations, Lubricating Preparations, Artificial Waxes
- **Key Headings:**
  - `34.01`: Soap; organic surface-active products for use as soap.
  - `34.02`: Organic surface-active agents (other than soap); surface-active preparations, washing preparations.
    - *National splits:* Anionic, cationic, non-ionic, retail put-ups.
  - `34.03`: Lubricating preparations (containing < 70% petroleum oil).
  - `34.05`: Polishes and creams for footwear, furniture, floors, coachwork, glass or metal.
- **Audit Risks:** Differentiation between 27.10 (>70% oil) and 34.03 (<70% oil).

### Chapter 35: Albuminoidal Substances; Modified Starches; Glues; Enzymes
- **Key Headings:**
  - `35.01`: Casein, caseinates.
  - `35.05`: Dextrins and other modified starches; glues based on starches.
  - `35.06`: Prepared glues and other prepared adhesives, not elsewhere specified; products suitable for use as glues or adhesives put up for retail sale <= 1 kg.
- **Audit Risks:** Weight limit (1 kg retail threshold strictly determines 3506.10 vs 3506.91/99).

### Chapter 38: Miscellaneous Chemical Products
- **Key Headings:**
  - `38.11`: Anti-knock preparations, oxidation inhibitors, gum inhibitors, viscosity improvers, anti-corrosive preparations.
  - `38.14`: Organic composite solvents and thinners, not elsewhere specified.
  - `38.20`: Anti-freezing preparations and prepared de-icing fluids.
  - `38.24`: Prepared binders for foundry moulds or cores; chemical products and preparations of the chemical or allied industries.
- **Audit Risks:** "Basket" heading 38.24 must only be applied when no specific heading exists elsewhere in Chapters 28-38.

### Chapter 68: Articles of Stone, Plaster, Cement, Asbestos, Mica or Similar Materials
- **Key Headings:**
  - `68.04`: Millstones, grindstones, grinding wheels and the like.
  - `68.05`: Natural or artificial abrasive powder or grain, on a base of textile material, paper, or paperboard.
  - `68.06`: Slag-wool, rock-wool and similar mineral wools; expanded clays.
  - `68.13`: Friction material and articles thereof (brake linings, pads) for clutches or the like.
- **Audit Risks:** Asbestos content restrictions under South African environmental regulations.

---

## 3. Duty Treatment & Preferential Trade Agreements
When auditing, check applicable tariff column rates:
1. **General Rate:** Default MFN (Most Favoured Nation) duty rate.
2. **EU Rate:** European Union Economic Partnership Agreement (EPA). Requires EUR.1 or origin declaration.
3. **SADC Rate:** Southern African Development Community trade protocol. Requires SADC Certificate of Origin.
4. **AfCFTA Rate:** African Continental Free Trade Area.
5. **EFTA Rate:** European Free Trade Association.

If an invoice claims a preferential rate (e.g., 0% duty under SADC/EU), verify whether the product meets rules of origin criteria and whether the required origin certificate is present.
