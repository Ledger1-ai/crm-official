/*
 * Navigation/Header Labels Library
 * Extensive corpus of labels commonly found in site navigation, headers, footers, and boilerplate
 * that should not be treated as person names or critical entities when scraping.
 *
 * Also provides a robust isNavLabel() helper that normalizes concatenated words and casing.
 */

import { fixConcatenatedWords } from "./text-concatenation";

// Core nav/header labels (lowercase). Keep comprehensive to reduce false positives in name extraction.
export const NAV_LABELS: string[] = [
  // Company/About (English)
  "home", "homepage", "start", "about", "about us", "about company", "company", "company info", "company profile",
  "who we are", "our story", "mission", "our mission", "values", "our values", "vision", "history",
  // Team/People (English)
  "team", "our team", "leadership", "leadership team", "people", "staff", "advisors", "board", "board of directors",
  // Contact/Support (English)
  "contact", "contact me", "contact us", "get in touch", "reach out", "support", "help", "help center",
  "customer support", "tech support", "technical support", "report an issue", "report issue",
  // Sales/Marketing CTAs (English)
  "book a demo", "request demo", "schedule demo", "demo", "pricing", "plans", "compare plans", "quote", "request quote",
  "trial", "free trial", "start trial", "sign up", "signup", "register", "join",
  // Careers/Jobs (English)
  "careers", "jobs", "join us", "work with us", "we're hiring", "we are hiring", "apply", "apply now", "open roles",
  // Blog/News/Media (English)
  "blog", "articles", "insights", "news", "press", "press & media", "media", "newsroom", "updates",
  // Product/Docs (English)
  "product", "products", "features", "solutions", "platform", "pricing", "docs", "documentation", "developers",
  "api", "api docs", "guides", "tutorials", "resources", "resource center", "templates",
  // Social/Community (English)
  "community", "events", "meetups", "webinars", "podcast", "forum", "discussions",
  // Legal/Compliance/Privacy (English)
  "privacy", "privacy policy", "terms", "terms of service", "terms of use", "cookies", "cookie policy",
  "legal", "imprint", "compliance", "gdpr", "ccpa",
  // E‑commerce (English)
  "shop", "store", "cart", "basket", "checkout", "my account", "account", "orders", "order status",
  // Location/Hours (English)
  "locations", "find us", "visit", "hours", "opening hours", "get directions",
  // Generic CTAs (English)
  "learn more", "read more", "see more", "discover", "explore", "view all",
  "submit", "stay in the loop", "stay connected", "join newsletter", "subscribe", "sign up for updates",
  "get updates", "keep me posted", "age verification", "age verification required", "enter site", "confirm age", "verify age",
  "strain selection",

  // Spanish (ES)
  "inicio", "sobre nosotros", "sobre la empresa", "empresa", "quienes somos", "nuestra historia", "misión", "valores", "visión", "historia",
  "equipo", "nuestro equipo", "liderazgo", "personas", "personal",
  "contacto", "contáctanos", "ponte en contacto", "soporte", "ayuda", "centro de ayuda",
  "precios", "planes", "comparar planes", "presupuesto", "solicitar presupuesto", "prueba", "prueba gratis", "regístrate", "registar", "unirse",
  "carreras", "empleos", "trabaja con nosotros", "estamos contratando", "aplicar", "postúlate", "puestos abiertos",
  "blog", "artículos", "noticias", "prensa", "medios", "sala de prensa", "actualizaciones",
  "producto", "productos", "características", "soluciones", "plataforma", "documentación", "desarrolladores", "recursos",
  "comunidad", "eventos", "seminarios web", "podcast", "foro",
  "privacidad", "política de privacidad", "términos", "términos de servicio", "cookies", "política de cookies", "aviso legal",
  "tienda", "carrito", "finalizar compra", "mi cuenta", "pedidos", "estado del pedido",
  "ubicaciones", "encuéntranos", "visitar", "horario", "cómo llegar",
  "más información", "leer más", "ver más", "descubrir", "explorar", "ver todo",

  // French (FR)
  "accueil", "à propos", "a propos", "qui sommes-nous", "notre histoire", "mission", "valeurs", "vision",
  "équipe", "notre équipe", "direction", "personnes", "personnel",
  "contact", "contactez-nous", "nous contacter", "assistance", "aide", "centre d'aide",
  "tarifs", "plans", "devis", "demander un devis", "essai", "essai gratuit", "inscription", "s'inscrire", "rejoindre",
  "carrières", "emploi", "recrutement", "nous recrutons", "postuler", "postulez", "offres",
  "blog", "articles", "actualités", "presse", "médias", "salle de presse", "mises à jour",
  "produit", "produits", "fonctionnalités", "solutions", "plateforme", "documentation", "développeurs", "ressources",
  "communauté", "événements", "webinaires", "podcast", "forum",
  "confidentialité", "politique de confidentialité", "conditions", "conditions d'utilisation", "cookies", "politique de cookies", "mentions légales",
  "boutique", "panier", "commande", "mon compte", "commandes", "statut de commande",
  "emplacements", "nous trouver", "visiter", "horaires", "itinéraire",
  "en savoir plus", "lire la suite", "voir plus", "découvrir", "explorer", "voir tout",

  // German (DE)
  "startseite", "über uns", "ueber uns", "unternehmen", "wer wir sind", "unsere geschichte", "mission", "werte", "vision",
  "team", "unser team", "führung", "leitung", "mitarbeiter", "vorstand", "aufsichtsrat",
  "kontakt", "kontaktieren sie uns", "support", "hilfe", "hilfecenter",
  "preise", "pläne", "angebote vergleichen", "angebot", "angebot anfordern", "test", "kostenlose testversion", "registrieren", "anmelden", "beitreten",
  "karriere", "jobs", "stellenangebote", "wir stellen ein", "bewerben", "jetzt bewerben",
  "blog", "artikel", "neuigkeiten", "presse", "medien", "newsroom", "updates",
  "produkt", "produkte", "funktionen", "lösungen", "plattform", "dokumentation", "entwickler", "ressourcen",
  "gemeinschaft", "veranstaltungen", "webinare", "podcast", "forum",
  "datenschutz", "datenschutzerklärung", "agb", "nutzungsbedingungen", "cookies", "cookie-richtlinie", "impressum",
  "shop", "warenkorb", "kasse", "mein konto", "bestellungen", "bestellstatus",
  "standorte", "finden sie uns", "besuchen", "öffnungszeiten", "anfahrt",
  "mehr erfahren", "weiterlesen", "mehr anzeigen", "entdecken", "erkunden", "alle anzeigen",

  // Italian (IT)
  "home", "chi siamo", "la nostra storia", "missione", "valori", "visione",
  "team", "il nostro team", "leadership", "persone", "staff",
  "contatti", "contattaci", "supporto", "aiuto", "centro assistenza",
  "prezzi", "piani", "confronta piani", "preventivo", "richiedi preventivo", "prova", "prova gratuita", "registrati", "iscriviti", "unisciti",
  "carriere", "lavoro", "lavora con noi", "stiamo assumendo", "candidati", "posizioni aperte",
  "blog", "articoli", "notizie", "stampa", "media", "sala stampa", "aggiornamenti",
  "prodotto", "prodotti", "funzionalità", "soluzioni", "piattaforma", "documentazione", "sviluppatori", "risorse",
  "comunità", "eventi", "webinar", "podcast", "forum",
  "privacy", "informativa sulla privacy", "termini", "termini di servizio", "cookies", "informativa sui cookie", "note legali",
  "negozio", "carrello", "cassa", "il mio account", "ordini", "stato ordine",
  "sedi", "dove siamo", "visita", "orari", "indicazioni",
  "scopri di più", "leggi di più", "vedi di più", "scopri", "esplora", "vedi tutto",

  // Portuguese (PT/BR)
  "início", "inicio", "sobre", "sobre nós", "quem somos", "nossa história", "missão", "valores", "visão",
  "equipe", "nossa equipe", "liderança", "pessoas", "colaboradores",
  "contato", "fale conosco", "suporte", "ajuda", "central de ajuda",
  "preços", "planos", "comparar planos", "cotação", "solicitar cotação", "teste", "teste gratuito", "cadastre-se", "inscreva-se", "junte-se",
  "carreiras", "empregos", "trabalhe conosco", "estamos contratando", "candidatar-se", "vagas abertas",
  "blog", "artigos", "notícias", "imprensa", "mídia", "sala de imprensa", "atualizações",
  "produto", "produtos", "recursos", "soluções", "plataforma", "documentação", "desenvolvedores", "recursos",
  "comunidade", "eventos", "webinars", "podcast", "fórum",
  "privacidade", "política de privacidade", "termos", "termos de serviço", "cookies", "política de cookies", "aviso legal",
  "loja", "carrinho", "finalizar compra", "minha conta", "pedidos", "status do pedido",
  "localizações", "encontre-nos", "visite", "horários", "como chegar",
  "saiba mais", "ler mais", "ver mais", "descobrir", "explorar", "ver tudo",

  // Dutch (NL)
  "home", "over", "over ons", "wie zijn wij", "onze geschiedenis", "missie", "waarden", "visie",
  "team", "ons team", "leiding", "mensen", "personeel",
  "contact", "neem contact op", "ondersteuning", "help", "helpcentrum",
  "prijzen", "plannen", "plannen vergelijken", "offerte", "offerte aanvragen", "proef", "gratis proef", "aanmelden", "registreren", "lid worden",
  "carrières", "banen", "werken bij ons", "we werven", "solliciteren", "openstaande functies",
  "blog", "artikelen", "nieuws", "pers", "media", "perskamer", "updates",
  "product", "producten", "functies", "oplossingen", "platform", "documentatie", "ontwikkelaars", "bronnen",
  "community", "evenementen", "webinars", "podcast", "forum",
  "privacy", "privacybeleid", "voorwaarden", "algemene voorwaarden", "cookies", "cookiebeleid", "juridisch",
  "winkel", "winkelwagen", "afrekenen", "mijn account", "bestellingen", "bestelstatus",
  "locaties", "vind ons", "bezoek", "openingstijden", "routebeschrijving",
  "meer informatie", "lees meer", "bekijk meer", "ontdekken", "verkennen", "alles bekijken",

  // Czech (CS)
  "domů", "doma", "o nás", "společnost", "kdo jsme", "naše historie", "mise", "hodnoty", "vize",
  "tým", "náš tým", "vedení", "lidé", "zaměstnanci",
  "kontakt", "kontaktujte nás", "podpora", "nápověda", "centrum nápovědy",
  "ceny", "plány", "porovnat plány", "nabídka", "vyžádat nabídku", "zkouška", "zdarma zkouška", "zaregistrovat se", "přihlásit se", "připojit se",
  "kariéra", "práce", "pracujte s námi", "nabíráme", "přihlásit se", "volné pozice",
  "blog", "články", "novinky", "tisk", "média", "tiskové středisko", "aktualizace",
  "produkt", "produkty", "funkce", "řešení", "platforma", "dokumentace", "vývojáři", "zdroje",
  "komunita", "události", "webináře", "podcast", "fórum",
  "soukromí", "zásady ochrany osobních údajů", "obchodní podmínky", "podmínky použití", "cookies", "zásady cookies", "právní",
  "obchod", "košík", "pokladna", "můj účet", "objednávky", "stav objednávky",
  "lokace", "najděte nás", "navštívit", "otevírací doba", "jak se k nám dostat",
  "více informací", "číst více", "zobrazit více", "objevovat", "prozkoumat", "zobrazit vše",

  // Ukrainian (UK)
  "головна", "про нас", "компанія", "хто ми", "наша історія", "місія", "цінності", "бачення",
  "команда", "керівництво", "люди", "персонал",
  "контакти", "зв'яжіться з нами", "підтримка", "довідка", "центр довідки",
  "ціни", "плани", "порівняти плани", "квотація", "запитати ціну", "тест", "безкоштовна проба", "зареєструватися", "приєднатися",
  "кар'єра", "робота", "працюйте з нами", "ми наймаємо", "подати заявку", "відкриті позиції",
  "блог", "статті", "новини", "преса", "медіа", "прес-центр", "оновлення",
  "продукт", "продукти", "можливості", "рішення", "платформа", "документація", "розробники", "ресурси",
  "спільнота", "події", "вебінари", "подкаст", "форум",
  "конфіденційність", "політика конфіденційності", "умови", "умови використання", "cookies", "політика cookies", "юридична інформація",
  "магазин", "кошик", "оформлення", "мій акаунт", "замовлення", "статус замовлення",
  "локації", "знайдіть нас", "відвідати", "години роботи", "маршрут",
  "дізнатися більше", "читати далі", "переглянути більше", "відкривати", "досліджувати", "переглянути все",
];

// Extra aliases and common concatenations handled by fixConcatenatedWords already.
// Add any highly domain-specific labels here if needed.
export const NAV_ALIASES: string[] = [
  // Contact
  "contactme", "contactus", "getintouch", "reachout",
  // About
  "aboutus", "ourstory", "whoweare", "ourmission", "ourvalues",
  // Team
  "meettheteam", "teammembers", "leadershipteam",
  // Careers
  "careerspage", "joinus", "workwithus", "wearehiring", "applynow",
  // Press/Media
  "pressmedia", "newsroom", "mediakit",
  // Legal
  "privacypolicy", "termsofservice", "termsofuse", "cookiepolicy",
  // Blog/Resources
  "learnmore", "resources", "readmore",
  // Support/Sales
  "getsupport", "gethelp", "talktosales", "bookademo",
  // CTA compact forms
  "discover", "submit", "stayintheloop", "stayconnected", "joinnewsletter", "subscribe",
  "signupforupdates", "getupdates", "keepmeposted", "entersite", "confirmage", "verifyage",
  
  // Spanish compact forms
  "sobrenosotros", "quienessomos", "nuestrahistoria", "contactanos", "ponteencontacto", "centrodeayuda",
  "trabajaconnosotros", "estamoscontratando", "pruebagratis", "masinformacion",
  
  // French compact forms
  "apropos", "quisommesnous", "notreequipe", "contacteznous", "nouscontacter", "centredaide",
  "essai gratuit", "ensavoirplus", "mentionslegales",
  
  // German compact forms
  "ueberuns", "unserteam", "kontaktierenuns", "hilfecenter", "datenschutzerklaerung",
  
  // Italian compact forms
  "chisiamo", "nostrastoria", "contattaci", "centroassistenza", "provagratuita", "iscriviti",
  
  // Portuguese compact forms
  "sobrenos", "quemsomos", "nossahistoria", "faleconosco", "centraldeajuda", "testegRAtuito", "saibamais",
  
  // Dutch compact forms
  "overons", "wi z i jn", "onsteam", "neemcontactop", "helpcentrum", "algemenevoorwaarden",
  
  // Czech compact forms
  "onas", "nastym", "kontaktujtenas", "centrumnapovedy", "obchodnipodminky",
  
  // Ukrainian compact forms
  "пронас", "нашаетсторія", "звяжітьсязнами", "центрдовідки", "політикоконфіденційності",
];

// Build a deduped, normalized set for quick membership checks
const NAV_SET = new Set<string>([...NAV_LABELS.map((s) => s.toLowerCase()), ...NAV_ALIASES.map((s) => s.toLowerCase())]);

// Normalize an input label and check if it matches known nav/header terms
export function isNavLabel(input?: string | null): boolean {
  if (!input) return false;
  const fixed = fixConcatenatedWords(input).toLowerCase();
  if (NAV_SET.has(fixed)) return true;
  // Also try compact form (remove spaces) to catch variants like "Contact Me" vs "contactme"
  const compact = fixed.replace(/\s+/g, "");
  return NAV_SET.has(compact);
}

export default { NAV_LABELS, NAV_ALIASES, isNavLabel };
