/*
 * Tech Stack Normalizer (Global-friendly)
 * Maps a wide range of aliases to canonical technology names, dedupes, and enforces consistent casing.
 * Extend this map over time based on observed data. Keep names language-agnostic and globally recognized.
 */

export const TECH_ALIASES: Record<string, string> = {
  // Frontend frameworks
  "react": "React",
  "reactjs": "React",
  "preact": "Preact",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular",
  "angularjs": "Angular",
  "svelte": "Svelte",
  "sveltekit": "SvelteKit",

  // Meta frameworks
  "next": "Next.js",
  "nextjs": "Next.js",
  "nuxt": "Nuxt.js",
  "nuxtjs": "Nuxt.js",
  "gatsby": "Gatsby",
  "remix": "Remix",

  // Build tools / bundlers
  "vite": "Vite",
  "webpack": "Webpack",
  "rollup": "Rollup",
  "parcel": "Parcel",

  // Backend / runtimes / frameworks
  "node": "Node.js",
  "nodejs": "Node.js",
  "deno": "Deno",
  "bun": "Bun",
  "express": "Express",
  "expressjs": "Express",
  "koa": "Koa",
  "nestjs": "NestJS",
  "nest": "NestJS",
  "hapi": "Hapi",
  "spring": "Spring",
  "springboot": "Spring Boot",
  "spring boot": "Spring Boot",

  // Python
  "django": "Django",
  "flask": "Flask",
  "fastapi": "FastAPI",

  // Ruby
  "rails": "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",

  // PHP
  "laravel": "Laravel",
  "symfony": "Symfony",
  "codeigniter": "CodeIgniter",
  "yii": "Yii",

  // Java/.NET
  "dotnet": ".NET",
  "aspnet": "ASP.NET",
  "asp.net": "ASP.NET",

  // CMS / commerce (global)
  "wordpress": "WordPress",
  "wordpress.com": "WordPress",
  "wordpress.org": "WordPress",
  "wp": "WordPress",
  "woocommerce": "WooCommerce",
  "shopify": "Shopify",
  "shopifyplus": "Shopify",
  "magento": "Magento",
  "adobe commerce": "Magento",
  "bigcommerce": "BigCommerce",
  "drupal": "Drupal",
  "joomla": "Joomla",
  "typo3": "TYPO3",
  "prestashop": "PrestaShop",
  "opencart": "OpenCart",
  "wix": "Wix",
  "squarespace": "Squarespace",
  "weebly": "Weebly",
  "ghost": "Ghost",
  "craft": "Craft CMS",
  "craft cms": "Craft CMS",
  "strapi": "Strapi",
  "directus": "Directus",
  "contentful": "Contentful",
  "sanity": "Sanity",
  "umbraco": "Umbraco",
  "sitecore": "Sitecore",

  // Data / analytics / marketing
  "hubspot": "HubSpot",
  "salesforce": "Salesforce",
  "pardot": "Pardot",
  "marketo": "Marketo",
  "segment": "Segment",
  "matomo": "Matomo",
  "google analytics": "Google Analytics",
  "ga4": "Google Analytics",

  // Support / chat
  "intercom": "Intercom",
  "zendesk": "Zendesk",
  "drift": "Drift",
  "freshdesk": "Freshdesk",
  "zohodesk": "Zoho Desk",

  // DevOps / infra
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "helm": "Helm",
  "terraform": "Terraform",
  "ansible": "Ansible",
  "pulumi": "Pulumi",

  // Databases
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "mysql": "MySQL",
  "mariadb": "MariaDB",
  "mongodb": "MongoDB",
  "dynamodb": "DynamoDB",
  "redis": "Redis",
  "sqlite": "SQLite",
  "oracle": "Oracle Database",
  "sqlserver": "SQL Server",

  // Clouds (global)
  "aws": "AWS",
  "amazon web services": "AWS",
  "azure": "Azure",
  "gcp": "Google Cloud",
  "google cloud": "Google Cloud",
  "alibaba cloud": "Alibaba Cloud",
  "oracle cloud": "Oracle Cloud",
  "ibm cloud": "IBM Cloud",

  // Additional site builders / hosting / CDNs
  "webflow": "Webflow",
  "firebase hosting": "Firebase Hosting",
  "aws amplify": "AWS Amplify",
  "cloudfront": "CloudFront",
  "fastly": "Fastly",
  "akamai": "Akamai",

  // Meta frameworks and SSG
  "astro": "Astro",

  // Analytics / tag managers / pixels
  "google tag manager": "Google Tag Manager",
  "plausible": "Plausible",
  "umami": "Umami",
  "hotjar": "Hotjar",
  "fullstory": "FullStory",
  "heap": "Heap",
  "mixpanel": "Mixpanel",
  "amplitude": "Amplitude",
  "clarity": "Microsoft Clarity",
  "linkedin insight": "LinkedIn Insight",
  "facebook pixel": "Facebook Pixel",
  "twitter pixel": "Twitter Pixel",

  // Chat/Support
  "crisp": "Crisp",
  "tawk.to": "Tawk.to",
  "livechat": "LiveChat",
  "freshchat": "Freshchat",
  "tidio": "Tidio",

  // Experimentation/Optimization
  "optimizely": "Optimizely",
  "vwo": "VWO",

  // Scheduling/Forms
  "calendly": "Calendly",
  "typeform": "Typeform",
  "help scout": "Help Scout",

  // Payments
  "adyen": "Adyen",
  "square": "Square",

  // Marketing/CRM/Email
  "zoho": "Zoho",
  "pipedrive": "Pipedrive",
  "klaviyo": "Klaviyo",
  "mailerlite": "MailerLite",
  "customer.io": "Customer.io",
  "convertkit": "ConvertKit",
  "campaign monitor": "Campaign Monitor",

  // Consent/cookies
  "onetrust": "OneTrust",
  "cookiebot": "Cookiebot",

  // Error monitoring
  "bugsnag": "Bugsnag",
};

export function canonicalizeTechName(input: string): string {
  const key = input.trim().toLowerCase();
  return TECH_ALIASES[key] || input.trim();
}

export function normalizeTechStack(list?: any): string[] {
  const out: string[] = [];
  const add = (val: string) => {
    const canonical = canonicalizeTechName(val);
    if (!out.includes(canonical)) out.push(canonical);
  };
  if (Array.isArray(list)) {
    list.forEach((x) => {
      if (!x) return;
      add(String(x));
    });
  } else if (typeof list === "string") {
    list.split(/[,;\n]/).forEach((x) => add(x));
  }
  return out;
}

export default {
  TECH_ALIASES,
  canonicalizeTechName,
  normalizeTechStack,
};
