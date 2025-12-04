import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

import { getDictionary } from "@/dictionaries";

import Container from "../components/ui/Container";
import NotionsBox from "./components/notions";
import LoadingBox from "./components/loading-box";
import { MetricsSummaryCard } from "./components/MetricsSummaryCard";
import { PipelineFunnel } from "./components/PipelineFunnel";
import { EntityBreakdown } from "./components/EntityBreakdown";
import { QuickStats } from "./components/RadialProgress";

import {
  getTasksCount,
  getUsersTasksCount,
} from "@/actions/dashboard/get-tasks-count";
import { getModules } from "@/actions/get-modules";
import { getEmployees } from "@/actions/get-empoloyees";
import { getLeadsCount } from "@/actions/dashboard/get-leads-count";
import { getBoardsCount } from "@/actions/dashboard/get-boards-count";
import { getStorageSize } from "@/actions/documents/get-storage-size";
import { getContactCount } from "@/actions/dashboard/get-contacts-count";
import { getAccountsCount } from "@/actions/dashboard/get-accounts-count";
import { getContractsCount } from "@/actions/dashboard/get-contracts-count";
import { getInvoicesCount } from "@/actions/dashboard/get-invoices-count";
import { getDocumentsCount } from "@/actions/dashboard/get-documents-count";
import { getActiveUsersCount } from "@/actions/dashboard/get-active-users-count";
import { getOpportunitiesCount } from "@/actions/dashboard/get-opportunities-count";
import { getExpectedRevenue } from "@/actions/crm/opportunity/get-expected-revenue";
import { getLeadsStageCounts } from "@/actions/dashboard/get-leads-stage-counts";
import { getTeamAnalytics } from "@/actions/dashboard/get-team-analytics";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  const userId = session?.user?.id;
  const lang = session?.user?.userLanguage;
  const dict = await getDictionary(lang as "en" | "cz" | "de" | "uk");

  // Fetch all data
  const [
    modules,
    leads,
    tasks,
    employees,
    storage,
    projects,
    contacts,
    contracts,
    users,
    accounts,
    invoices,
    revenue,
    documents,
    opportunities,
    usersTasks,
    leadsStageSummary,
    teamAnalytics,
  ] = await Promise.all([
    getModules(),
    getLeadsCount(),
    getTasksCount(),
    getEmployees(),
    getStorageSize(),
    getBoardsCount(),
    getContactCount(),
    getContractsCount(),
    getActiveUsersCount(),
    getAccountsCount(),
    getInvoicesCount(),
    getExpectedRevenue(),
    getDocumentsCount(),
    getOpportunitiesCount(),
    getUsersTasksCount(userId),
    getLeadsStageCounts(userId as string),
    getTeamAnalytics(),
  ]);

  // Pipeline data for my leads
  const myPipelineData = [
    { name: "Identify", value: leadsStageSummary.overall.counts.byStage.Identify, color: "slate" },
    { name: "Engage_AI", value: leadsStageSummary.overall.counts.byStage.Engage_AI, color: "cyan" },
    { name: "Engage_Human", value: leadsStageSummary.overall.counts.byStage.Engage_Human, color: "blue" },
    { name: "Offering", value: leadsStageSummary.overall.counts.byStage.Offering, color: "violet" },
    { name: "Finalizing", value: leadsStageSummary.overall.counts.byStage.Finalizing, color: "amber" },
    { name: "Closed", value: leadsStageSummary.overall.counts.byStage.Closed, color: "emerald" },
  ];

  // Pipeline data for team
  const teamPipelineData = [
    { name: "Identify", value: teamAnalytics.team.stageCounts.Identify, color: "slate" },
    { name: "Engage_AI", value: teamAnalytics.team.stageCounts.Engage_AI, color: "cyan" },
    { name: "Engage_Human", value: teamAnalytics.team.stageCounts.Engage_Human, color: "blue" },
    { name: "Offering", value: teamAnalytics.team.stageCounts.Offering, color: "violet" },
    { name: "Finalizing", value: teamAnalytics.team.stageCounts.Finalizing, color: "amber" },
    { name: "Closed", value: teamAnalytics.team.stageCounts.Closed, color: "emerald" },
  ];

  // Module checks
  const crmModule = modules.find((module) => module.name === "crm");
  const invoiceModule = modules.find((module) => module.name === "invoice");
  const projectsModule = modules.find((module) => module.name === "projects");
  const documentsModule = modules.find((module) => module.name === "documents");
  const employeesModule = modules.find((module) => module.name === "employees");
  const secondBrainModule = modules.find((module) => module.name === "secondBrain");

  // Build CRM entities for the breakdown component - using icon names as strings
  const crmEntities = [];
  if (crmModule?.enabled) {
    crmEntities.push(
      { name: "Accounts", value: accounts, href: "/crm/accounts", iconName: "LandmarkIcon", color: "cyan" as const },
      { name: "Contacts", value: contacts, href: "/crm/contacts", iconName: "Contact", color: "violet" as const },
      { name: "Leads", value: leads, href: "/crm/leads", iconName: "Coins", color: "emerald" as const },
      { name: "Opportunities", value: opportunities, href: "/crm/opportunities", iconName: "HeartHandshake", color: "amber" as const },
      { name: "Contracts", value: contracts, href: "/crm/contracts", iconName: "FilePenLine", color: "rose" as const },
    );
  }

  // Build project entities - using icon names as strings
  const projectEntities = [];
  if (projectsModule?.enabled) {
    projectEntities.push(
      { name: "Projects", value: projects, href: "/projects", iconName: "FolderKanban", color: "cyan" as const },
      { name: "All Tasks", value: tasks, href: "/projects/tasks", iconName: "CheckSquare", color: "violet" as const },
      { name: "My Tasks", value: usersTasks, href: `/projects/tasks/${userId}`, iconName: "Target", color: "emerald" as const },
    );
  }

  // Storage percentage (assuming 10GB max for display)
  const maxStorageMB = 10240; // 10GB in MB
  const storagePercentage = Math.min((storage / maxStorageMB) * 100, 100);

  return (
    <Container
      title={dict.DashboardPage.containerTitle}
      description={dict.DashboardPage.containerDescription}
    >
      {/* Top Metrics Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Suspense fallback={<LoadingBox />}>
          <MetricsSummaryCard
            title={dict.DashboardPage.expectedRevenue}
            value={revenue.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}
            subtitle="From open opportunities"
            iconName="DollarSign"
            accentColor="emerald"
            size="default"
          />
        </Suspense>

        <Suspense fallback={<LoadingBox />}>
          <MetricsSummaryCard
            title="Active Pipeline"
            value={leads + opportunities}
            subtitle={`${leads} leads, ${opportunities} opportunities`}
            iconName="TrendingUp"
            accentColor="cyan"
          />
        </Suspense>

        <Suspense fallback={<LoadingBox />}>
          <MetricsSummaryCard
            title={dict.DashboardPage.activeUsers}
            value={users}
            subtitle="Team members"
            iconName="Users2"
            accentColor="violet"
          />
        </Suspense>

        <Suspense fallback={<LoadingBox />}>
          <MetricsSummaryCard
            title="My Pending Tasks"
            value={usersTasks}
            subtitle={`of ${tasks} total tasks`}
            iconName="Zap"
            accentColor="amber"
          />
        </Suspense>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 mb-6">
        {/* Pipeline Funnels - Side by Side */}
        <div className="lg:col-span-6">
          <Suspense fallback={<LoadingBox />}>
            <PipelineFunnel
              title="My Pipeline"
              subtitle="Your personal sales funnel"
              data={myPipelineData}
              className="h-full"
            />
          </Suspense>
        </div>

        <div className="lg:col-span-6">
          <Suspense fallback={<LoadingBox />}>
            <PipelineFunnel
              title="Team Pipeline"
              subtitle="Organization-wide funnel"
              data={teamPipelineData}
              className="h-full"
            />
          </Suspense>
        </div>
      </div>

      {/* Entity Breakdowns */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
        {crmModule?.enabled && crmEntities.length > 0 && (
          <Suspense fallback={<LoadingBox />}>
            <EntityBreakdown
              title="CRM Overview"
              entities={crmEntities}
            />
          </Suspense>
        )}

        {projectsModule?.enabled && projectEntities.length > 0 && (
          <Suspense fallback={<LoadingBox />}>
            <EntityBreakdown
              title="Projects & Tasks"
              entities={projectEntities}
            />
          </Suspense>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
        <Suspense fallback={<LoadingBox />}>
          <QuickStats
            title="Activity Overview"
            stats={[
              {
                value: usersTasks,
                max: tasks || 1,
                label: "My Tasks",
                sublabel: "Assigned to me",
                color: "cyan",
              },
              {
                value: leadsStageSummary.overall.counts.byStage.Closed,
                max: leads || 1,
                label: "Closed",
                sublabel: "Converted leads",
                color: "emerald",
              },
              {
                value: opportunities,
                max: leads || 1,
                label: "Opportunities",
                sublabel: "Active deals",
                color: "violet",
              },
            ]}
          />
        </Suspense>

        {documentsModule?.enabled && (
          <Suspense fallback={<LoadingBox />}>
            <QuickStats
              title="Storage & Documents"
              stats={[
                {
                  value: documents,
                  max: 1000,
                  label: "Documents",
                  sublabel: "Total files",
                  color: "amber",
                },
                {
                  value: Math.round(storage),
                  max: maxStorageMB,
                  label: "Storage (MB)",
                  sublabel: `${storagePercentage.toFixed(1)}% used`,
                  color: storagePercentage > 80 ? "rose" : "cyan",
                },
              ]}
            />
          </Suspense>
        )}

        {invoiceModule?.enabled && (
          <Suspense fallback={<LoadingBox />}>
            <QuickStats
              title="Invoicing"
              stats={[
                {
                  value: invoices,
                  max: 100,
                  label: "Invoices",
                  sublabel: "Total created",
                  color: "emerald",
                },
                {
                  value: contracts,
                  max: 50,
                  label: "Contracts",
                  sublabel: "Active agreements",
                  color: "violet",
                },
              ]}
            />
          </Suspense>
        )}
      </div>

      {/* Additional Modules Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {employeesModule?.enabled && (
          <Suspense fallback={<LoadingBox />}>
            <MetricsSummaryCard
              title="Team Size"
              value={employees.length}
              subtitle="Total employees"
              iconName="Users2"
              accentColor="violet"
            />
          </Suspense>
        )}

        {/* {secondBrainModule?.enabled && (
          <Suspense fallback={<LoadingBox />}>
            <NotionsBox />
          </Suspense>
        )} */}
      </div>
    </Container>
  );
};

export default DashboardPage;
