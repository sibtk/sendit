// ============================================
// Salvage & Rebuilt Title Laws by State
// Comprehensive database for car flip analysis
// Last researched: May 2025
// ============================================

export type FlipperRating = "friendly" | "moderate" | "strict";

export interface StateTitleLaw {
  state: string;
  stateCode: string;

  // Thresholds
  totalLossThreshold: string; // e.g., "75% of ACV" or "TLF (repair + salvage > ACV)"
  totalLossMethod: "percentage" | "TLF"; // TLF = Total Loss Formula

  // Registration & conversion
  canRegisterSalvage: boolean;
  canConvertToRebuilt: boolean;
  conversionProcess: string;

  // Out-of-state acceptance
  acceptsOutOfStateSalvage: boolean;
  acceptsNonRepairable: boolean;
  outOfStateNotes: string;

  // Inspections
  inspectionRequired: boolean;
  inspectionType: string; // "anti-theft" | "safety" | "both" | "VIN only" | "none"
  inspectionCost: number | null; // approximate in dollars
  inspectionAgency: string;
  inspectionNotes: string;

  // Title branding
  titleBrand: string; // what appears on the title
  issuesPartsOnly: boolean; // "parts only" or equivalent
  issuesCertOfDestruction: boolean;
  nonRepairableLabel: string; // what they call it

  // Special rules
  floodDamageDisclosure: boolean;
  ageExemptions: string | null; // e.g., "9+ model years exempt from inspection"
  dealerOnlyRestrictions: string | null;
  specialRestrictions: string[];

  // Resale impact
  titleImpactPct: { salvage: number; rebuilt: number }; // percentage reduction from clean title value
  resaleNotes: string;

  // Flipper friendliness
  flipperRating: FlipperRating;
  flipperNotes: string;

  // Fees
  salvageTitleFee: number | null;
  rebuiltTitleFee: number | null;

  // Source authority
  dmvUrl: string;
}

export const STATE_TITLE_LAWS: Record<string, StateTitleLaw> = {
  // ======================================================
  // PRIORITY STATES (Top 20 for car flippers)
  // ======================================================

  TX: {
    state: "Texas",
    stateCode: "TX",
    totalLossThreshold: "100% of ACV (repair > ACV)",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle, get anti-theft inspection at DPS station, submit Form VTR-61 (Rebuilt Vehicle Statement) and Form 130-U with parts receipts.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Non-repairable vehicles from other states cannot be rebuilt in TX.",
    inspectionRequired: true,
    inspectionType: "anti-theft",
    inspectionCost: 65,
    inspectionAgency: "Texas Department of Public Safety (DPS)",
    inspectionNotes:
      "Anti-theft inspection only (not a mechanical safety check). Inspector verifies VIN and checks parts receipts against vehicle. $65 rebuilt title fee + $28-33 title application.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Nonrepairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Nonrepairable vehicles can NEVER be rebuilt or titled for road use",
      "Must disclose salvage history to buyer in writing",
      "Salvage dealer license required for volume rebuilders",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Strong market for rebuilt titles in TX due to high vehicle demand. Rebuilt trucks and SUVs retain more value than sedans.",
    flipperRating: "friendly",
    flipperNotes:
      "100% TLT means more vehicles get salvage (not junk) titles. Anti-theft only inspection is fast and easy. High demand state. One of the best states for flipping.",
    salvageTitleFee: 8,
    rebuiltTitleFee: 65,
    dmvUrl: "https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/title-check-look-before-you-buy/rebuilt",
  },

  FL: {
    state: "Florida",
    stateCode: "FL",
    totalLossThreshold: "80% of ACV (uninsured) or 100% (insured total loss)",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair by qualified mechanic with documented work. Pass state inspection at FLHSMV or authorized station. Submit Form HSMV 82363.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Vehicles with certificate of destruction from any state cannot be titled in FL.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 40,
    inspectionAgency: "FLHSMV or authorized inspection station",
    inspectionNotes:
      "$40 initial inspection. $20 for each re-inspection if vehicle fails. Decal affixed to vehicle after passing. Inspection covers safety and anti-theft.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Certificate of Destruction",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions:
      "Independent dealers must be licensed to rebuild salvage vehicles for resale.",
    specialRestrictions: [
      "Title stamped: 'rebuilt and may have previously been declared a total loss vehicle due to damage'",
      "Rebuilt decal permanently affixed to vehicle",
      "Flood damage separately branded on title",
      "Insurance company must report total loss within 72 hours",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Very active rebuilt title market. High demand for trucks and SUVs. Flood damage brand is a bigger penalty than standard salvage.",
    flipperRating: "friendly",
    flipperNotes:
      "Low inspection fee ($40). Active market with high buyer demand. Accepts out-of-state salvage. Good state for volume flippers.",
    salvageTitleFee: 75,
    rebuiltTitleFee: 75,
    dmvUrl: "https://www.flhsmv.gov/pdf/forms/82363.pdf",
  },

  GA: {
    state: "Georgia",
    stateCode: "GA",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle in Georgia. Tow (not drive) to inspection site. Provide before-photos, Form MV-1, Form T-129 (Labor & Parts Certification), parts receipts, and original salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles but vehicle MUST be rebuilt in Georgia. Out-of-state rebuilt titles accepted without re-inspection.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 100,
    inspectionAgency: "Georgia Department of Revenue",
    inspectionNotes:
      "$100 state inspection + $18 title fee = $118 total. $100 for each re-inspection on failure. Vehicle must be TOWED to inspection (cannot be driven). VIN verification, parts verification, safety equipment check, and 'rebuilt' stamp verification.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Nonrepairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Vehicle MUST be rebuilt in Georgia for GA rebuilt title",
      "Vehicle must be towed to inspection (not driven)",
      "Word 'rebuilt' must be permanently affixed to vehicle",
      "Before-repair photos required in color",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 30 },
    resaleNotes:
      "Moderate rebuilt title market. Atlanta area has strong demand. Must-be-rebuilt-in-state requirement adds cost for out-of-state purchases.",
    flipperRating: "moderate",
    flipperNotes:
      "Must rebuild in GA. $100 inspection fee and tow requirement add cost. But accepts out-of-state salvage and has decent market demand.",
    salvageTitleFee: 18,
    rebuiltTitleFee: 18,
    dmvUrl: "https://dor.georgia.gov/titles-rebuilt-or-restored-vehicles",
  },

  CA: {
    state: "California",
    stateCode: "CA",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Full repair, CHP salvage inspection, VIN verification, brake & lamp certification, smog check, then submit to DMV for revived salvage title. 4-10 week process.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles but requires full CHP inspection process. Strict on documentation.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 250,
    inspectionAgency: "California Highway Patrol (CHP) + DMV",
    inspectionNotes:
      "CHP Salvage Inspection ($50-60) + Brake & Lamp Certification ($80-150) + Smog Check ($50-90) + VIN Verification ($25-50) + DMV fees ($100-350). Total process cost $250-600+. Appointment availability can add weeks.",
    titleBrand: "REVIVED SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Nonrepairable / Junk",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "CHP inspection required (not just DMV)",
      "Brake & Lamp certification required",
      "Smog check required",
      "Weight certificate required for trucks/pickups",
      "Insurance for rebuilt title vehicles is difficult to obtain",
      "Process takes 4-10 weeks minimum",
    ],
    titleImpactPct: { salvage: 55, rebuilt: 30 },
    resaleNotes:
      "Large market but rebuilt titles carry heavier stigma in CA. Insurance is harder to get. Higher-value vehicles still sell well with rebuilt titles.",
    flipperRating: "strict",
    flipperNotes:
      "Most expensive and time-consuming rebuild process in the US. Multiple inspections, long wait times, high fees. Not ideal for volume flipping unless based in CA with established process.",
    salvageTitleFee: 23,
    rebuiltTitleFee: 23,
    dmvUrl: "https://www.dmv.ca.gov/portal/handbook/vehicle-industry-registration-procedures-manual-2/salvage-nonrepairable-junk-vehicles/revived-salvage-california-record/",
  },

  NY: {
    state: "New York",
    stateCode: "NY",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Apply by mail (Form MV-83SAL) for salvage vehicle examination. Provide before-photos, parts receipts with donor VINs. Repairs must match insurance claim. Title arrives 3-5 weeks after passing.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Maryland does NOT accept NY salvage certificates (relevant for cross-state flips).",
    inspectionRequired: true,
    inspectionType: "anti-theft",
    inspectionCost: 200,
    inspectionAgency: "NY DMV Auto Theft Prevention Program",
    inspectionNotes:
      "$200 inspection fee. Mail-only application process. NOT a safety or emissions inspection. Verifies vehicle is not stolen and parts are not stolen. Repairs must match insurance claim exactly or vehicle is rejected. Separate safety and emissions inspection also required.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: "Vehicles 8+ model years old may have different requirements",
    dealerOnlyRestrictions:
      "Dealer must provide disclosure statement on back of title when selling rebuilt salvage.",
    specialRestrictions: [
      "Application is MAIL ONLY (no walk-in)",
      "Repairs must match insurance claim exactly",
      "Color before-photos required",
      "Parts receipts must include donor vehicle VINs",
      "$200 inspection fee is among highest in the nation",
    ],
    titleImpactPct: { salvage: 55, rebuilt: 30 },
    resaleNotes:
      "NYC metro area has good demand for rebuilt vehicles. Upstate markets are softer. High insurance costs make rebuilt vehicles attractive to price-conscious buyers.",
    flipperRating: "strict",
    flipperNotes:
      "Expensive ($200 fee), mail-only process, repairs must match insurance claim. Slow turnaround. Not flipper-friendly for volume work.",
    salvageTitleFee: 50,
    rebuiltTitleFee: 50,
    dmvUrl: "https://dmv.ny.gov/salvage/salvage-vehicles",
  },

  PA: {
    state: "Pennsylvania",
    stateCode: "PA",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair to original manufacturer specs. Enhanced safety inspection at PennDOT-authorized Enhanced Vehicle Safety Inspection Station. Submit parts receipts and documentation.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage but requires PA enhanced inspection regardless. Flood, fire, and recovered theft brands from other states also trigger enhanced inspection.",
    inspectionRequired: true,
    inspectionType: "safety",
    inspectionCost: 100,
    inspectionAgency:
      "PennDOT-authorized Enhanced Vehicle Safety Inspection Stations",
    inspectionNotes:
      "Enhanced inspection covers brakes, tires, suspension, lights, frame, body condition, and all warning lights. Must be restored to original manufacturer specifications. Cosmetic damage does not need to be repaired. Only PennDOT-contracted stations can perform this.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Junk",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Must be restored to original manufacturer specs and appearance",
      "Only PennDOT-contracted Enhanced Inspection Stations can inspect",
      "Warning lights must be repaired (cosmetic damage exempt)",
      "Repair estimates marked 'Paid' can substitute for receipts",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Good market in Philadelphia and Pittsburgh metro areas. 'Reconstructed' branding carries slightly less stigma than 'salvage' in buyer perception.",
    flipperRating: "moderate",
    flipperNotes:
      "Enhanced inspection is thorough but reasonable. Must use PennDOT-contracted stations which limits options. Good market demand in urban areas.",
    salvageTitleFee: 53,
    rebuiltTitleFee: 53,
    dmvUrl: "https://www.pa.gov/content/dam/copapwp-pagov/en/penndot/documents/public/dvspubsforms/bmv/bmv-fact-sheets/fs-rvtp.pdf",
  },

  OH: {
    state: "Ohio",
    stateCode: "OH",
    totalLossThreshold: "TLF (insurer determination, no fixed %)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Purchase prepaid inspection receipt at BMV. Schedule online inspection with Ohio State Highway Patrol. Pass inspection. Apply for rebuilt salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. OSHP inspection still required. Ohio has had noted issues with title washing from neighboring states.",
    inspectionRequired: true,
    inspectionType: "anti-theft",
    inspectionCost: 50,
    inspectionAgency: "Ohio State Highway Patrol (OSHP)",
    inspectionNotes:
      "$50 inspection receipt prepaid at BMV + registrar fees. OSHP verifies VIN, checks major components, cross-references part receipts. Focuses on ownership verification rather than full mechanical safety check. Schedule online at OSHP Vehicle Inspection Gateway.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Salvage - Parts Only",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Prepaid inspection receipt required from BMV before scheduling",
      "Online scheduling through OSHP Vehicle Inspection Gateway",
      "Title bears 'REBUILT SALVAGE' in black boldface",
      "Ohio has had issues with title washing - authorities are vigilant",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Good market especially in Columbus, Cleveland, Cincinnati metros. Rebuilt SUVs and trucks sell faster than sedans.",
    flipperRating: "moderate",
    flipperNotes:
      "Reasonable $50 inspection fee. Anti-theft focus means less scrutiny on cosmetics. Good Midwest market. Process is straightforward.",
    salvageTitleFee: 44,
    rebuiltTitleFee: 44,
    dmvUrl: "https://services.dps.ohio.gov/vehicleInspection",
  },

  IL: {
    state: "Illinois",
    stateCode: "IL",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Must be rebuilt by a licensed rebuilder. Take vehicle to Secretary of State inspection station. If 8 model years or newer, also requires Secretary of State Police second inspection. Must also get IDOT Certificate of Safety.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles but CT salvage stamps are not accepted for Massachusetts (relevant for multi-state flippers).",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 94,
    inspectionAgency:
      "Secretary of State inspection station + SOS Police + IDOT",
    inspectionNotes:
      "$94 inspection fee. Vehicles 8 model years or newer require TWO inspections (SOS station + SOS Police). Vehicles 9+ model years old are EXEMPT from inspection. IDOT Certificate of Safety also required. Inspection report valid for 6 months only.",
    titleBrand: "REBUILT",
    issuesPartsOnly: true,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Junk / Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles 9+ model years old are exempt from rebuilt inspection",
    dealerOnlyRestrictions:
      "IL dealers cannot sell salvaged vehicles to public - must obtain rebuilt title first",
    specialRestrictions: [
      "Must be rebuilt by a LICENSED rebuilder",
      "Vehicles 8 model years or newer need two separate inspections",
      "9+ model year vehicles are EXEMPT from inspection (huge for flippers)",
      "Dealers prohibited from selling salvage-titled vehicles to public",
      "Inspection report expires after 6 months",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Chicago metro is a strong market for rebuilt vehicles. Age exemption makes older vehicle flips very easy.",
    flipperRating: "friendly",
    flipperNotes:
      "The 9+ model year inspection exemption is a game-changer for flipping older vehicles. No inspection needed at all. For newer vehicles, the process is more involved with dual inspections.",
    salvageTitleFee: 95,
    rebuiltTitleFee: 95,
    dmvUrl: "https://www.ilsos.gov/publications/pdf_publications/vsd975.pdf",
  },

  MI: {
    state: "Michigan",
    stateCode: "MI",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair by licensed mechanic in appropriate specialty. Complete Form TR-13A with mechanic certification. Pass inspection by certified salvage vehicle inspector. Apply for rebuilt salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage. CRITICAL: Michigan has a SCRAP title at 91%+ damage that can NEVER be rebuilt - only dismantled for parts.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 100,
    inspectionAgency:
      "Specially trained salvage vehicle inspectors (law enforcement)",
    inspectionNotes:
      "Inspection verifies ownership of repair parts and compliance with Michigan Vehicle Code equipment/safety requirements. Must have repairs certified by licensed mechanic on Form TR-13A before scheduling inspection.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Scrap",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "SCRAP title (91%+ damage) can NEVER be rebuilt - parts/scrap only",
      "Must use licensed mechanic for repairs",
      "Mechanic must certify repairs on Form TR-13A",
      "Strict new auto salvage law for consumer protection",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Detroit area has strong demand for domestic trucks and SUVs with rebuilt titles. Good market for American-brand vehicles.",
    flipperRating: "moderate",
    flipperNotes:
      "Watch out for SCRAP titles (91%+ damage) - those are dead ends. Normal salvage process is reasonable. Must use licensed mechanic which adds cost.",
    salvageTitleFee: 15,
    rebuiltTitleFee: 15,
    dmvUrl: "https://www.michigan.gov/sos/-/media/Project/Websites/sos/Vehicle/Salvage-Vehicle/tr13a.pdf",
  },

  NC: {
    state: "North Carolina",
    stateCode: "NC",
    totalLossThreshold: "75% of fair market retail value",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. If 6 model years or newer: anti-theft inspection by State Highway Patrol + safety/smog inspection. If older than 6 model years: rebuilder affidavit only (no inspection needed if repairs <75% of FMV).",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Same inspection requirements apply.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency:
      "State Highway Patrol Investigative Services Unit (for 6 model years or newer)",
    inspectionNotes:
      "Vehicles 6 model years or newer require preliminary and final inspection by Highway Patrol. Vehicles OLDER than 6 model years can get an UNBRANDED title with just a rebuilder affidavit (if repairs <75% FMV). Smog and safety inspection required for all.",
    titleBrand: "SALVAGE REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles older than 6 model years: unbranded title possible via rebuilder affidavit (no inspection if repairs <75% FMV)",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "6 model years or newer: full Highway Patrol inspection required",
      "Older than 6 model years: can get UNBRANDED title with affidavit",
      "Total Loss Claim Vehicle sticker required in doorjamb if applicable",
      "Airbag replacement cost excluded from 75% threshold calculation",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 20 },
    resaleNotes:
      "Excellent opportunity: older vehicles can get UNBRANDED (clean-looking) titles. Charlotte and Raleigh metros have strong demand.",
    flipperRating: "friendly",
    flipperNotes:
      "One of the BEST states for flipping older vehicles. Vehicles older than 6 model years can potentially get an unbranded title with just an affidavit. No inspection needed. This is a major advantage.",
    salvageTitleFee: 52,
    rebuiltTitleFee: 52,
    dmvUrl: "https://www.ncdot.gov/dmv/title-registration/special-cases/Pages/salvaged-abandoned-vehicles.aspx",
  },

  NJ: {
    state: "New Jersey",
    stateCode: "NJ",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Schedule and pass salvage vehicle inspection at NJ MVC state inspection facility. Submit documentation and apply for reconstructed vehicle title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. NJ has its own inspection requirements regardless of origin state.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 200,
    inspectionAgency: "NJ Motor Vehicle Commission (MVC) state inspection facility",
    inspectionNotes:
      "$200 inspection fee. Must be performed at a STATE inspection facility (not private). Covers vehicle history review and physical inspection of repairs. Older salvage vehicles may be exempt from inspection.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Older salvaged vehicles may not need inspection for standard title",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "$200 inspection fee is among the highest nationally",
      "Must use state inspection facility (not private)",
      "Regulations under N.J.A.C. 13:21-22 et seq.",
    ],
    titleImpactPct: { salvage: 55, rebuilt: 30 },
    resaleNotes:
      "Northern NJ (near NYC) has strong demand. 'Reconstructed' branding is somewhat less stigmatized than 'salvage rebuilt' in buyer perception.",
    flipperRating: "moderate",
    flipperNotes:
      "$200 fee is high but the age exemption for older vehicles helps. Good proximity to NY/PA markets. State-only inspection facility can mean wait times.",
    salvageTitleFee: 60,
    rebuiltTitleFee: 60,
    dmvUrl: "https://www.nj.gov/mvc/vehicles/salvage.htm",
  },

  VA: {
    state: "Virginia",
    stateCode: "VA",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Pass state safety inspection first. Then pass DMV rebuilt vehicle examination (review of photos, documentation, VIN/odometer verification). Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage. DMV rebuilt examination still required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 125,
    inspectionAgency: "VA DMV + licensed safety inspection station",
    inspectionNotes:
      "$125 DMV examination fee + separate safety inspection cost. DMV reviews before-photos, parts documentation, VIN, odometer, and engine/transmission/electronic modules. Safety inspection is separate and must be passed first.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Exemption for rebuilders licensed 10+ years, vehicle 10+ years old, resale value <$10,000",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Two-step process: safety inspection THEN DMV examination",
      "Before-rebuild photos/video required if available",
      "Licensed rebuilders (10+ years, no penalties) exempt for vehicles 10+ years old and <$10k value",
      "Title permanently branded as rebuilt",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Northern VA (DC metro) has excellent demand for rebuilt vehicles. Hampton Roads/Virginia Beach also strong.",
    flipperRating: "moderate",
    flipperNotes:
      "The 10-year-old vehicle exemption for licensed rebuilders is valuable. Two-step inspection adds time but is manageable. NoVA market demand is strong.",
    salvageTitleFee: 15,
    rebuiltTitleFee: 15,
    dmvUrl: "https://www.dmv.virginia.gov/vehicles/title/sal-veh-law-req/repaired-rebuilt",
  },

  AZ: {
    state: "Arizona",
    stateCode: "AZ",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Apply for restored salvage certificate of title. ADOT conducts Level 2 or Level 3 inspection. Provide parts invoices with donor VINs. Receive restored salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Same inspection process applies.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "Arizona Department of Transportation (ADOT)",
    inspectionNotes:
      "$50 inspection fee. Level 3 inspection is the most intense: checks front/rear assemblies, transmission, engine, all equipment. ADOT must conduct inspection within 20 days of request or within 48 hours after that deadline. Parts receipts must show donor VINs.",
    titleBrand: "RESTORED SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Unrecoverable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Must disclose in writing to buyer before sale completion",
      "Level 3 inspection covers major components thoroughly",
      "ADOT has 20-day response requirement for inspection requests",
      "Cannot transfer vehicle until restored salvage title is issued",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Phoenix metro is one of the largest used car markets in the US. Dry climate means less rust, which attracts buyers. 'Restored salvage' branding is relatively well-accepted.",
    flipperRating: "friendly",
    flipperNotes:
      "Low $50 inspection fee. 20-day response requirement keeps things moving. Phoenix market is massive. Dry climate vehicles are in high demand nationally. Great state for flipping.",
    salvageTitleFee: 4,
    rebuiltTitleFee: 4,
    dmvUrl: "https://azdot.gov/taxonomy/term/1787",
  },

  NV: {
    state: "Nevada",
    stateCode: "NV",
    totalLossThreshold: "65% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "For vehicles 5 model years or newer: get DMV Authorization for Vehicle Restoration (VP 209) first. Repair at NV-registered garage, licensed body shop, or licensed rebuilder. Pass inspection. Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. NV inspection still required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 75,
    inspectionAgency:
      "NV-registered garage, licensed body shop, or licensed rebuilder",
    inspectionNotes:
      "Vehicles 5 model years or newer need DMV pre-authorization BEFORE rebuilding. Inspection verifies work meets manufacturer standards, safety equipment is present and operational. Certificate of inspection required before title application.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles 5 model years or newer require pre-authorization from DMV before rebuilding",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Orange-colored salvage title in Nevada",
      "Pre-authorization required for vehicles 5 model years or newer",
      "Must use NV-registered garage, body shop, or licensed rebuilder",
      "Major component replacement (even without total loss) requires rebuilt title",
      "Inspector must certify repairs meet manufacturer standards",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Las Vegas metro has strong demand. Low threshold (65%) means more vehicles get salvage titles. Desert climate vehicles are attractive to out-of-state buyers.",
    flipperRating: "moderate",
    flipperNotes:
      "Low 65% threshold creates more salvage inventory. Pre-authorization for newer vehicles adds a step. Must use licensed NV shops. Vegas market is solid.",
    salvageTitleFee: 28,
    rebuiltTitleFee: 28,
    dmvUrl: "https://dmv.nv.gov/salvage.htm",
  },

  AL: {
    state: "Alabama",
    stateCode: "AL",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "If you owned vehicle before salvage: submit electronic application, salvage title, parts bills of sale, registration receipt, and $90 inspection fee. If you did NOT own before salvage: MUST have master dealer regulatory license. Inspector contacts you within 1-2 weeks.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Same requirements apply.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 90,
    inspectionAgency: "Alabama Department of Revenue inspectors",
    inspectionNotes:
      "$90 inspection fee in certified funds. Electronic application only (no paper since April 2024). Inspector contacts you within 1-2 weeks to schedule. Decal/plate affixed to vehicle showing rebuilt status.",
    titleBrand: "REBUILT",
    issuesPartsOnly: true,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Parts Only / Non-Rebuildable / Certificate of Destruction / Junk",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions:
      "If you did NOT own vehicle before salvage, must have master dealer regulatory license to apply for rebuilt inspection",
    specialRestrictions: [
      "Master dealer license required if you didn't own vehicle before salvage",
      "Electronic applications only (no paper since April 2024)",
      "Parts only / non-rebuildable / COD / junk branded vehicles CANNOT be rebuilt",
      "Must disclose salvage/rebuilt status in 10-point type minimum to buyer",
      "Rebuilt decal permanently affixed to vehicle",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Alabama market is moderate. Birmingham and Huntsville have decent demand. Lower cost of living means lower vehicle prices overall.",
    flipperRating: "moderate",
    flipperNotes:
      "The master dealer license requirement for non-prior-owners is a significant barrier for flippers buying at auction. Prior owners have an easier path. $90 fee is reasonable.",
    salvageTitleFee: 18,
    rebuiltTitleFee: 18,
    dmvUrl: "https://www.revenue.alabama.gov/motor-vehicle/salvage-and-rebuilt-vehicles/",
  },

  SC: {
    state: "South Carolina",
    stateCode: "SC",
    totalLossThreshold: "75% of pre-damage value",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Pay $25 inspection fee. SCDMV inspector examines vehicle and documentation. Present parts receipts. If passes, apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. SC inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 25,
    inspectionAgency: "SCDMV inspectors",
    inspectionNotes:
      "$25 non-refundable inspection fee. Inspector checks parts receipts, verifies repairs, and ensures vehicle is safe and operable. Pending HB 4281 (2025-2026) may add airbag/restraint system verification requirements.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Pending HB 4281 may require verification of airbags, 3-point restraints, and fuel-spill prevention",
      "Salvage fire and salvage flood are separately branded",
      "Licensed rebuilder must present with owner at inspection",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Charleston, Greenville, and Columbia have good demand. Lower cost of living means more price-sensitive buyers interested in rebuilt vehicles.",
    flipperRating: "friendly",
    flipperNotes:
      "Cheapest inspection fee in the nation at $25. Simple process. Good Southeast market. Excellent state for flipping.",
    salvageTitleFee: 15,
    rebuiltTitleFee: 15,
    dmvUrl: "https://dmv.sc.gov/Vehicle-Owners/Titles/Title-Brands",
  },

  TN: {
    state: "Tennessee",
    stateCode: "TN",
    totalLossThreshold: "75% of retail value",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair per manufacturer requirements. Submit receipts, wrecked-condition photos, and documentation to Anti-Theft Unit. Pass anti-theft inspection. Pay $75 rebuilt title fee. Decal affixed to driver door jamb.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles directly - no need to first obtain TN salvage certificate. Can submit out-of-state salvage title directly with rebuilt application. Very flipper-friendly.",
    inspectionRequired: true,
    inspectionType: "anti-theft",
    inspectionCost: 75,
    inspectionAgency: "Tennessee Anti-Theft Unit",
    inspectionNotes:
      "$75 rebuilt title fee covers inspection. Anti-Theft Unit verifies no stolen parts, checks bills of sale, and ensures repairs meet manufacturer requirements. Commissioner may waive inspection for specific vehicles/classes.",
    titleBrand: "REBUILT VEHICLE ANTI-THEFT INSPECTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Commissioner can waive inspection for specific vehicles",
      "Out-of-state salvage titles accepted directly (no TN salvage needed first)",
      "Must disclose salvage history per TN Code 55-3-209",
      "Anti-theft decal on driver door jamb",
      "Photos of wrecked condition required",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Nashville, Memphis, and Knoxville have good demand. Growing population drives vehicle demand. No state income tax makes TN attractive for business.",
    flipperRating: "friendly",
    flipperNotes:
      "Accepts out-of-state salvage directly without TN conversion first. Anti-theft only inspection. Commissioner waiver possibility. No state income tax. Excellent for flipping.",
    salvageTitleFee: 11,
    rebuiltTitleFee: 75,
    dmvUrl: "https://www.tn.gov/revenue/title-and-registration/vehicle-titling/salvage.html",
  },

  MO: {
    state: "Missouri",
    stateCode: "MO",
    totalLossThreshold: "80% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Obtain Vehicle Examination Certificate (Form DOR-551) from authorized law enforcement (must be <60 days old). Apply for prior salvage title at DOR licensing office.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Same examination required.",
    inspectionRequired: true,
    inspectionType: "anti-theft",
    inspectionCost: 34,
    inspectionAgency: "Authorized law enforcement",
    inspectionNotes:
      "$25 examination fee + $9 processing fee = $34 total. Vehicle Examination Certificate (Form DOR-551) must be no more than 60 days old when applying. Examination by authorized law enforcement.",
    titleBrand: "PRIOR SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Junking Certificate",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles more than 6 years past model year: salvage title application is OPTIONAL (not mandatory)",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Vehicle examination certificate expires in 60 days",
      "Salvage title mandatory only for vehicles within 6 years of model year",
      "Older vehicles (6+ years): salvage title is optional",
      "'Prior Salvage' branding is less stigmatized than 'rebuilt salvage'",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "St. Louis and Kansas City metros have good demand. 'Prior Salvage' branding is perceived as less severe. Optional salvage title for older vehicles is advantageous.",
    flipperRating: "friendly",
    flipperNotes:
      "Low fees ($34 total). Optional salvage title for 6+ year old vehicles means older cars might avoid salvage brand entirely. 'Prior Salvage' is lighter branding. Great for flipping.",
    salvageTitleFee: 8,
    rebuiltTitleFee: 8,
    dmvUrl: "https://dor.mo.gov/forms/4698.pdf",
  },

  IN: {
    state: "Indiana",
    stateCode: "IN",
    totalLossThreshold: "70% of fair market value",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Pass state police inspection (VIN, frame, safety equipment, emissions, odometer). Submit affidavit from restorer, surrender salvage certificate, apply for rebuilt title at BMV.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles. Indiana state police inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 15,
    inspectionAgency: "Indiana State Police",
    inspectionNotes:
      "$15 fee. State police inspect frame, structural components, safety equipment (airbags, seatbelts), emissions systems, VIN verification, and odometer reading. Separate 'REBUILT FLOOD DAMAGED VEHICLE' designation for flood vehicles.",
    titleBrand: "REBUILT VEHICLE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Separate flood damage brand: 'REBUILT FLOOD DAMAGED VEHICLE'",
      "70% threshold is one of the lowest (more vehicles get salvage titles)",
      "Restorer must provide sworn affidavit",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Indianapolis metro has good demand. Low $15 fee makes this very cost-effective. 70% threshold means more inventory enters salvage market.",
    flipperRating: "friendly",
    flipperNotes:
      "Cheapest inspection in the country at $15. Low 70% threshold creates more salvage inventory. Straightforward process. Excellent for flipping.",
    salvageTitleFee: 15,
    rebuiltTitleFee: 15,
    dmvUrl: "https://www.in.gov/bmv/titles/files/Salvage_Restoration_Packet.pdf",
  },

  WA: {
    state: "Washington",
    stateCode: "WA",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Schedule Washington State Patrol inspection. Provide documentation for all major component parts. WSP VIN specialist verifies parts and attaches marking at driver door latch pillar. Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage. WSP inspection required. Original owners who didn't buy the car as salvage may be exempt from inspection.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 75,
    inspectionAgency: "Washington State Patrol (WSP)",
    inspectionNotes:
      "WSP VIN specialist checks 14 categories of major component parts (engine, frame, transmission, cab, doors, differentials, clips, panels, bed, seats, hood, bumpers, fenders, airbags). All receipts must be in owner's name. Notarized bill of sale required for third-party parts. Marking permanently attached at driver door pillar.",
    titleBrand: "WA REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles 5 years old or newer, OR 6-20 years old with pre-damage value $7,880+ get 'WA REBUILT' brand. Others may get different treatment.",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "14 major component parts categories checked",
      "All receipts must be in owner name (or notarized from third party)",
      "Original owners exempt from inspection if not purchased as salvage",
      "Permanent marking at driver door latch pillar",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Seattle metro has strong demand. Pacific NW market values quality rebuilds. Tech-savvy buyers do their research.",
    flipperRating: "moderate",
    flipperNotes:
      "Thorough WSP inspection covers 14 component categories. Receipts must be in your name. Original owner exemption doesn't help flippers. Process is solid but detailed.",
    salvageTitleFee: 14,
    rebuiltTitleFee: 14,
    dmvUrl: "https://wsp.wa.gov/wp-content/uploads/2024/06/170004_Rebuilt_Salvage_Vehicle_Inspection_Guide_R_5-24.pdf",
  },

  // ======================================================
  // REMAINING 30 STATES
  // ======================================================

  CO: {
    state: "Colorado",
    stateCode: "CO",
    totalLossThreshold: "100% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Get certified VIN inspection by certified VIN inspector. Stamp 'REBUILT FROM SALVAGE' on vehicle. Submit DR2415 checklist. Apply for rebuilt from salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. VIN inspection required.",
    inspectionRequired: true,
    inspectionType: "VIN only",
    inspectionCost: 50,
    inspectionAgency: "Certified VIN inspector (Colorado State Patrol or authorized)",
    inspectionNotes:
      "VIN inspection by certified inspector. Vehicle must be physically stamped with 'REBUILT FROM SALVAGE' with letters at least 1/4 inch height. Relatively simple process.",
    titleBrand: "REBUILT FROM SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "100% TLT means more vehicles keep clean titles (fewer get salvage branded)",
      "Vehicle must be physically stamped 'REBUILT FROM SALVAGE'",
      "VIN inspection only (not a full mechanical check)",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Denver metro has strong demand. 100% threshold means only truly totaled vehicles get salvage titles, which can actually reduce stigma.",
    flipperRating: "friendly",
    flipperNotes:
      "100% TLT like TX. VIN-only inspection is easy. Denver market is strong. Good state for flipping.",
    salvageTitleFee: 8,
    rebuiltTitleFee: 8,
    dmvUrl: "https://dmv.colorado.gov/sites/dmv/files/documents/DR2415.pdf",
  },

  OR: {
    state: "Oregon",
    stateCode: "OR",
    totalLossThreshold: "80% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Apply for salvage title with VIN inspection. Rebuild vehicle to state safety standards. Get second VIN inspection. Pass salvage inspection. Receive 'Reconstructed' title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. Two VIN inspections required (one when applying for salvage title, one when applying for rebuilt).",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 60,
    inspectionAgency: "Oregon DMV or designated law enforcement",
    inspectionNotes:
      "Two VIN inspections required: once when getting salvage title, and again when applying for reconstructed title. Safety standards must be met.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Two separate VIN inspections required in the process",
      "No sales tax in Oregon (advantage for flippers)",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Portland metro has good demand. No sales tax is a major advantage for vehicle sales.",
    flipperRating: "moderate",
    flipperNotes:
      "Two VIN inspections add time. But NO SALES TAX is a huge advantage for buying and selling vehicles. Portland market is solid.",
    salvageTitleFee: 93,
    rebuiltTitleFee: 93,
    dmvUrl: "https://www.oregon.gov/odot/dmv/docs/chapter_j.pdf",
  },

  KY: {
    state: "Kentucky",
    stateCode: "KY",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle to safety standards. Pass rebuilt salvage inspection. Submit documentation and apply for rebuilt salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. KY inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "Kentucky State Police or authorized inspector",
    inspectionNotes:
      "Inspection verifies vehicle is roadworthy and meets safety standards. KY has discontinued its emissions testing program.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "No emissions testing required (program discontinued)",
      "Standard salvage/rebuilt process",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Louisville and Lexington have moderate demand. Lower cost market. No emissions testing simplifies the process.",
    flipperRating: "moderate",
    flipperNotes:
      "No emissions testing. Reasonable fees. Moderate market demand. Straightforward process.",
    salvageTitleFee: 12,
    rebuiltTitleFee: 12,
    dmvUrl: "https://www.stateregstoday.com/living/traffic-and-driving/salvage-title-laws-and-regulations-in-kentucky",
  },

  LA: {
    state: "Louisiana",
    stateCode: "LA",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Restore vehicle. Submit in- or out-of-state salvage title with endorsement, notarized bill of sale, physical inspection affidavit, and completed Application for Salvage-Reconstructed Motor Vehicle to OMV.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage titles with endorsement. Relatively flexible.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 20,
    inspectionAgency: "Louisiana OMV or authorized inspection station",
    inspectionNotes:
      "Physical inspection required with affidavit. Emissions inspection only required in certain parishes (Baton Rouge metro area). Low cost process overall.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Emissions inspection only in certain parishes (Baton Rouge metro)",
      "Flood damage is common in LA - extra scrutiny on flood-branded vehicles",
      "Notarized bill of sale required",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "New Orleans and Baton Rouge have decent demand. Flood vehicle stigma is high in LA due to hurricane history. Buyers are more suspicious of water damage.",
    flipperRating: "friendly",
    flipperNotes:
      "Very low inspection cost (~$20). Simple process. Accepts out-of-state salvage with endorsement. Watch for flood cars - they have extra stigma in LA. Salvage title fee is $68.50.",
    salvageTitleFee: 69,
    rebuiltTitleFee: 69,
    dmvUrl: "https://legalbeagle.com/7649228-convert-salvage-title-louisiana.html",
  },

  WI: {
    state: "Wisconsin",
    stateCode: "WI",
    totalLossThreshold: "70% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Obtain WI salvage title. Repair vehicle. Take 4 pre-repair damage photos (all sides). Complete major parts statement (MV2673) with receipts. Complete MV1. Titled owner must be present at inspection.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Must convert to Wisconsin salvage title first before inspection. Title presented must be a WI salvage title.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 80,
    inspectionAgency: "Wisconsin law enforcement (sheriff or police)",
    inspectionNotes:
      "$80 inspection fee. Reconstructed title costs $214.50. Titled owner MUST be present at inspection. 4 damage photos required. Major parts statement (MV2673) in triplicate with receipts. Emissions inspection required in certain SE WI counties only.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Must convert to WI salvage title first",
      "Titled owner must be present at inspection",
      "4 pre-repair damage photos required",
      "Emissions only in SE WI counties (Milwaukee area)",
      "Major parts statement in triplicate",
      "Flood damaged vehicles receive separate brand",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Milwaukee and Madison have moderate demand. Owner-present requirement adds logistical complexity.",
    flipperRating: "moderate",
    flipperNotes:
      "Must convert to WI salvage first. Owner must be present at inspection. $80 inspection + $214.50 title = nearly $300 total. Moderate market.",
    salvageTitleFee: 165,
    rebuiltTitleFee: 215,
    dmvUrl: "https://wisconsindot.gov/Pages/safety/veh-inspect/salvage-veh/default.aspx",
  },

  MN: {
    state: "Minnesota",
    stateCode: "MN",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Rebuild vehicle. Complete Declaration of Reconstruction/Special Assembly (Form PS2015A) during repairs. Provide original bills of sale, receipts, and invoices. Pass motor vehicle inspection. Pay $35 inspection fee.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. MN inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 35,
    inspectionAgency: "Minnesota motor vehicle inspection station",
    inspectionNotes:
      "$35 inspection fee. Declaration form must be filled out during repair process. All original bills of sale and receipts required.",
    titleBrand: "PRIOR SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Declaration form must be completed DURING repair (not after)",
      "Original receipts required (not copies)",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Minneapolis-St. Paul metro has good demand. 'Prior Salvage' is lighter branding. Rust concerns from salt increase demand for southern vehicle imports.",
    flipperRating: "moderate",
    flipperNotes:
      "Low $35 inspection fee. 'Prior Salvage' branding. Must keep declaration form during repairs. Decent Twin Cities market.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 10,
    dmvUrl: "https://www.dmv.org/mn-minnesota/salvaged-vehicles.php",
  },

  IA: {
    state: "Iowa",
    stateCode: "IA",
    totalLossThreshold: "70% of fair market value",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Physical examination by Iowa Law Enforcement Academy certified peace officer. Provide receipts and documentation. Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. Iowa inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 53,
    inspectionAgency: "Iowa Law Enforcement Academy certified peace officer",
    inspectionNotes:
      "$53 non-refundable inspection fee. Officer verifies documentation, receipts, and inspects vehicle. Low 70% threshold creates more salvage inventory.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable / Junking Certificate",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Low 70% threshold means more vehicles enter salvage market",
      "Certified peace officer performs examination",
      "$53 fee is non-refundable",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Des Moines and Cedar Rapids have moderate demand. Lower cost market overall.",
    flipperRating: "moderate",
    flipperNotes:
      "Low threshold (70%) creates more inventory. Reasonable $53 fee. Moderate market demand. Straightforward process.",
    salvageTitleFee: 25,
    rebuiltTitleFee: 25,
    dmvUrl: "https://iowadot.gov/registration-plates/other-vehicle-services/salvage-vehicles",
  },

  AR: {
    state: "Arkansas",
    stateCode: "AR",
    totalLossThreshold: "70% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Complete Affidavit of Reconstruction of Salvage Motor Vehicle (REV 2009). Provide information on restoration, parts used, VINs. Pay $10 title fee.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage.",
    inspectionRequired: false,
    inspectionType: "none",
    inspectionCost: 0,
    inspectionAgency: "N/A",
    inspectionNotes:
      "Vehicles more than 7 model years old are EXEMPT from salvage/rebuilt requirements. For exempt vehicles, just an affidavit is needed. One of the easiest states for older vehicle flips.",
    titleBrand: "REBUILT",
    issuesPartsOnly: true,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Parts Only",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles more than 7 model years old are EXEMPT from salvage/rebuilt requirements",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "7+ model year vehicles are FULLY EXEMPT from salvage requirements",
      "Affidavit-only process for older vehicles",
      "$10 title fee is extremely low",
      "One of the easiest states for rebuilding salvage vehicles",
    ],
    titleImpactPct: { salvage: 40, rebuilt: 15 },
    resaleNotes:
      "Smaller market but the exemption for 7+ year vehicles is a massive advantage. Little Rock area has moderate demand.",
    flipperRating: "friendly",
    flipperNotes:
      "One of the BEST states for flipping older vehicles. 7+ model year exemption means no inspection, no rebuilt brand needed. $10 title fee. Affidavit only. Absolute gem for flippers.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 10,
    dmvUrl: "https://www.dfa.arkansas.gov/wp-content/uploads/AffidavitofReconstructionofSalvageMV.pdf",
  },

  MS: {
    state: "Mississippi",
    stateCode: "MS",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair or replace one major part and four minor parts. Attach before-repair damage photos per instructions. Pay $75 inspection fee (certified check to Dept of Public Safety). Pass inspection.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. MS inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 75,
    inspectionAgency: "Mississippi Department of Public Safety - Salvage Inspection Division",
    inspectionNotes:
      "$75 certified check to DPS. Non-refundable whether pass or fail. Same $75 fee for re-inspection. Must document replacement of 1 major part + 4 minor parts. Before-repair photos required per specific instructions.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Must replace/repair 1 major + 4 minor parts and document it",
      "Certified check only for fees",
      "Same fee for re-inspections",
      "Before-repair photos with specific requirements",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Jackson area has moderate demand. Smaller overall market. Gulf Coast area sees flood vehicle activity.",
    flipperRating: "moderate",
    flipperNotes:
      "$75 fee is reasonable. The 1 major + 4 minor parts documentation requirement adds paperwork. Moderate market demand.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 10,
    dmvUrl: "https://www.dps.ms.gov/investigation/salvage-inspection-division",
  },

  OK: {
    state: "Oklahoma",
    stateCode: "OK",
    totalLossThreshold: "60% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle to roadworthy condition. If 10 model years or newer: rebuilt inspection by Licensed Operator. If older than 10 model years: eligible for regular title at any time (no inspection).",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. Same age-based rules apply.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 25,
    inspectionAgency: "Oklahoma Licensed Operator (for vehicles 10 model years or newer)",
    inspectionNotes:
      "$25 examination fee by licensed operator. Only vehicles 10 model years or newer need inspection. Vehicles OLDER than 10 model years need NO inspection and can get a regular (non-branded) title. Visual inspection + VIN examination.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions:
      "Vehicles older than 10 model years: NO inspection required, eligible for REGULAR (non-branded) title",
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "60% TLT is the LOWEST in the nation - more vehicles get salvage branded",
      "10+ year old vehicles can get regular (clean) title with no inspection",
      "$25 is one of the cheapest inspection fees",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 15 },
    resaleNotes:
      "Oklahoma City and Tulsa have moderate demand. The ability to get a regular title for older vehicles is extremely valuable for resale.",
    flipperRating: "friendly",
    flipperNotes:
      "Incredible for flipping older vehicles: 10+ model year vehicles get a REGULAR (clean) title with NO inspection. $25 fee for newer vehicles. 60% TLT creates maximum salvage inventory. Top-tier flipper state.",
    salvageTitleFee: 11,
    rebuiltTitleFee: 11,
    dmvUrl: "https://intercom.help/service-oklahoma/en/articles/10671150-what-steps-do-i-need-to-take-to-get-a-rebuilt-title-for-my-salvage-vehicle",
  },

  KS: {
    state: "Kansas",
    stateCode: "KS",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Take to Kansas Highway Patrol motor vehicle inspection station. Get MVE-1 examination certificate. Take salvage title + MVE-1 pink copy + proof of insurance to county treasurer for rebuilt salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. KHP inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 40,
    inspectionAgency: "Kansas Highway Patrol motor vehicle inspection station",
    inspectionNotes:
      "Motor Vehicle Examination (MVE-1) required. Take to KHP inspection station. Proof of insurance required for rebuilt title application.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Highway / Junk",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "MVE-1 form required from KHP",
      "Proof of insurance required at application",
      "County treasurer handles title application",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Kansas City metro (shared with MO) has decent demand. Wichita market is smaller.",
    flipperRating: "moderate",
    flipperNotes:
      "Reasonable process and fees. Kansas City market helps. Straightforward KHP inspection.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 10,
    dmvUrl: "https://www.ksrevenue.gov/dovtitlefaq.html",
  },

  NE: {
    state: "Nebraska",
    stateCode: "NE",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Get Vehicle Inspection Certificate with VIN comparison and odometer reading. Submit with title application.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. NE inspection required.",
    inspectionRequired: true,
    inspectionType: "VIN only",
    inspectionCost: 10,
    inspectionAgency: "Nebraska law enforcement or authorized inspector",
    inspectionNotes:
      "$10 inspection fee. VIN comparison with title and odometer reading verification. One of the simplest and cheapest inspections in the nation.",
    titleBrand: "PREVIOUSLY SALVAGED / REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "$10 is one of the cheapest inspection fees nationally",
      "VIN and odometer verification only (simple inspection)",
      "Flood damaged and manufacturer buyback are separate brands",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes: "Omaha and Lincoln have moderate demand. Smaller market overall.",
    flipperRating: "friendly",
    flipperNotes:
      "Incredibly cheap ($10) and simple (VIN-only) inspection. Low barrier to rebuilt title. Market is smaller but process is nearly friction-free.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 10,
    dmvUrl: "https://dmv.nebraska.gov/dvr/title/motor-vehicles-salvage-titles",
  },

  UT: {
    state: "Utah",
    stateCode: "UT",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Safety inspection by state-certified vehicle inspector. Provide bills of sale with seller info and donor VINs. Contact UT Highway Patrol for inspection stations. Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. UT safety inspection required.",
    inspectionRequired: true,
    inspectionType: "safety",
    inspectionCost: 50,
    inspectionAgency: "Utah Highway Patrol / state-certified vehicle inspector",
    inspectionNotes:
      "Safety inspection only required when changing salvage to rebuilt status. Must provide all bills of sale, receipts, and invoices with seller name, contact, and donor vehicle VIN.",
    titleBrand: "REBUILT / RESTORED SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Parts receipts must include seller contact info and donor VIN",
      "Call UT Highway Patrol at (801) 965-4889 for station locations",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Salt Lake City metro has growing demand. Lower cost market but growing population.",
    flipperRating: "moderate",
    flipperNotes:
      "Reasonable $50 fee. Safety inspection focus. Growing SLC market. Straightforward process.",
    salvageTitleFee: 6,
    rebuiltTitleFee: 6,
    dmvUrl: "https://dmv.utah.gov/mved/dealers-overview/salvage/",
  },

  NM: {
    state: "New Mexico",
    stateCode: "NM",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Complete Affirmation for Reconstructed Vehicle (MVD10015), Vehicle Equipment Affirmation (MVD10053), VIN Affidavit. Provide existing title, bills of sale for all parts, proof of insurance, weight certificate. Level 3 VIN inspection required.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. Level 3 VIN inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "New Mexico MVD",
    inspectionNotes:
      "Level 3 VIN inspection required for all reconstructed vehicles. Multiple forms required (MVD10015, MVD10053). Weight certificate required.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Level 3 VIN inspection (most thorough level)",
      "Weight certificate required",
      "Multiple affirmation forms required",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Albuquerque has moderate demand. Smaller market. Dry climate vehicles are valued.",
    flipperRating: "moderate",
    flipperNotes:
      "Level 3 inspection is thorough. Multiple forms add paperwork. Moderate market. Dry climate is a plus for vehicle condition.",
    salvageTitleFee: 18,
    rebuiltTitleFee: 18,
    dmvUrl: "https://www.mvd.newmexico.gov/chapter-9-reconstructed-rebuilt-salvage-and-nonrepairable-vehicles/",
  },

  ID: {
    state: "Idaho",
    stateCode: "ID",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Pass inspection at local Idaho DMV office. Provide salvage certificate and Form ITD 3311. Pay $14 inspection fee.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. Idaho DMV inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 14,
    inspectionAgency: "Idaho DMV office",
    inspectionNotes:
      "$14 inspection fee at local DMV office. One of the cheapest in the nation. Simple process.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "$14 is among the cheapest inspection fees nationally",
      "Inspection done at DMV office (convenient)",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Boise metro growing rapidly. Smaller market but increasing demand.",
    flipperRating: "friendly",
    flipperNotes:
      "Super cheap $14 inspection at DMV. Simple process. Boise is a growing market.",
    salvageTitleFee: 14,
    rebuiltTitleFee: 14,
    dmvUrl: "https://www.dmv.org/id-idaho/salvaged-vehicles.php",
  },

  HI: {
    state: "Hawaii",
    stateCode: "HI",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Vehicle MUST be repaired by an approved Salvage Repair Dealer (bonded, registered/certified). Dealer signs certificate of inspection attesting to manufacturer repair procedures. Submit salvage certificate + inspection certificate to register.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage but vehicle must be repaired by Hawaii-approved salvage repair dealer.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 100,
    inspectionAgency: "Approved Salvage Repair Dealer (bonded)",
    inspectionNotes:
      "You CANNOT repair your own salvage vehicle in Hawaii. Must use an approved, bonded Salvage Repair Dealer who certifies repairs to manufacturer specs. This is unique among states.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions:
      "Vehicle MUST be repaired by approved, bonded salvage repair dealer. No DIY or independent shop repairs allowed.",
    specialRestrictions: [
      "CANNOT repair your own salvage vehicle",
      "Must use approved bonded salvage repair dealer",
      "Dealer must certify repairs to manufacturer specifications",
      "Island logistics add shipping costs for parts and vehicles",
    ],
    titleImpactPct: { salvage: 55, rebuilt: 30 },
    resaleNotes:
      "Limited market due to island geography. High cost of living means higher vehicle prices but also higher repair costs. Import logistics are a challenge.",
    flipperRating: "strict",
    flipperNotes:
      "Cannot DIY repairs. Must use approved dealer. Island logistics add massive costs. Not practical for most flippers unless Hawaii-based.",
    salvageTitleFee: 5,
    rebuiltTitleFee: 5,
    dmvUrl: "https://dmv.hawaii.gov",
  },

  MD: {
    state: "Maryland",
    stateCode: "MD",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Schedule salvage vehicle inspection online through MSP Salvage Scheduling System. Pass Maryland State Police inspection. Pass safety and emissions inspections at MVA.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts most out-of-state salvage/rebuilt titles but does NOT accept NY salvage certificates. Out-of-state rebuilt brands still require MD salvage inspection.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 100,
    inspectionAgency: "Maryland State Police (MSP) + MVA",
    inspectionNotes:
      "Two-stage: MSP salvage inspection (scheduled online) + MVA safety/emissions inspection. MD requires its own inspection even for vehicles with out-of-state rebuilt titles. Does not accept NY salvage certificates.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Does NOT accept New York salvage certificates",
      "Out-of-state rebuilt titles still need MD salvage inspection",
      "Two-stage inspection (MSP + MVA)",
      "Online scheduling through MSP system",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Baltimore and DC suburbs have strong demand. Proximity to DC market is valuable.",
    flipperRating: "moderate",
    flipperNotes:
      "Two-stage inspection adds time. Does not accept NY salvage certificates (avoid if buying in NY). DC-area market demand is strong. Moderate overall.",
    salvageTitleFee: 100,
    rebuiltTitleFee: 100,
    dmvUrl: "https://mva.maryland.gov/about-mva/Pages/info/27300/27300-42T.aspx",
  },

  CT: {
    state: "Connecticut",
    stateCode: "CT",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Complete Salvaged Vehicle Repair Report (K-186). Vehicle must be brought to DMV on flatbed or car carrier (cannot be towed or driven). Pass DMV inspection.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "CT salvage titles are not accepted by some states (e.g., MA does not accept CT salvage stamps).",
    inspectionRequired: true,
    inspectionType: "safety",
    inspectionCost: 88,
    inspectionAgency: "Connecticut DMV",
    inspectionNotes:
      "$88 inspection fee. Vehicle must arrive at DMV on flatbed or car carrier - NO wheels may touch the ground. Private individuals cannot drive or tow the vehicle to DMV. This adds significant logistical cost.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Vehicle must arrive on FLATBED (no towing, no driving)",
      "No wheel of vehicle may touch ground during transport to DMV",
      "This adds $150-300+ in flatbed costs",
      "CT salvage stamps not accepted by all states (e.g., MA)",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Hartford and New Haven have moderate demand. Proximity to NY market helps.",
    flipperRating: "strict",
    flipperNotes:
      "Flatbed requirement adds $150-300+ per vehicle. Cannot drive or tow to inspection. $88 fee on top. CT salvage not accepted by all states. Difficult for volume flipping.",
    salvageTitleFee: 25,
    rebuiltTitleFee: 25,
    dmvUrl: "https://portal.ct.gov/-/media/dmv/20/29/b256pdf.pdf",
  },

  MA: {
    state: "Massachusetts",
    stateCode: "MA",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Submit Application for Inspection of Salvaged Motor Vehicle with $50 fee. Pass MA State Police Salvage Unit inspection (partial or full, randomly assigned). Then pass separate safety inspection.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Does NOT accept Connecticut salvage stamps. Must obtain MA salvage title first before inspection.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "Massachusetts State Police Salvage Unit",
    inspectionNotes:
      "$50 application/inspection fee + $50 title fee. Random assignment of partial vs full inspection. Salvage inspection is NOT a safety inspection - separate safety inspection required after. Does not accept CT salvage stamps.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Does NOT accept CT salvage stamps",
      "Random partial vs full inspection assignment",
      "Separate safety inspection required after salvage inspection",
      "Must obtain MA salvage title before inspection",
    ],
    titleImpactPct: { salvage: 55, rebuilt: 30 },
    resaleNotes:
      "Boston metro has strong demand but rebuilt title stigma is higher in New England. Insurance can be difficult.",
    flipperRating: "moderate",
    flipperNotes:
      "Random inspection type adds uncertainty. Does not accept CT salvage. Two separate inspections needed. Boston market is good but stigma is higher.",
    salvageTitleFee: 50,
    rebuiltTitleFee: 50,
    dmvUrl: "https://www.mass.gov/doc/application-for-inspection-of-a-salvaged-motor-vehicle/download",
  },

  DE: {
    state: "Delaware",
    stateCode: "DE",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Present to Delaware State Police Auto Theft Unit for inspection (no appointment needed but check schedule). Pass DSP inspection to get MV214 form. Then pass DMV safety and emissions inspections. Apply for title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. DE inspections required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 75,
    inspectionAgency: "Delaware State Police Auto Theft Unit + DMV",
    inspectionNotes:
      "$35 salvage fee + inspection costs. Two-stage: DSP Auto Theft Unit (walk-in, check schedule) + DMV safety/emissions. No appointment needed for DSP but schedule varies.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Two-stage inspection (State Police + DMV)",
      "No appointment for State Police but check schedule",
      "Safety AND emissions inspections required",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Small state but proximity to Philadelphia and Baltimore markets adds value. No sales tax on vehicles under certain conditions.",
    flipperRating: "moderate",
    flipperNotes:
      "Two-stage inspection adds time. Small local market but good proximity to PA/MD/NJ. No sales tax advantage for vehicle purchases.",
    salvageTitleFee: 35,
    rebuiltTitleFee: 35,
    dmvUrl: "https://dmv.de.gov/VehicleServices/titles/index.shtml?dc=ve_title_salvage",
  },

  NH: {
    state: "New Hampshire",
    stateCode: "NH",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Get salvage certificate ($10). Repair vehicle. Call Title Bureau to schedule salvage inspection appointment ($60). Pass salvage inspection and get DSMV 547 report. Salvage decal permanently attached. Then pass separate safety inspection within 10 days of registration.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. NH inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 60,
    inspectionAgency: "NH DMV Title Bureau + safety inspection station",
    inspectionNotes:
      "$60 salvage inspection fee (Visa/MC only for scheduling). Verifies VIN and that insurance-listed damage has been repaired. Salvage decal permanently attached. Separate safety inspection required within 10 days of registration.",
    titleBrand: "REBUILT VEHICLE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "No sales tax in NH (advantage for buying vehicles)",
      "Credit card only for scheduling ($60 fee)",
      "Separate safety inspection within 10 days of registration",
      "Permanent salvage decal attached to vehicle",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Small market but no sales tax attracts buyers from neighboring states.",
    flipperRating: "moderate",
    flipperNotes:
      "No sales tax is a significant advantage. $60 fee is reasonable. Small local market but attracts cross-border buyers from MA, VT, ME.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 25,
    dmvUrl: "https://www.dmv.nh.gov/vehicles-boats-and-titles/salvage-and-rebuilt-vehicles",
  },

  ME: {
    state: "Maine",
    stateCode: "ME",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Get certificate of salvage ($33 BMV fee). Repair vehicle. Pass Maine State Police inspection at licensed inspection station. Apply for restored salvage title with documentation.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. ME inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "Maine State Police at licensed inspection stations",
    inspectionNotes:
      "Inspection covers vehicle and component parts verification. Not mandatory for obtaining salvage certificate (only for rebuilt). Titling fees plus inspection fees apply.",
    titleBrand: "RESTORED SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Salvage certificate does not require inspection",
      "Inspection only needed when converting to restored salvage",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Small market. Portland area has some demand. Rural areas have lower demand.",
    flipperRating: "moderate",
    flipperNotes:
      "Straightforward process. Small market limits volume. Moderate fees.",
    salvageTitleFee: 33,
    rebuiltTitleFee: 33,
    dmvUrl: "https://www.dmv.com/me/maine/salvage-title",
  },

  VT: {
    state: "Vermont",
    stateCode: "VT",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Apply for salvage title within 15 days of total loss settlement. Repair vehicle. Schedule anti-theft and safety inspections with VT DMV. Pass both. Apply for prior salvage title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. VT inspections required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "Vermont DMV authorized representatives",
    inspectionNotes:
      "Anti-theft and safety inspections performed by VT DMV authorized representatives. Call (802) 828-2000 for scheduling.",
    titleBrand: "PRIOR SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Must apply for salvage title within 15 days of total loss settlement",
      "Vermont is known for flexible vehicle registration (no title for 15+ year vehicles)",
      "VT registration loophole popular with out-of-state buyers",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Very small market but VT registration is popular for out-of-state vehicles due to flexible rules for older vehicles.",
    flipperRating: "moderate",
    flipperNotes:
      "Famous for flexible registration on older vehicles (no title needed for 15+ year vehicles). Useful as a registration state but tiny local market.",
    salvageTitleFee: 35,
    rebuiltTitleFee: 35,
    dmvUrl: "https://dmv.vermont.gov/tax-title/vehicle-title/salvage-or-rebuilt-title",
  },

  WV: {
    state: "West Virginia",
    stateCode: "WV",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Take pre-repair photos (all 4 sides). Repair vehicle. Pass safety inspection at WVSP-licensed station ($14.66 max). Then pass DMV reconstructed vehicle inspection ($35). Apply for rebuilt title at same DMV office.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. WV inspections required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "WV State Police safety station + WV DMV",
    inspectionNotes:
      "Two inspections required: safety inspection ($14.66 max) then DMV reconstructed vehicle inspection ($35). Pre-repair photos required from all 4 sides. Title application at same DMV office as inspection.",
    titleBrand: "RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Two-stage inspection (safety + reconstructed vehicle)",
      "Pre-repair photos from all 4 sides required",
      "Flood and fire damage separately branded",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Charleston area has moderate demand. Smaller market overall. Cross-border sales to VA/PA/OH are common.",
    flipperRating: "moderate",
    flipperNotes:
      "Low combined fees (~$50). Two inspections add time. Small market but central location for cross-border sales.",
    salvageTitleFee: 23,
    rebuiltTitleFee: 23,
    dmvUrl: "https://transportation.wv.gov/DMV/DMVFormSearch/How-to-Title-a-Reconstructed-Vehicle.pdf",
  },

  MT: {
    state: "Montana",
    stateCode: "MT",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Complete VIN inspection (Stage II or Stage III depending on age). Apply for rebuilt title at MVD. Pay $18.50 inspection + $10 title fee.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes:
      "Accepts out-of-state salvage. Montana is popular for LLC vehicle registrations from out of state.",
    inspectionRequired: true,
    inspectionType: "VIN only",
    inspectionCost: 19,
    inspectionAgency: "Montana MVD or authorized law enforcement",
    inspectionNotes:
      "$18.50 VIN inspection. Stage II or Stage III depending on vehicle age. $5 salvage certificate + $10 title fee. Montana LLC registration is popular for avoiding state taxes.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "No sales tax in Montana",
      "Popular for LLC vehicle registrations from other states",
      "VIN inspection stages vary by vehicle age",
    ],
    titleImpactPct: { salvage: 40, rebuilt: 15 },
    resaleNotes:
      "Small local market but Montana LLC registrations are popular nationally. No sales tax is a major draw.",
    flipperRating: "friendly",
    flipperNotes:
      "No sales tax. Very low fees ($19 inspection, $10 title). Montana LLC registration trick is widely used. Small local market but national appeal for registration purposes.",
    salvageTitleFee: 5,
    rebuiltTitleFee: 10,
    dmvUrl: "https://mvdmt.gov/vin-inspections/",
  },

  WY: {
    state: "Wyoming",
    stateCode: "WY",
    totalLossThreshold: "75% of ACV",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Bring to law enforcement for VIN and rebuilt salvage decal inspection. Complete Certification of Correct VIN Number form. Pay $10 inspection fee + $15 title fee.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. WY inspection required.",
    inspectionRequired: true,
    inspectionType: "VIN only",
    inspectionCost: 10,
    inspectionAgency: "Wyoming law enforcement",
    inspectionNotes:
      "$10 for single or combined inspection. VIN verification and rebuilt salvage decal check. $15 title fee. Very simple and cheap process.",
    titleBrand: "REBUILT SALVAGE",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Very low fees ($10 inspection + $15 title)",
      "Simple VIN-only inspection",
    ],
    titleImpactPct: { salvage: 40, rebuilt: 15 },
    resaleNotes:
      "Very small market. Most sales would be cross-state.",
    flipperRating: "friendly",
    flipperNotes:
      "Rock-bottom fees ($25 total). VIN-only inspection. Tiny local market but great for titling purposes if you can sell elsewhere.",
    salvageTitleFee: 15,
    rebuiltTitleFee: 15,
    dmvUrl: "https://www.dmv.com/wy/wyoming/salvage-title",
  },

  ND: {
    state: "North Dakota",
    stateCode: "ND",
    totalLossThreshold: "75% of retail value",
    totalLossMethod: "percentage",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Apply for regular certificate of title with 'previously salvaged' notation. Standard process.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage.",
    inspectionRequired: true,
    inspectionType: "VIN only",
    inspectionCost: 25,
    inspectionAgency: "North Dakota Highway Patrol or authorized inspector",
    inspectionNotes:
      "VIN inspection and verification. 'Previously salvaged' notation on all subsequent titles. Relatively simple process.",
    titleBrand: "PREVIOUSLY SALVAGED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "'Previously salvaged' on all subsequent titles",
      "Regular certificate of title issued (not a separate brand type)",
    ],
    titleImpactPct: { salvage: 40, rebuilt: 15 },
    resaleNotes:
      "Small market. Fargo/Bismarck have moderate demand. Oil industry activity can boost vehicle demand.",
    flipperRating: "friendly",
    flipperNotes:
      "Gets a regular title with just a notation. Simple process. Low fees. Tiny market but good for titling.",
    salvageTitleFee: 5,
    rebuiltTitleFee: 5,
    dmvUrl: "https://codes.findlaw.com/nd/title-39-motor-vehicles/nd-cent-code-sect-39-05-20-2/",
  },

  SD: {
    state: "South Dakota",
    stateCode: "SD",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Pay $25 inspection fee + $10 title fee. Pass inspection. Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. SD inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 25,
    inspectionAgency: "South Dakota Highway Patrol or authorized inspector",
    inspectionNotes:
      "$25 inspection fee + $10 title fee. Standard inspection process.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "No state vehicle inspections (no annual/biennial inspection)",
      "No emissions testing",
    ],
    titleImpactPct: { salvage: 40, rebuilt: 15 },
    resaleNotes:
      "Small market. Sioux Falls has moderate demand. No state income tax.",
    flipperRating: "friendly",
    flipperNotes:
      "Low fees ($35 total). No annual inspections or emissions. No state income tax. Small market but favorable conditions.",
    salvageTitleFee: 10,
    rebuiltTitleFee: 10,
    dmvUrl: "https://dor.sd.gov/individuals/motor-vehicle/rebuilt-vehicles/",
  },

  AK: {
    state: "Alaska",
    stateCode: "AK",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Complete Reconstructed Vehicle Affidavit (Form 829). Pass inspection by Alaska DMV representative or approved law enforcement officer. Apply for rebuilt salvage or reconstructed vehicle title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. AK inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 50,
    inspectionAgency: "Alaska DMV or approved law enforcement",
    inspectionNotes:
      "$15 salvage title fee + inspection and registration fees. Two possible designations: 'Rebuilt Salvage' (recognizable reconstruction) or 'Reconstructed Vehicle' (more extensive alteration).",
    titleBrand: "REBUILT SALVAGE / RECONSTRUCTED",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Two possible title brands: Rebuilt Salvage vs Reconstructed Vehicle",
      "Remote location adds significant shipping costs",
      "Limited inspection stations in rural areas",
    ],
    titleImpactPct: { salvage: 45, rebuilt: 20 },
    resaleNotes:
      "Very small market. Anchorage and Fairbanks only viable areas. Extreme shipping costs limit practicality.",
    flipperRating: "strict",
    flipperNotes:
      "Remote location makes shipping prohibitively expensive for most flippers. Limited local market. Only practical if Alaska-based.",
    salvageTitleFee: 15,
    rebuiltTitleFee: 15,
    dmvUrl: "https://dmv.alaska.gov/vehicle-services/salvage-vehicle-titles/",
  },

  RI: {
    state: "Rhode Island",
    stateCode: "RI",
    totalLossThreshold: "TLF (repair + salvage value > ACV)",
    totalLossMethod: "TLF",
    canRegisterSalvage: false,
    canConvertToRebuilt: true,
    conversionProcess:
      "Repair vehicle. Pass inspection. Pay $57.50 inspection fee. Apply for rebuilt title.",
    acceptsOutOfStateSalvage: true,
    acceptsNonRepairable: false,
    outOfStateNotes: "Accepts out-of-state salvage. RI inspection required.",
    inspectionRequired: true,
    inspectionType: "both",
    inspectionCost: 58,
    inspectionAgency: "Rhode Island DMV or authorized inspector",
    inspectionNotes:
      "$57.50 inspection fee. Standard salvage vehicle inspection process.",
    titleBrand: "REBUILT",
    issuesPartsOnly: false,
    issuesCertOfDestruction: true,
    nonRepairableLabel: "Non-Repairable",
    floodDamageDisclosure: true,
    ageExemptions: null,
    dealerOnlyRestrictions: null,
    specialRestrictions: [
      "Small state but close to MA, CT, NY markets",
    ],
    titleImpactPct: { salvage: 50, rebuilt: 25 },
    resaleNotes:
      "Tiny local market but proximity to Boston/NYC metros provides sales outlets.",
    flipperRating: "moderate",
    flipperNotes:
      "Moderate fees. Small market but good proximity to major metros. Straightforward process.",
    salvageTitleFee: 52,
    rebuiltTitleFee: 52,
    dmvUrl: "https://www.dmv.com/ri/rhode-island/salvage-title",
  },
};

// ============================================
// Helper functions
// ============================================

export function getStateLaw(stateCode: string): StateTitleLaw | null {
  return STATE_TITLE_LAWS[stateCode.toUpperCase()] ?? null;
}

export function getFlipperFriendlyStates(): StateTitleLaw[] {
  return Object.values(STATE_TITLE_LAWS).filter(
    (s) => s.flipperRating === "friendly"
  );
}

export function getStrictStates(): StateTitleLaw[] {
  return Object.values(STATE_TITLE_LAWS).filter(
    (s) => s.flipperRating === "strict"
  );
}

export function getStatesWithNoInspection(): StateTitleLaw[] {
  return Object.values(STATE_TITLE_LAWS).filter(
    (s) => !s.inspectionRequired || s.inspectionCost === 0
  );
}

export function getStatesWithAgeExemptions(): StateTitleLaw[] {
  return Object.values(STATE_TITLE_LAWS).filter(
    (s) => s.ageExemptions !== null
  );
}

export function getTitleImpact(
  stateCode: string,
  titleType: "salvage" | "rebuilt"
): number {
  const law = getStateLaw(stateCode);
  if (!law) return titleType === "salvage" ? 50 : 25; // defaults
  return law.titleImpactPct[titleType];
}

export function getRebuiltInspectionCost(stateCode: string): number {
  const law = getStateLaw(stateCode);
  return law?.inspectionCost ?? 75; // $75 default
}

export function getAllStateCodes(): string[] {
  return Object.keys(STATE_TITLE_LAWS);
}

// ============================================
// Summary tables for quick reference
// ============================================

export const FLIPPER_FRIENDLY_STATES = [
  "TX", "FL", "IL", "NC", "SC", "TN", "MO", "IN", "AZ", "OK",
  "AR", "NE", "ID", "CO", "LA", "MT", "WY", "ND", "SD",
] as const;

export const STRICT_STATES = [
  "CA", "NY", "CT", "HI", "AK",
] as const;

export const STATES_WITH_AGE_EXEMPTIONS = {
  IL: "9+ model years: no inspection required",
  NC: "6+ model years: unbranded title with affidavit",
  OK: "10+ model years: regular (clean) title, no inspection",
  AR: "7+ model years: fully exempt from salvage requirements",
  MO: "6+ years: salvage title application is optional",
  NJ: "Older vehicles may be exempt from inspection",
  VA: "10+ years, <$10k value, licensed rebuilder 10+ years: exempt from DMV examination",
  NV: "5 model years or newer require pre-authorization (older exempt from this step)",
} as const;

export const CHEAPEST_INSPECTIONS = [
  { state: "NE", cost: 10, notes: "VIN-only, simplest in nation" },
  { state: "WY", cost: 10, notes: "VIN-only, combined inspection" },
  { state: "ID", cost: 14, notes: "At DMV office, convenient" },
  { state: "IN", cost: 15, notes: "Full state police inspection at $15" },
  { state: "MT", cost: 19, notes: "VIN inspection, no sales tax state" },
  { state: "LA", cost: 20, notes: "Physical inspection with affidavit" },
  { state: "SC", cost: 25, notes: "SCDMV inspector, full check" },
  { state: "OK", cost: 25, notes: "Licensed operator (10yr+ vehicles exempt)" },
  { state: "SD", cost: 25, notes: "Standard inspection" },
] as const;

export const MOST_EXPENSIVE_INSPECTIONS = [
  { state: "CA", cost: 250, notes: "CHP + brake/lamp + smog + VIN. Total $250-600+" },
  { state: "NY", cost: 200, notes: "Mail-only, repairs must match claim" },
  { state: "NJ", cost: 200, notes: "State facility only" },
  { state: "VA", cost: 125, notes: "Safety + DMV examination" },
  { state: "GA", cost: 100, notes: "Must tow to inspection, rebuilt in-state only" },
  { state: "HI", cost: 100, notes: "Must use approved bonded dealer" },
  { state: "MD", cost: 100, notes: "State Police + MVA two-stage" },
  { state: "MI", cost: 100, notes: "Licensed mechanic required" },
  { state: "IL", cost: 94, notes: "Dual inspection for 8yr or newer" },
  { state: "AL", cost: 90, notes: "Dealer license needed if not prior owner" },
] as const;

export const NO_SALES_TAX_STATES = [
  "MT", "NH", "OR", "DE", "AK",
] as const;
