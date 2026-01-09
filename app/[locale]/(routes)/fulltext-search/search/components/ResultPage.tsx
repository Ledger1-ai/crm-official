"use client";
import React from "react";
import {
  Building2,
  Users,
  Target,
  Zap,
  FileText,
  Receipt,
  CheckSquare,
  LayoutDashboard,
  UserCircle,
  File
} from "lucide-react";
import { ResultsSection } from "./ResultsSection";

type Props = {
  results: any;
  search: string | null;
};

const ResultPage = ({ results, search }: Props) => {
  const data = results?.data || {};

  // If no results found at all
  const hasResults = Object.values(data).some(
    (arr: any) => Array.isArray(arr) && arr.length > 0
  );

  return (
    <div className="flex flex-col w-full h-full p-6 space-y-8 overflow-y-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Search Results
        </h1>
        <p className="text-muted-foreground">
          Showing results for <span className="font-semibold text-foreground">"{search}"</span>
        </p>
      </div>

      {!hasResults && (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
          <p className="text-lg font-medium text-muted-foreground">No matches found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms or filters.</p>
        </div>
      )}

      {/* CRM Section */}
      <ResultsSection
        title="Opportunities"
        data={data.opportunities}
        icon={Target}
        renderItem={(item) => ({
          title: item.name,
          subtitle: item.description,
          href: `/crm/opportunities/${item.id}`,
        })}
      />

      <ResultsSection
        title="Accounts"
        data={data.accounts}
        icon={Building2}
        renderItem={(item) => ({
          title: item.name,
          subtitle: item.email || item.description,
          href: `/crm/accounts/${item.id}`,
        })}
      />

      <ResultsSection
        title="Contacts"
        data={data.contacts}
        icon={Users}
        renderItem={(item) => ({
          title: `${item.first_name || ""} ${item.last_name || ""}`,
          subtitle: item.email,
          href: `/crm/contacts/${item.id}`,
        })}
      />

      <ResultsSection
        title="Leads"
        data={data.leads}
        icon={Zap}
        renderItem={(item) => ({
          title: `${item.firstName || ""} ${item.lastName || ""}`,
          subtitle: item.company || item.email,
          href: `/crm/leads/${item.id}`,
        })}
      />

      <ResultsSection
        title="Contracts"
        data={data.contracts}
        icon={FileText}
        renderItem={(item) => ({
          title: item.title,
          subtitle: item.description,
          href: `/crm/contracts/${item.id}`,
        })}
      />

      <ResultsSection
        title="Documents"
        data={data.documents}
        icon={File}
        renderItem={(item) => ({
          title: item.document_name,
          subtitle: item.description,
          href: `/documents/view/${item.id}`,
        })}
      />

      <ResultsSection
        title="Invoices"
        data={data.invoices}
        icon={Receipt}
        renderItem={(item) => ({
          title: item.invoice_number,
          subtitle: item.description || item.partner,
          href: `/crm/invoices/${item.id}`,
        })}
      />

      {/* Management Section */}
      <ResultsSection
        title="Projects"
        data={data.projects}
        icon={LayoutDashboard}
        renderItem={(item) => ({
          title: item.title,
          subtitle: item.description,
          href: `/projects/boards/${item.id}`,
        })}
      />

      <ResultsSection
        title="Tasks"
        data={data.tasks}
        icon={CheckSquare}
        renderItem={(item) => ({
          title: item.title,
          subtitle: item.content,
          href: `/crm/tasks`,
        })}
      />

      <ResultsSection
        title="Users"
        data={data.users}
        icon={UserCircle}
        renderItem={(item) => ({
          title: item.name || item.username,
          subtitle: item.email,
          href: `mailto:${item.email}`,
        })}
      />
    </div>
  );
};

export default ResultPage;
