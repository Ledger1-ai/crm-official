import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const moduleData = require("../initial-data/system_Modules_Enabled.json");
const gptModelsData = require("../initial-data/gpt_Models.json");
const crmOpportunityTypeData = require("../initial-data/crm_Opportunities_Type.json");
const crmOpportunitySaleStagesData = require("../initial-data/crm_Opportunities_Sales_Stages.json");
const crmCampaignsData = require("../initial-data/crm_campaigns.json");
const crmIndustryTypeData = require("../initial-data/crm_Industry_Type.json");

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  // Your seeding logic here using Prisma Client
  console.log("-------- Seeding DB --------");

  //Seed Menu Items - Sync logic to add missing modules
  const existingModules = await prisma.system_Modules_Enabled.findMany();
  const existingModuleNames = existingModules.map((m: any) => m.name);

  for (const moduleEntry of moduleData) {
    if (!existingModuleNames.includes(moduleEntry.name)) {
      await prisma.system_Modules_Enabled.create({
        data: moduleEntry,
      });
      console.log(`Module "${moduleEntry.name}" added`);
    }
  }
  console.log("Modules sync complete");

  //Seed CRM Opportunity Types
  const crmOpportunityType = await prisma.crm_Opportunities_Type.findMany();

  if (crmOpportunityType.length === 0) {
    await prisma.crm_Opportunities_Type.createMany({
      data: crmOpportunityTypeData,
    });
    console.log("Opportunity Types seeded successfully");
  } else {
    console.log("Opportunity Types already seeded");
  }

  const crmOpportunitySaleStages =
    await prisma.crm_Opportunities_Sales_Stages.findMany();

  if (crmOpportunitySaleStages.length === 0) {
    await prisma.crm_Opportunities_Sales_Stages.createMany({
      data: crmOpportunitySaleStagesData,
    });
    console.log("Opportunity Sales Stages seeded successfully");
  } else {
    console.log("Opportunity Sales Stages already seeded");
  }

  const crmCampaigns = await prisma.crm_campaigns.findMany();

  if (crmCampaigns.length === 0) {
    await prisma.crm_campaigns.createMany({
      data: crmCampaignsData,
    });
    console.log("Campaigns seeded successfully");
  } else {
    console.log("Campaigns already seeded");
  }

  const crmIndustryType = await prisma.crm_Industry_Type.findMany();

  if (crmIndustryType.length === 0) {
    await prisma.crm_Industry_Type.createMany({
      data: crmIndustryTypeData,
    });
    console.log("Industry Types seeded successfully");
  } else {
    console.log("Industry Types already seeded");
  }

  // Seed AI Models (Strict 2026 Lineup - Optimized for Cost)
  const defaultModels = [
    // OpenAI
    // Removed GPT-5 and o1 Pro as requested (High Cost)
    { name: "GPT-5 Mini", modelId: "gpt-5-mini", provider: "OPENAI", isActive: true, maxContext: 200000, inputPrice: 0.25, outputPrice: 2.00 },

    // Anthropic
    { name: "Claude 4.5 Opus", modelId: "claude-4-5-opus", provider: "ANTHROPIC", isActive: true, maxContext: 200000, inputPrice: 5.00, outputPrice: 25.00 },
    { name: "Claude 4.5 Sonnet", modelId: "claude-4-5-sonnet", provider: "ANTHROPIC", isActive: true, maxContext: 200000, inputPrice: 3.00, outputPrice: 15.00 },

    // Google
    { name: "Gemini 3.0 Pro", modelId: "gemini-3.0-pro", provider: "GOOGLE", isActive: true, maxContext: 2000000, inputPrice: 2.00, outputPrice: 12.00 },
    { name: "Gemini 3.0 Flash", modelId: "gemini-3.0-flash", provider: "GOOGLE", isActive: true, maxContext: 2000000, inputPrice: 0.50, outputPrice: 3.00 },

    // xAI (Grok)
    { name: "Grok 3", modelId: "grok-3", provider: "GROK", isActive: true, maxContext: 128000, inputPrice: 3.00, outputPrice: 15.00 },
    { name: "Grok Code Fast 1", modelId: "grok-code-fast-1", provider: "GROK", isActive: true, maxContext: 256000, inputPrice: 0.20, outputPrice: 1.50 },

    // DeepSeek
    { name: "DeepSeek V3", modelId: "deepseek-chat", provider: "DEEPSEEK", isActive: true, maxContext: 128000, inputPrice: 0.14, outputPrice: 0.28 },
    { name: "Kimi k2", modelId: "kimi-k2", provider: "DEEPSEEK", isActive: true, maxContext: 200000, inputPrice: 0.50, outputPrice: 2.40 },

    // Azure (Restored & Requested)
    { name: "Azure GPT-5 (Preview)", modelId: "gpt-5-preview", provider: "AZURE", isActive: true, maxContext: 128000, inputPrice: 5.00, outputPrice: 20.00 },
    { name: "Azure GPT-5 Nano", modelId: "gpt-5-nano", provider: "AZURE", isActive: true, maxContext: 128000, inputPrice: 0.10, outputPrice: 0.50 },
    { name: "Azure GPT-4o", modelId: "gpt-4o", provider: "AZURE", isActive: true, maxContext: 128000, inputPrice: 2.50, outputPrice: 10.00 },
  ];

  // Logic to PERMANENTLY REMOVE old models not in the new list
  const activeModelIds = defaultModels.map(m => m.modelId);

  // First, delete any models that are NOT in our strict 2026 lineup
  const deleted = await prisma.aiModel.deleteMany({
    where: {
      modelId: { notIn: activeModelIds }
    }
  });
  console.log(`Deleted ${deleted.count} outdated models (older than 8 months or deprecated)`);

  // Sync Logic
  for (const m of defaultModels) {
    const existing = await prisma.aiModel.findFirst({
      where: { modelId: m.modelId, provider: m.provider as any }
    });

    if (!existing) {
      await prisma.aiModel.create({
        data: {
          name: m.name,
          modelId: m.modelId,
          provider: m.provider as any,
          isActive: m.isActive ?? true,
          inputPrice: m.inputPrice ?? 0,
          outputPrice: m.outputPrice ?? 0,
          maxContext: m.maxContext ?? 128000,
          defaultMarkup: 20.0
        }
      });
      console.log(`Created ${m.provider} - ${m.name}`);
    } else {
      await prisma.aiModel.update({
        where: { id: existing.id },
        data: {
          name: m.name,
          isActive: m.isActive ?? true,
          inputPrice: m.inputPrice ?? 0,
          outputPrice: m.outputPrice ?? 0,
          maxContext: m.maxContext ?? 128000
        }
      });
      console.log(`Updated ${m.provider} - ${m.name}`);
    }
  }
  console.log("AI Models sync complete");

  // Seed Footer Data
  const footerSetting = await prisma.footerSetting.findFirst();
  if (!footerSetting) {
    await prisma.footerSetting.create({
      data: {
        tagline: "Your 24/7 AI workforce. Sales, Support, and Growth on autopilot.",
        copyrightText: "© 2025 Ledger AI. All rights reserved.",
        socialXUrl: "https://x.com/BasaltAI",
        socialDiscordUrl: "https://discord.gg/vARPqF84Zt",
      },
    });
    console.log("Footer Settings seeded successfully");
  } else {
    console.log("Footer Settings already seeded");
  }

  const footerSections = await prisma.footerSection.findMany();
  if (footerSections.length === 0) {
    // Product Section
    const productSection = await prisma.footerSection.create({
      data: {
        title: "Product",
        order: 1,
        links: {
          create: [
            { text: "Features", url: "/features", order: 1 },
            { text: "Pricing", url: "/pricing", order: 2 },
          ],
        },
      },
    });

    // Company Section
    const companySection = await prisma.footerSection.create({
      data: {
        title: "Company",
        order: 2,
        links: {
          create: [
            { text: "About Us", url: "/about", order: 1 },
            { text: "Blog", url: "/blog", order: 2 },
            { text: "Careers", url: "/careers", order: 3 },
            { text: "Contact", url: "/support", order: 4 },
          ],
        },
      },
    });

    // Legal Section
    const legalSection = await prisma.footerSection.create({
      data: {
        title: "Legal",
        order: 3,
        links: {
          create: [
            { text: "Privacy Policy", url: "/privacy", order: 1 },
            { text: "Terms of Service", url: "/terms", order: 2 },
            { text: "Cookie Policy", url: "/cookies", order: 3 },
          ],
        },
      },
    });

    console.log("Footer Sections and Links seeded successfully");
  } else {
    console.log("Footer Sections and Links already seeded");
  }

  console.log("-------- Seed DB completed --------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
