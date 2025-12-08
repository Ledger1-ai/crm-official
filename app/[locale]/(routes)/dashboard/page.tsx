import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

import { getDictionary } from "@/dictionaries";

import Container from "../components/ui/Container";
import NotionsBox from "./components/notions";
import LoadingBox from "./components/loading-box";
import { MetricsSummaryCard } from "./components/MetricsSummaryCard";
import { EntityBreakdown } from "./components/EntityBreakdown";

import { getModules } from "@/actions/get-modules";
import { getEmployees } from "@/actions/get-empoloyees";
import { getUsersTasksCount } from "@/actions/dashboard/get-tasks-count";
import { getSummaryCounts } from "@/actions/dashboard/get-summary-counts";
import MyPipelineSection from "./components/MyPipelineSection";
import TeamPipelineSection from "./components/TeamPipelineSection";
import ActivityOverviewSection from "./components/ActivityOverviewSection";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session?.user?.id as string;
  const lang = session?.user?.userLanguage as "en" | "cz" | "de" | "uk";
  const dict = await getDictionary(lang);

  // Fetch lightweight essentials first to render fast
  const [modules, employees, counts, usersTasks] = await Promise.all([
    getModules(),
    getEmployees(),
    getSummaryCounts(),
    getUsersTasksCount(userId),
  ]);

  // Module checks
  const crmModule = modules.find((module) => module.name === "crm");
  const invoiceModule = modules.find((module) => module.name === "invoice");
  const projectsModule = modules.find((module) => module.name === "projects");
  const documentsModule = modules.find((module) => module.name === "documents");
  const employeesModule = modules.find((module) => module.name === "employees");
  const secondBrainModule = modules.find((module) => module.name === "secondBrain");

  // Build CRM entities for the breakdown component - using icon names as strings
  const crmEntities: { name: string; value: number; href: string; iconName: string; color: "cyan" | "violet" | "emerald" | "amber" | "rose" }[] = [];
  if (crmModule?.enabled) {
    crmEntities.push(
      { name: "Accounts", value: counts.accounts, href: "/crm/accounts", iconName: "LandmarkIcon", color: "cyan" },
      { name: "Contacts", value: counts.contacts, href: "/crm/contacts", iconName: "Contact", color: "violet" },
      { name: "Leads", value: counts.leads, href: "/crm/leads", iconName: "Coins", color: "emerald" },
      { name: "Opportunities", value: counts.opportunities, href: "/crm/opportunities", iconName: "HeartHandshake", color: "amber" },
      { name: "Contracts", value: counts.contracts, href: "/crm/contracts", iconName: "FilePenLine", color: "rose" },
    );
  }

  // Build project entities - using icon names as strings
  const projectEntities: { name: string; value: number; href: string; iconName: string; color: "cyan" | "violet" | "emerald" }[] = [];
  if (projectsModule?.enabled) {
    projectEntities.push(
      { name: "Projects", value: counts.boards, href: "/projects", iconName: "FolderKanban", color: "cyan" },
      { name: "All Tasks", value: counts.tasks, href: "/projects/tasks", iconName: "CheckSquare", color: "violet" },
      { name: "My Tasks", value: usersTasks, href: `/projects/tasks/${userId}` , iconName: "Target", color: "emerald" },
    );
  }

  // Storage percentage (assuming 10GB max for display)
  const maxStorageMB = 10240; // 10GB in MB
  const storagePercentage = Math.min((counts.storageMB / maxStorageMB) * 100, 100);

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
            value={counts.revenue.toLocaleString("en-US", {
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
            value={counts.leads + counts.opportunities}
            subtitle={`${counts.leads} leads, ${counts.opportunities} opportunities`}
            iconName="TrendingUp"
            accentColor="cyan"
          />
        </Suspense>

        <Suspense fallback={<LoadingBox />}>
          <MetricsSummaryCard
            title={dict.DashboardPage.activeUsers}
            value={counts.users}
            subtitle="Team members"
            iconName="Users2"
            accentColor="violet"
          />
        </Suspense>

        <Suspense fallback={<LoadingBox />}>
          <MetricsSummaryCard
            title="My Pending Tasks"
            value={usersTasks}
            subtitle={`of ${counts.tasks} total tasks`}
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
            {/* Deferred server component */}
            <MyPipelineSection userId={userId} />
          </Suspense>
        </div>

        <div className="lg:col-span-6">
          <Suspense fallback={<LoadingBox />}>
            {/* Deferred server component */}
            <TeamPipelineSection />
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
          {/* Deferred server component for activity overview */}
          <ActivityOverviewSection
            userId={userId}
            opportunities={counts.opportunities}
            tasks={counts.tasks}
            usersTasks={usersTasks}
          />
        </Suspense>

        {documentsModule?.enabled && (
          <Suspense fallback={<LoadingBox />}>
            <MetricsSummaryCard
              title="Storage & Documents"
              value={counts.documents}
              subtitle={`${counts.storageMB} MB stored (${storagePercentage.toFixed(1)}% used)`}
              iconName="HardDrive"
              accentColor={storagePercentage > 80 ? "rose" : "cyan"}
            />
          </Suspense>
        )}

        {invoiceModule?.enabled && (
          <Suspense fallback={<LoadingBox />}>
            <MetricsSummaryCard
              title="Invoicing"
              value={counts.invoices}
              subtitle={`${counts.contracts} active contracts`}
              iconName="FileText"
              accentColor="emerald"
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
