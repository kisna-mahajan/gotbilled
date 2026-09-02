export const PROCEDURE_TYPES: Record<string, string> = {
  cardiac_surgery: "Cardiac Surgery",
  ortho_joint: "Ortho / Joint Replacement",
  maternity: "Maternity / Delivery",
  cancer_treatment: "Cancer Treatment",
  kidney_dialysis: "Kidney / Dialysis",
  eye_surgery: "Eye Surgery (Cataract, LASIK)",
  dental: "Dental",
  diagnostic_scan: "Diagnostic Scan (MRI, CT, PET)",
  general_surgery: "General Surgery",
  ent: "ENT Procedures",
  gynaecology: "Gynaecology",
  urology: "Urology",
  other: "Other",
};

export const CITY_STATE_MAP: Record<string, string> = {
  mumbai: "Maharashtra",
  delhi: "Delhi",
  bengaluru: "Karnataka",
  hyderabad: "Telangana",
  chennai: "Tamil Nadu",
  kolkata: "West Bengal",
  pune: "Maharashtra",
  ahmedabad: "Gujarat",
  jaipur: "Rajasthan",
  lucknow: "Uttar Pradesh",
  surat: "Gujarat",
  kanpur: "Uttar Pradesh",
  nagpur: "Maharashtra",
  indore: "Madhya Pradesh",
  thane: "Maharashtra",
  bhopal: "Madhya Pradesh",
  visakhapatnam: "Andhra Pradesh",
  patna: "Bihar",
  vadodara: "Gujarat",
  ghaziabad: "Uttar Pradesh",
  ludhiana: "Punjab",
  agra: "Uttar Pradesh",
  nashik: "Maharashtra",
  ranchi: "Jharkhand",
  faridabad: "Haryana",
  meerut: "Uttar Pradesh",
  rajkot: "Gujarat",
  varanasi: "Uttar Pradesh",
  srinagar: "Jammu & Kashmir",
  aurangabad: "Maharashtra",
  dhanbad: "Jharkhand",
  amritsar: "Punjab",
  allahabad: "Uttar Pradesh",
  gwalior: "Madhya Pradesh",
  jabalpur: "Madhya Pradesh",
  coimbatore: "Tamil Nadu",
  vijayawada: "Andhra Pradesh",
  jodhpur: "Rajasthan",
  madurai: "Tamil Nadu",
  raipur: "Chhattisgarh",
  kochi: "Kerala",
  chandigarh: "Chandigarh",
  guwahati: "Assam",
  thiruvananthapuram: "Kerala",
  dehradun: "Uttarakhand",
  mysuru: "Karnataka",
  mangaluru: "Karnataka",
  noida: "Uttar Pradesh",
  gurugram: "Haryana",
  navi_mumbai: "Maharashtra",
  bhubaneswar: "Odisha",
  tiruchirappalli: "Tamil Nadu",
  salem: "Tamil Nadu",
  warangal: "Telangana",
  guntur: "Andhra Pradesh",
  bikaner: "Rajasthan",
  kozhikode: "Kerala",
  hubli: "Karnataka",
  bareilly: "Uttar Pradesh",
  moradabad: "Uttar Pradesh",
};

export const HOSPITAL_TIERS = [
  "corporate_chain",
  "private_standalone",
  "government",
  "trust",
] as const;

export const INSURANCE_OPTIONS = ["yes", "no", "partial"] as const;

export const MIN_AMOUNT = 100;
export const MAX_AMOUNT = 5_000_000;
export const MAX_STAY_DAYS = 365;
export const MAX_SURPRISE_ITEMS = 10;
export const MAX_SURPRISE_DESC_LENGTH = 200;
export const RATE_LIMIT_PER_DAY = 5;
export const MIN_FORM_TIME_MS = 5000;
export const MIN_AGGREGATION_THRESHOLD = 5;
