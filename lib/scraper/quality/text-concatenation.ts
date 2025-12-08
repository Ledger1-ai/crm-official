/*
 * Text concatenation + name normalization utilities
 * Goal: Robustly split/repair run-together headings and labels (e.g., "Contactme" → "Contact me"),
 * handle camelCase/PascalCase, collapse duplicates, and provide a configurable name normalization.
 */

export type NormalizeNameOptions = {
  // Optional list of labels to treat as navigation/header terms that should not be considered names
  navLabels?: string[];
  // If true, drop names that match nav labels after normalization
  dropNavLabels?: boolean;
};

// Extensive dictionary for concatenated words → readable labels
// Lower-case, whitespace-stripped keys map to final forms.
const CONCAT_WORD_FIXES: Record<string, string> = {
  // Contact-related (EN)
  "contactme": "Contact me",
  "contactus": "Contact us",
  "getintouch": "Get in touch",
  "reachout": "Reach out",
  "sendamessage": "Send a message",
  "sendmessage": "Send message",
  "emailus": "Email us",
  "callus": "Call us",

  // About-related (EN)
  "aboutus": "About us",
  "ourstory": "Our story",
  "whoweare": "Who we are",
  "missionandvalues": "Mission and values",
  "ourmission": "Our mission",
  "ourvalues": "Our values",

  // Team/Company-related (EN)
  "meettheteam": "Meet the team",
  "teammembers": "Team members",
  "leadershipteam": "Leadership team",
  "companyinfo": "Company info",
  "companyprofile": "Company profile",

  // Careers/Hiring (EN)
  "careerspage": "Careers page",
  "joinus": "Join us",
  "workwithus": "Work with us",
  "wearehiring": "We are hiring",
  "applynow": "Apply now",

  // Press/Media (EN)
  "pressmedia": "Press & media",
  "newsroom": "Newsroom",
  "mediakit": "Media kit",

  // Legal/Policies (EN)
  "privacypolicy": "Privacy policy",
  "termsofservice": "Terms of service",
  "termsofuse": "Terms of use",
  "cookiepolicy": "Cookie policy",

  // Blog/Resources (EN)
  "learnmore": "Learn more",
  "resources": "Resources",
  "readmore": "Read more",

  // Support/Sales (EN)
  "getsupport": "Get support",
  "gethelp": "Get help",
  "talktosales": "Talk to sales",
  "bookademo": "Book a demo",

  // Spanish compact
  "sobrenosotros": "Sobre nosotros",
  "quienessomos": "Quiénes somos",
  "nuestrahistoria": "Nuestra historia",
  "contactanos": "Contáctanos",
  "ponteencontacto": "Ponte en contacto",
  "centrodeayuda": "Centro de ayuda",
  "trabajaconnosotros": "Trabaja con nosotros",
  "estamoscontratando": "Estamos contratando",
  "pruebagratis": "Prueba gratis",
  "masinformacion": "Más información",

  // French compact
  "apropos": "À propos",
  "quisommesnous": "Qui sommes-nous",
  "notreequipe": "Notre équipe",
  "contacteznous": "Contactez-nous",
  "nouscontacter": "Nous contacter",
  "centredaide": "Centre d'aide",
  "ensavoirplus": "En savoir plus",
  "mentionslegales": "Mentions légales",

  // German compact
  "ueberuns": "Über uns",
  "unserteam": "Unser Team",
  "kontaktierenuns": "Kontaktieren Sie uns",
  "hilfecenter": "Hilfecenter",
  "datenschutzerklaerung": "Datenschutzerklärung",

  // Italian compact
  "chisiamo": "Chi siamo",
  "nostrastoria": "La nostra storia",
  "contattaci": "Contattaci",
  "centroassistenza": "Centro assistenza",
  "provagratuita": "Prova gratuita",
  "iscriviti": "Iscriviti",

  // Portuguese compact
  "sobrenos": "Sobre nós",
  "quemsomos": "Quem somos",
  "nossahistoria": "Nossa história",
  "faleconosco": "Fale conosco",
  "centraldeajuda": "Central de ajuda",
  "saibamais": "Saiba mais",

  // Dutch compact
  "overons": "Over ons",
  "onsteam": "Ons team",
  "neemcontactop": "Neem contact op",
  "helpcentrum": "Helpcentrum",
  "algemenevoorwaarden": "Algemene voorwaarden",

  // Czech compact
  "onas": "O nás",
  "nastym": "Náš tým",
  "kontaktujtenas": "Kontaktujte nás",
  "centrumnapovedy": "Centrum nápovědy",
  "obchodnipodminky": "Obchodní podmínky",

  // Ukrainian compact (Cyrillic)
  "пронас": "Про нас",
  "нашаетсторія": "Наша історія",
  "звяжітьсязнами": "Зв'яжіться з нами",
  "центрдовідки": "Центр довідки",
  "політикоконфіденційності": "Політика конфіденційності",
};

// Split camelCase/PascalCase boundaries and underscores/hyphens
export function camelAndConnectorSplit(input: string): string {
  let s = input.replace(/([a-z])([A-Z])/g, "$1 $2");
  s = s.replace(/[-_]+/g, " ");
  return s;
}

// Collapse repeated tokens (e.g., "Direct Direct" → "Direct") and extra spaces
export function collapseRepeats(input: string): string {
  const tokens = input.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i === 0 || t.toLowerCase() !== tokens[i - 1].toLowerCase()) {
      out.push(t);
    }
  }
  return out.join(" ").replace(/\s{2,}/g, " ").trim();
}

// Title case utility for canonical labels
export function capitalizeWords(input: string): string {
  return input
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

// Repair concatenated words → readable labels using dictionary + heuristics
export function fixConcatenatedWords(input?: string | null): string {
  if (!input) return "";
  let s = String(input).trim();
  // camel/Pascal + connector split
  s = camelAndConnectorSplit(s);
  // Dictionary pass: compare a fully compacted lowercase key (diacritic-insensitive)
  const compact = s.replace(/\s+/g, "");
  const base = compact.normalize ? compact.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : compact;
  const key = base.toLowerCase();
  if (CONCAT_WORD_FIXES[key]) s = CONCAT_WORD_FIXES[key];
  // Final clean-up
  s = s.replace(/\s{2,}/g, " ");
  s = collapseRepeats(s);
  return s.trim();
}

// Name normalization (configurable)
export function normalizeNameCandidate(name?: string | null, opts: NormalizeNameOptions = {}): string {
  const { navLabels = [], dropNavLabels = true } = opts;
  let s = fixConcatenatedWords(name);
  // If it matches a nav label post-fix and caller wants to drop, return empty
  if (dropNavLabels && navLabels.length) {
    const lower = s.toLowerCase();
    if (navLabels.includes(lower)) return "";
  }
  s = collapseRepeats(s);
  s = capitalizeWords(s);
  return s.trim();
}

// Prefer more informative string (longer non-empty)
export function preferInformative(a?: string | null, b?: string | null): string {
  const A = (a || "").trim();
  const B = (b || "").trim();
  if (B.length > A.length) return B;
  return A;
}

export default {
  fixConcatenatedWords,
  camelAndConnectorSplit,
  collapseRepeats,
  capitalizeWords,
  normalizeNameCandidate,
  preferInformative,
};
