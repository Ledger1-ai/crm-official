/*
 * Title Normalization and Persona Tagging
 * - Normalizes raw titles into standardized ladder: C-SUITE, VP, DIRECTOR, MANAGER, IC, OTHER
 * - Maps departments: Engineering, Product, Marketing, Sales, HR, Finance, Operations, IT, Data, Customer Success
 * - Emits persona tags for ICP alignment and ranking
 */

export type Ladder = "C-SUITE" | "VP" | "DIRECTOR" | "MANAGER" | "IC" | "OTHER";
export type Department =
  | "ENGINEERING"
  | "PRODUCT"
  | "MARKETING"
  | "SALES"
  | "HR"
  | "FINANCE"
  | "OPERATIONS"
  | "IT"
  | "DATA"
  | "CUSTOMER_SUCCESS"
  | "OTHER";

export type Persona =
  | "TECH_DECISION_MAKER"
  | "BUSINESS_DECISION_MAKER"
  | "PEOPLE_OPS"
  | "FINANCE_OPS"
  | "RECRUITER"
  | "INDIVIDUAL_CONTRIBUTOR"
  | "OTHER";

export type NormalizedTitle = {
  normalizedTitle: string;
  ladder: Ladder;
  department: Department;
  persona: Persona;
};

function lower(s?: string): string { return (s || "").toLowerCase(); }

const deptMatchers: Array<{ dept: Department; rx: RegExp[] }> = [
  { dept: "ENGINEERING", rx: [/engineer/, /engineering/, /cto/, /devops/, /sre/, /developer/, /software/, /platform/, /backend/, /frontend/] },
  { dept: "PRODUCT", rx: [/product/, /cpo\b/, /product manager/, /pm\b/] },
  { dept: "MARKETING", rx: [/marketing/, /growth/, /demand gen/, /seo/, /content/, /brand/, /communications?/, /pr\b/, /public relations/] },
  { dept: "SALES", rx: [/sales/, /revenue/, /account executive/, /ae\b/, /sdr\b/, /bdr\b/, /account manager/, /cro\b/, /business development/] },
  { dept: "HR", rx: [/hr\b/, /human resources/, /people ops?/, /talent/, /recruit/i, /cpo\b/, /chief people/] },
  { dept: "FINANCE", rx: [/finance/, /cfo\b/, /accounting/, /controller/, /fp&a/] },
  { dept: "OPERATIONS", rx: [/operations?/, /coo\b/, /ops\b/, /business operations/] },
  { dept: "IT", rx: [/it\b/, /information technology/, /systems? admin/, /cio\b/, /infrastructure/] },
  { dept: "DATA", rx: [/data\b/, /analytics?/, /bi\b/, /scientist/, /cd(o)?\b/, /machine learning/, /ai\b/] },
  { dept: "CUSTOMER_SUCCESS", rx: [/customer success/, /cs manager/, /support/, /helpdesk/, /customer experience/, /cx\b/] },
  // Additional departments (map to closest)
  { dept: "ENGINEERING", rx: [/security/, /infosec/, /ciso\b/, /secops/] },
  { dept: "ENGINEERING", rx: [/quality assurance/, /qa\b/, /test(ing)?/] },
  { dept: "PRODUCT", rx: [/design/, /ux\b/, /ui\b/, /user experience/] },
];

const ladderMatchers: Array<{ ladder: Ladder; rx: RegExp[]; canonical?: string }> = [
  { ladder: "C-SUITE", rx: [
    /\bceo\b/, /chief executive/,
    /\bcto\b/, /chief technology/,
    /\bcfo\b/, /chief financial/,
    /\bcoo\b/, /chief operating/,
    /chief marketing officer|\bcmo\b/,
    /chief product officer|\bcpo\b/,
    /\bcio\b/, /chief information officer/,
    /\bciso\b/, /chief information security officer/,
    /\bcdo\b/, /chief data officer/,
    /\bcro\b/, /chief revenue officer/,
    /\bcco\b/, /chief compliance officer/,
    /chief people officer/
  ] },
  { ladder: "VP", rx: [/\bvp\b/, /vice president/] },
  { ladder: "DIRECTOR", rx: [/director\b/, /head of\b/] },
  { ladder: "MANAGER", rx: [/manager\b/, /lead\b/, /owner of\b/] },
  { ladder: "IC", rx: [/engineer\b/, /developer\b/, /designer\b/, /analyst\b/, /specialist\b/, /associate\b/, /coordinator\b/] },
];

function detectDepartment(title: string): Department {
  const t = lower(title);
  for (const m of deptMatchers) {
    if (m.rx.some((re) => re.test(t))) return m.dept;
  }
  return "OTHER";
}

function detectLadder(title: string): Ladder {
  const t = lower(title);
  for (const m of ladderMatchers) {
    if (m.rx.some((re) => re.test(t))) return m.ladder;
  }
  return "OTHER";
}

function toCanonical(title: string, ladder: Ladder, dept: Department): string {
  // Simple canonical title synthesis
  const t = lower(title);
  switch (ladder) {
    case "C-SUITE":
      if (/cto/.test(t) || /chief technology/.test(t)) return "Chief Technology Officer";
      if (/cfo/.test(t) || /chief financial/.test(t)) return "Chief Financial Officer";
      if (/coo/.test(t) || /chief operating/.test(t)) return "Chief Operating Officer";
      if (/cmo/.test(t) || /chief marketing/.test(t)) return "Chief Marketing Officer";
      if (/cpo/.test(t) || /chief product/.test(t)) return "Chief Product Officer";
      if (/cio/.test(t) || /chief information officer/.test(t)) return "Chief Information Officer";
      if (/ciso/.test(t) || /chief information security officer/.test(t)) return "Chief Information Security Officer";
      if (/cdo/.test(t) || /chief data officer/.test(t)) return "Chief Data Officer";
      if (/cro/.test(t) || /chief revenue officer/.test(t)) return "Chief Revenue Officer";
      if (/cco/.test(t) || /chief compliance officer/.test(t)) return "Chief Compliance Officer";
      if (/chief people/.test(t)) return "Chief People Officer";
      return "Chief Executive Officer";
    case "VP":
      return `VP of ${dept.replace("_", " ")}`;
    case "DIRECTOR":
      return `Director of ${dept.replace("_", " ")}`;
    case "MANAGER":
      return dept === "OTHER" ? "Manager" : `${dept.replace("_", " ")} Manager`;
    case "IC":
      return title; // keep as-is for ICs
    default:
      return title;
  }
}

function derivePersona(ladder: Ladder, dept: Department, title: string): Persona {
  const t = lower(title);
  if (/(recruit|talent|sourcer)/.test(t)) return "RECRUITER";
  if (dept === "FINANCE") return "FINANCE_OPS";
  if (dept === "HR") return "PEOPLE_OPS";
  // Security/compliance leaders are decision makers
  if (/ciso\b|security|infosec/.test(t)) return "TECH_DECISION_MAKER";
  if (ladder === "C-SUITE" || ladder === "VP" || ladder === "DIRECTOR") {
    if (dept === "ENGINEERING" || dept === "IT" || dept === "DATA" || /technology|infrastructure|platform|security|compliance|data/.test(t)) {
      return "TECH_DECISION_MAKER";
    }
    return "BUSINESS_DECISION_MAKER";
  }
  if (ladder === "MANAGER" && (dept === "ENGINEERING" || dept === "IT" || dept === "DATA")) return "TECH_DECISION_MAKER";
  return "INDIVIDUAL_CONTRIBUTOR";
}

export function normalizeTitleAndPersona(rawTitle?: string | null): NormalizedTitle | null {
  const title = (rawTitle || "").trim();
  if (!title) return null;
  const dept = detectDepartment(title);
  const ladder = detectLadder(title);
  const normalizedTitle = toCanonical(title, ladder, dept);
  const persona = derivePersona(ladder, dept, title);
  return { normalizedTitle, ladder, department: dept, persona };
}

export default {
  normalizeTitleAndPersona,
};
