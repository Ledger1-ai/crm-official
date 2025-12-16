//import { PrismaClient } from "@prisma/client";
const { PrismaClient } = require("@prisma/client");
/*
Seed data is used to populate the database with initial data.
*/
//Menu Items
const moduleData = require("../initial-data/system_Modules_Enabled.json");
//GPT Models
const gptModelsData = require("../initial-data/gpt_Models.json");
//CRM
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

  //Seed AI Models (migrated from gpt_models + new defaults)
  const defaultModels = [
    // OpenAI
    { name: "GPT-5 (Preview)", modelId: "gpt-5-preview", provider: "OPENAI", isActive: true },
    { name: "GPT-5", modelId: "gpt-5", provider: "OPENAI", isActive: true },
    { name: "GPT-4o", modelId: "gpt-4o", provider: "OPENAI", isActive: true },
    { name: "GPT-4 Turbo", modelId: "gpt-4-turbo", provider: "OPENAI", isActive: true },
    { name: "o1 Preview", modelId: "o1-preview", provider: "OPENAI", isActive: true },

    // Azure (Legacy + New)
    { name: "Azure GPT-5 (Preview)", modelId: "gpt-5-preview", provider: "AZURE", isActive: true },
    { name: "Azure GPT-5", modelId: "gpt-5", provider: "AZURE", isActive: true },
    { name: "Azure GPT-4o", modelId: "gpt-4o", provider: "AZURE", isActive: true },
    { name: "Azure GPT-4 Turbo", modelId: "gpt-4-turbo", provider: "AZURE", isActive: true },
    { name: "Azure GPT-3.5 Turbo", modelId: "gpt-35-turbo", provider: "AZURE", isActive: true },

    // Anthropic
    { name: "Claude 4.5 Sonnet", modelId: "claude-4-5-sonnet-latest", provider: "ANTHROPIC", isActive: true },
    { name: "Claude 4.5 Opus", modelId: "claude-4-5-opus-latest", provider: "ANTHROPIC", isActive: true },
    { name: "Claude 4.5 Haiku", modelId: "claude-4-5-haiku-latest", provider: "ANTHROPIC", isActive: true },

    // Google
    { name: "Gemini 3.0 Pro", modelId: "gemini-3.0-pro", provider: "GOOGLE", isActive: true },
    { name: "Gemini 3.0 Flash", modelId: "gemini-3.0-flash", provider: "GOOGLE", isActive: true },

    // Mistral
    { name: "Mistral Large 2", modelId: "mistral-large-latest", provider: "MISTRAL", isActive: true },

    // Perplexity
    { name: "Llama 3.1 Sonar Ex Large", modelId: "llama-3.1-sonar-e-large-128k-online", provider: "PERPLEXITY", isActive: true },

    // Grok
    { name: "Grok 2", modelId: "grok-2", provider: "GROK", isActive: true },

    // Deepseek
    { name: "DeepSeek Chat", modelId: "deepseek-chat", provider: "DEEPSEEK", isActive: true },
  ];

  // Proper Sync Logic
  for (const m of defaultModels) {
    const existing = await prisma.aiModel.findFirst({
      where: { modelId: m.modelId, provider: m.provider }
    });

    if (!existing) {
      await prisma.aiModel.create({
        data: {
          name: m.name,
          modelId: m.modelId,
          provider: m.provider as any,
          isActive: m.isActive ?? true,
          inputPrice: 0,
          outputPrice: 0
        }
      });
      console.log(`Created ${m.provider} - ${m.name}`);
    } else {
      await prisma.aiModel.update({
        where: { id: existing.id },
        data: {
          name: m.name,
          isActive: m.isActive ?? true
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
        socialXUrl: "https://x.com/Ledger1AI",
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
