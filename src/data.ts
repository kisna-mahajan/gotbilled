export const PROCEDURE_CATEGORIES: Record<string, { name: string; procedures: Record<string, string> }> = {
  cardiac: {
    name: "Heart & Cardiac",
    procedures: {
      coronary_bypass: "Coronary Bypass Surgery (CABG)",
      angioplasty_stent: "Angioplasty with Stent",
      valve_replacement: "Heart Valve Replacement",
      pacemaker_implant: "Pacemaker / ICD Implantation",
      coronary_angiography: "Coronary Angiography (Diagnostic)",
      heart_attack_treatment: "Heart Attack Emergency Treatment",
    },
  },
  orthopaedic: {
    name: "Bone, Joint & Spine",
    procedures: {
      knee_replacement: "Knee Replacement",
      hip_replacement: "Hip Replacement",
      acl_reconstruction: "ACL / Ligament Reconstruction",
      spinal_fusion: "Spinal Fusion Surgery",
      spinal_disc_surgery: "Slipped Disc Surgery (Discectomy)",
      knee_arthroscopy: "Knee Arthroscopy",
      shoulder_repair: "Rotator Cuff / Shoulder Repair",
      fracture_fixation: "Fracture Fixation (Plates & Screws)",
    },
  },
  general_surgery: {
    name: "General Surgery",
    procedures: {
      appendectomy: "Appendix Removal (Appendectomy)",
      hernia_repair: "Hernia Repair (Inguinal / Umbilical)",
      gallbladder_removal: "Gallbladder Removal (Cholecystectomy)",
      thyroidectomy: "Thyroid Removal (Thyroidectomy)",
      hemorrhoid_surgery: "Piles / Hemorrhoid Surgery",
      lipoma_removal: "Lump / Lipoma Removal",
      abscess_drainage: "Abscess Drainage",
    },
  },
  neuro: {
    name: "Brain & Neurosurgery",
    procedures: {
      brain_tumor_surgery: "Brain Tumor Removal",
      craniotomy: "Craniotomy (Brain Surgery)",
      vp_shunt: "VP Shunt (Hydrocephalus)",
      epilepsy_surgery: "Epilepsy Surgery",
      stroke_treatment: "Stroke Emergency Treatment",
    },
  },
  maternity: {
    name: "Maternity & Fertility",
    procedures: {
      normal_delivery: "Normal Vaginal Delivery",
      c_section: "Caesarean Section (C-Section)",
      high_risk_delivery: "High-Risk Delivery with NICU",
      ivf_cycle: "IVF Cycle (Test Tube Baby)",
      iui: "IUI (Intrauterine Insemination)",
    },
  },
  gynaecology: {
    name: "Gynaecology",
    procedures: {
      hysterectomy: "Uterus Removal (Hysterectomy)",
      fibroid_removal: "Fibroid Removal (Myomectomy)",
      ovarian_cyst_removal: "Ovarian Cyst Removal",
      dnc: "D&C (Dilation and Curettage)",
      ectopic_pregnancy: "Ectopic Pregnancy Surgery",
      tubectomy: "Laparoscopic Sterilization (Tubectomy)",
    },
  },
  cancer_treatment: {
    name: "Cancer Treatment",
    procedures: {
      chemotherapy_cycle: "Chemotherapy (Per Cycle)",
      radiation_therapy: "Radiation Therapy (Full Course)",
      mastectomy: "Breast Cancer Surgery (Mastectomy)",
      colorectal_cancer_surgery: "Colorectal Cancer Surgery",
      lung_cancer_surgery: "Lung Cancer Surgery",
      prostatectomy: "Prostate Cancer Surgery",
      immunotherapy: "Immunotherapy / Targeted Therapy",
    },
  },
  eye: {
    name: "Eye / Ophthalmology",
    procedures: {
      cataract_surgery: "Cataract Surgery (with Lens Implant)",
      lasik: "LASIK (Laser Vision Correction)",
      glaucoma_surgery: "Glaucoma Surgery",
      retinal_detachment: "Retinal Detachment Surgery",
      vitrectomy: "Vitrectomy (Retina Surgery)",
    },
  },
  ent: {
    name: "Ear, Nose & Throat (ENT)",
    procedures: {
      tonsillectomy: "Tonsil Removal (Tonsillectomy)",
      septoplasty: "Deviated Septum Surgery (Septoplasty)",
      sinus_surgery: "Sinus Surgery (FESS)",
      tympanoplasty: "Eardrum Repair (Tympanoplasty)",
      cochlear_implant: "Cochlear Implant",
      adenoidectomy: "Adenoid Removal",
    },
  },
  urology: {
    name: "Urology & Kidney",
    procedures: {
      kidney_stone_removal: "Kidney Stone Removal (ESWL / Laser)",
      turp: "Enlarged Prostate Surgery (TURP)",
      ureteroscopy: "Ureteroscopy / DJ Stenting",
      varicocele_surgery: "Varicocele Surgery",
      circumcision: "Circumcision",
    },
  },
  gastro: {
    name: "Stomach & Digestive",
    procedures: {
      upper_gi_endoscopy: "Upper GI Endoscopy",
      colonoscopy: "Colonoscopy",
      ercp: "ERCP (Bile Duct Procedure)",
      bariatric_surgery: "Weight Loss Surgery (Bariatric)",
      fistula_surgery: "Anal Fistula Surgery",
    },
  },
  diagnostic: {
    name: "Diagnostic Scans & Tests",
    procedures: {
      mri_scan: "MRI Scan",
      ct_scan: "CT Scan",
      pet_ct_scan: "PET-CT Scan",
      echocardiogram: "Echocardiogram (Heart Ultrasound)",
      biopsy: "Biopsy (Any Organ)",
      stress_test: "TMT / Cardiac Stress Test",
    },
  },
  dental: {
    name: "Dental",
    procedures: {
      root_canal: "Root Canal Treatment",
      dental_implant: "Dental Implant",
      wisdom_tooth_extraction: "Wisdom Tooth Extraction",
      dental_crown_bridge: "Dental Crown or Bridge",
      braces: "Braces / Orthodontic Treatment",
    },
  },
  transplant: {
    name: "Organ Transplant",
    procedures: {
      kidney_transplant: "Kidney Transplant",
      liver_transplant: "Liver Transplant",
      heart_transplant: "Heart Transplant",
      bone_marrow_transplant: "Bone Marrow Transplant",
      corneal_transplant: "Corneal Transplant (Eye)",
    },
  },
  dialysis_chronic: {
    name: "Dialysis & Chronic Care",
    procedures: {
      dialysis_session: "Dialysis Session (Hemodialysis)",
      av_fistula: "AV Fistula (Dialysis Access Surgery)",
      peritoneal_dialysis: "Peritoneal Dialysis Setup",
    },
  },
  cosmetic: {
    name: "Cosmetic & Elective",
    procedures: {
      rhinoplasty: "Nose Job (Rhinoplasty)",
      liposuction: "Liposuction",
      hair_transplant: "Hair Transplant",
      gynecomastia_surgery: "Gynecomastia (Male Breast Reduction)",
      tummy_tuck: "Tummy Tuck (Abdominoplasty)",
    },
  },
  emergency_trauma: {
    name: "Emergency & Trauma",
    procedures: {
      polytrauma: "Multiple Injury / Accident Trauma",
      burn_treatment: "Burn Treatment & Skin Grafting",
      head_injury: "Head Injury Treatment",
      snake_bite: "Snake Bite Treatment",
      poisoning: "Poisoning / Overdose Treatment",
    },
  },
  pediatric: {
    name: "Pediatric / Children",
    procedures: {
      cleft_palate_repair: "Cleft Lip / Palate Repair",
      pediatric_hernia: "Child Hernia Repair",
      congenital_heart_surgery: "Congenital Heart Defect Surgery",
      pyloric_stenosis: "Pyloric Stenosis Surgery (Infant)",
    },
  },
  vascular: {
    name: "Vascular & Veins",
    procedures: {
      varicose_veins: "Varicose Veins Surgery (Laser / RFA)",
      dvt_treatment: "DVT (Deep Vein Thrombosis) Treatment",
      aneurysm_repair: "Aneurysm Repair",
    },
  },
  pulmonology: {
    name: "Lung & Respiratory",
    procedures: {
      bronchoscopy: "Bronchoscopy",
      chest_tube: "Chest Tube / Pleural Drainage",
      sleep_study: "Sleep Study (Polysomnography)",
    },
  },
  mental_health: {
    name: "Mental Health",
    procedures: {
      psychiatric_admission: "Psychiatric Hospitalization",
      deaddiction: "De-addiction / Rehab Program",
    },
  },
};

export const PROCEDURE_TYPES: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(PROCEDURE_CATEGORIES).flatMap((cat) =>
      Object.entries(cat.procedures)
    )
  ),
  other: "Other",
};

export const CITY_STATE_MAP: Record<string, string> = {
  // ── Andaman & Nicobar Islands ──
  port_blair: "Andaman & Nicobar Islands",

  // ── Andhra Pradesh ──
  anantapur: "Andhra Pradesh",
  eluru: "Andhra Pradesh",
  guntur: "Andhra Pradesh",
  kadapa: "Andhra Pradesh",
  kakinada: "Andhra Pradesh",
  kurnool: "Andhra Pradesh",
  nellore: "Andhra Pradesh",
  ongole: "Andhra Pradesh",
  rajahmundry: "Andhra Pradesh",
  tirupati: "Andhra Pradesh",
  vijayawada: "Andhra Pradesh",
  visakhapatnam: "Andhra Pradesh",

  // ── Arunachal Pradesh ──
  itanagar: "Arunachal Pradesh",

  // ── Assam ──
  dibrugarh: "Assam",
  guwahati: "Assam",
  jorhat: "Assam",
  silchar: "Assam",
  tezpur: "Assam",

  // ── Bihar ──
  bhagalpur: "Bihar",
  darbhanga: "Bihar",
  gaya: "Bihar",
  muzaffarpur: "Bihar",
  patna: "Bihar",
  purnia: "Bihar",

  // ── Chandigarh ──
  chandigarh: "Chandigarh",

  // ── Chhattisgarh ──
  bhilai: "Chhattisgarh",
  bilaspur_cg: "Chhattisgarh",
  durg: "Chhattisgarh",
  korba: "Chhattisgarh",
  raipur: "Chhattisgarh",

  // ── Dadra & Nagar Haveli and Daman & Diu ──
  silvassa: "Dadra & Nagar Haveli and Daman & Diu",

  // ── Delhi ──
  delhi: "Delhi",

  // ── Goa ──
  madgaon: "Goa",
  panaji: "Goa",
  vasco_da_gama: "Goa",

  // ── Gujarat ──
  ahmedabad: "Gujarat",
  anand: "Gujarat",
  bhavnagar: "Gujarat",
  bharuch: "Gujarat",
  gandhinagar: "Gujarat",
  jamnagar: "Gujarat",
  junagadh: "Gujarat",
  mehsana: "Gujarat",
  navsari: "Gujarat",
  rajkot: "Gujarat",
  surat: "Gujarat",
  vadodara: "Gujarat",

  // ── Haryana ──
  ambala: "Haryana",
  faridabad: "Haryana",
  gurugram: "Haryana",
  hisar: "Haryana",
  karnal: "Haryana",
  panipat: "Haryana",
  rohtak: "Haryana",
  sonipat: "Haryana",
  yamunanagar: "Haryana",

  // ── Himachal Pradesh ──
  dharamshala: "Himachal Pradesh",
  shimla: "Himachal Pradesh",
  solan: "Himachal Pradesh",

  // ── Jammu & Kashmir ──
  jammu: "Jammu & Kashmir",
  srinagar: "Jammu & Kashmir",

  // ── Jharkhand ──
  bokaro: "Jharkhand",
  deoghar: "Jharkhand",
  dhanbad: "Jharkhand",
  hazaribagh: "Jharkhand",
  jamshedpur: "Jharkhand",
  ranchi: "Jharkhand",

  // ── Karnataka ──
  ballari: "Karnataka",
  belagavi: "Karnataka",
  bengaluru: "Karnataka",
  davanagere: "Karnataka",
  gulbarga: "Karnataka",
  hubli: "Karnataka",
  mangaluru: "Karnataka",
  mysuru: "Karnataka",
  shivamogga: "Karnataka",
  tumakuru: "Karnataka",
  udupi: "Karnataka",

  // ── Kerala ──
  alappuzha: "Kerala",
  kannur: "Kerala",
  kasaragod: "Kerala",
  kochi: "Kerala",
  kollam: "Kerala",
  kottayam: "Kerala",
  kozhikode: "Kerala",
  malappuram: "Kerala",
  palakkad: "Kerala",
  thiruvananthapuram: "Kerala",
  thrissur: "Kerala",

  // ── Ladakh ──
  leh: "Ladakh",

  // ── Madhya Pradesh ──
  bhopal: "Madhya Pradesh",
  dewas: "Madhya Pradesh",
  gwalior: "Madhya Pradesh",
  indore: "Madhya Pradesh",
  jabalpur: "Madhya Pradesh",
  rewa: "Madhya Pradesh",
  sagar: "Madhya Pradesh",
  satna: "Madhya Pradesh",
  ujjain: "Madhya Pradesh",

  // ── Maharashtra ──
  ahmednagar: "Maharashtra",
  akola: "Maharashtra",
  amravati: "Maharashtra",
  aurangabad: "Maharashtra",
  chandrapur: "Maharashtra",
  jalgaon: "Maharashtra",
  kolhapur: "Maharashtra",
  latur: "Maharashtra",
  mumbai: "Maharashtra",
  nagpur: "Maharashtra",
  nashik: "Maharashtra",
  navi_mumbai: "Maharashtra",
  nanded: "Maharashtra",
  panvel: "Maharashtra",
  pune: "Maharashtra",
  sangli: "Maharashtra",
  solapur: "Maharashtra",
  thane: "Maharashtra",

  // ── Manipur ──
  imphal: "Manipur",

  // ── Meghalaya ──
  shillong: "Meghalaya",

  // ── Mizoram ──
  aizawl: "Mizoram",

  // ── Nagaland ──
  dimapur: "Nagaland",
  kohima: "Nagaland",

  // ── Odisha ──
  berhampur: "Odisha",
  bhubaneswar: "Odisha",
  cuttack: "Odisha",
  rourkela: "Odisha",
  sambalpur: "Odisha",

  // ── Puducherry ──
  puducherry: "Puducherry",

  // ── Punjab ──
  amritsar: "Punjab",
  bathinda: "Punjab",
  jalandhar: "Punjab",
  ludhiana: "Punjab",
  mohali: "Punjab",
  patiala: "Punjab",
  pathankot: "Punjab",

  // ── Rajasthan ──
  ajmer: "Rajasthan",
  alwar: "Rajasthan",
  bharatpur: "Rajasthan",
  bhilwara: "Rajasthan",
  bikaner: "Rajasthan",
  jaipur: "Rajasthan",
  jodhpur: "Rajasthan",
  kota: "Rajasthan",
  sikar: "Rajasthan",
  udaipur: "Rajasthan",

  // ── Sikkim ──
  gangtok: "Sikkim",

  // ── Tamil Nadu ──
  chennai: "Tamil Nadu",
  coimbatore: "Tamil Nadu",
  dindigul: "Tamil Nadu",
  erode: "Tamil Nadu",
  madurai: "Tamil Nadu",
  nagercoil: "Tamil Nadu",
  salem: "Tamil Nadu",
  thanjavur: "Tamil Nadu",
  thoothukudi: "Tamil Nadu",
  tiruchirappalli: "Tamil Nadu",
  tirunelveli: "Tamil Nadu",
  tiruppur: "Tamil Nadu",
  vellore: "Tamil Nadu",

  // ── Telangana ──
  hyderabad: "Telangana",
  karimnagar: "Telangana",
  khammam: "Telangana",
  nizamabad: "Telangana",
  warangal: "Telangana",

  // ── Tripura ──
  agartala: "Tripura",

  // ── Uttar Pradesh ──
  agra: "Uttar Pradesh",
  aligarh: "Uttar Pradesh",
  allahabad: "Uttar Pradesh",
  ayodhya: "Uttar Pradesh",
  bareilly: "Uttar Pradesh",
  firozabad: "Uttar Pradesh",
  ghaziabad: "Uttar Pradesh",
  gorakhpur: "Uttar Pradesh",
  greater_noida: "Uttar Pradesh",
  jhansi: "Uttar Pradesh",
  kanpur: "Uttar Pradesh",
  lucknow: "Uttar Pradesh",
  mathura: "Uttar Pradesh",
  meerut: "Uttar Pradesh",
  moradabad: "Uttar Pradesh",
  muzaffarnagar: "Uttar Pradesh",
  noida: "Uttar Pradesh",
  saharanpur: "Uttar Pradesh",
  shahjahanpur: "Uttar Pradesh",
  varanasi: "Uttar Pradesh",

  // ── Uttarakhand ──
  dehradun: "Uttarakhand",
  haldwani: "Uttarakhand",
  haridwar: "Uttarakhand",
  rishikesh: "Uttarakhand",
  roorkee: "Uttarakhand",

  // ── West Bengal ──
  asansol: "West Bengal",
  durgapur: "West Bengal",
  howrah: "West Bengal",
  kolkata: "West Bengal",
  siliguri: "West Bengal",
};

export const HOSPITAL_TIERS = [
  "corporate_chain",
  "private_standalone",
  "government",
  "trust",
] as const;

export const INSURANCE_OPTIONS = ["yes", "no", "partial", "govt_scheme"] as const;

export const MIN_AMOUNT = 100;
export const MAX_AMOUNT = 5_000_000;
export const MAX_STAY_DAYS = 365;
export const MAX_SURPRISE_ITEMS = 10;
export const MAX_SURPRISE_DESC_LENGTH = 200;
export const RATE_LIMIT_PER_DAY = 5;
export const MIN_FORM_TIME_MS = 5000;
export const MIN_AGGREGATION_THRESHOLD = 5;
