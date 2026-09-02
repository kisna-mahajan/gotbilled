import { ReportInput } from "./types";
import {
  PROCEDURE_TYPES,
  CITY_STATE_MAP,
  HOSPITAL_TIERS,
  INSURANCE_OPTIONS,
  MIN_AMOUNT,
  MAX_AMOUNT,
  MAX_STAY_DAYS,
  MAX_SURPRISE_ITEMS,
  MAX_SURPRISE_DESC_LENGTH,
  MIN_FORM_TIME_MS,
} from "./data";

interface ValidationResult {
  valid: boolean;
  error?: string;
  flagged: boolean;
  flagReasons: string[];
}

export function validateReport(input: ReportInput): ValidationResult {
  const flagReasons: string[] = [];

  if (input.honeypot) {
    return { valid: false, error: "Invalid submission", flagged: false, flagReasons: [] };
  }

  if (input.form_loaded_at) {
    const elapsed = Date.now() - input.form_loaded_at;
    if (elapsed < MIN_FORM_TIME_MS) {
      return { valid: false, error: "Please take your time filling the form", flagged: false, flagReasons: [] };
    }
  }

  if (!input.procedure_type || !(input.procedure_type in PROCEDURE_TYPES)) {
    return { valid: false, error: "Invalid procedure type", flagged: false, flagReasons: [] };
  }

  if (input.procedure_type === "other" && !input.procedure_other?.trim()) {
    return { valid: false, error: "Please specify the procedure", flagged: false, flagReasons: [] };
  }

  if (!input.city || !(input.city in CITY_STATE_MAP)) {
    return { valid: false, error: "Invalid city", flagged: false, flagReasons: [] };
  }

  if (!HOSPITAL_TIERS.includes(input.hospital_tier as typeof HOSPITAL_TIERS[number])) {
    return { valid: false, error: "Invalid hospital tier", flagged: false, flagReasons: [] };
  }

  if (!INSURANCE_OPTIONS.includes(input.insurance_used as typeof INSURANCE_OPTIONS[number])) {
    return { valid: false, error: "Invalid insurance option", flagged: false, flagReasons: [] };
  }

  if (
    typeof input.quoted_amount !== "number" ||
    input.quoted_amount < MIN_AMOUNT ||
    input.quoted_amount > MAX_AMOUNT ||
    !Number.isInteger(input.quoted_amount)
  ) {
    return { valid: false, error: `Quoted amount must be a whole number between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString("en-IN")}`, flagged: false, flagReasons: [] };
  }

  if (
    typeof input.final_amount !== "number" ||
    input.final_amount < MIN_AMOUNT ||
    input.final_amount > MAX_AMOUNT ||
    !Number.isInteger(input.final_amount)
  ) {
    return { valid: false, error: `Final amount must be a whole number between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString("en-IN")}`, flagged: false, flagReasons: [] };
  }

  const currentYear = new Date().getFullYear();
  if (
    typeof input.procedure_year !== "number" ||
    input.procedure_year < 2015 ||
    input.procedure_year > currentYear ||
    !Number.isInteger(input.procedure_year)
  ) {
    return { valid: false, error: `Procedure year must be between 2015 and ${currentYear}`, flagged: false, flagReasons: [] };
  }

  if (input.stay_days !== undefined && input.stay_days !== null) {
    if (
      typeof input.stay_days !== "number" ||
      input.stay_days < 0 ||
      input.stay_days > MAX_STAY_DAYS ||
      !Number.isInteger(input.stay_days)
    ) {
      return { valid: false, error: "Stay days must be 0–365", flagged: false, flagReasons: [] };
    }
  }

  if (input.surprise_charges) {
    if (!Array.isArray(input.surprise_charges)) {
      return { valid: false, error: "Invalid surprise charges format", flagged: false, flagReasons: [] };
    }
    if (input.surprise_charges.length > MAX_SURPRISE_ITEMS) {
      return { valid: false, error: `Maximum ${MAX_SURPRISE_ITEMS} surprise charge items allowed`, flagged: false, flagReasons: [] };
    }
    for (const item of input.surprise_charges) {
      if (!item.description?.trim() || item.description.length > MAX_SURPRISE_DESC_LENGTH) {
        return { valid: false, error: `Surprise charge description must be 1–${MAX_SURPRISE_DESC_LENGTH} characters`, flagged: false, flagReasons: [] };
      }
      if (typeof item.amount !== "number" || item.amount < 1 || !Number.isInteger(item.amount)) {
        return { valid: false, error: "Surprise charge amount must be a positive whole number", flagged: false, flagReasons: [] };
      }
    }
  }

  const surprisePct = ((input.final_amount - input.quoted_amount) / input.quoted_amount) * 100;

  if (input.final_amount < input.quoted_amount * 0.3) {
    flagReasons.push("final_amount_suspiciously_low");
  }

  if (surprisePct > 500) {
    flagReasons.push("surprise_pct_over_500");
  }

  if (input.quoted_amount === input.final_amount) {
    flagReasons.push("amounts_identical");
  }

  return { valid: true, flagged: flagReasons.length > 0, flagReasons };
}
