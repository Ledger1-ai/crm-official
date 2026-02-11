"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Target,
  Radio,
  FileText,
  Phone,
  Package,
  Headset,
  Megaphone,
  Wand2,
  FormInput,
  Building2,
  Contact,
  Folder,
  CheckSquare,
  FileCheck,
  FileBarChart,
  UserCog,
  Zap,
  Shield,
  CheckCircle2,
  Wrench,
  GraduationCap,
  Globe,
  Mail,
  ServerIcon,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemedLogo } from "@/components/ThemedLogo";

import MenuItem from "./menu-items/MenuItem";
import ExpandableMenuItem, { SubMenuItemType } from "./menu-items/ExpandableMenuItem";
import HubLabel from "./menu-items/HubLabel";

// ─── Types ───────────────────────────────────────────────
type Props = {
  modules: any;
  dict: any;
  features: string[];
  isPartnerAdmin: boolean;
  teamRole?: string;
  serviceBadge?: number;
};

// ─── Sidebar Animation Variants ──────────────────────────
const sidebarVariants = {
  expanded: {
    width: "11.25rem",
    transition: { type: "spring", stiffness: 200, damping: 25 } as const,
  },
  collapsed: {
    width: "4.5rem",
    transition: { type: "spring", stiffness: 200, damping: 25 } as const,
  },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0, display: "block" as const },
  collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" as const } },
};

const compactLogoVariants = {
  expanded: { opacity: 0, x: -10, display: "none" as const },
  collapsed: { opacity: 1, x: 0, display: "block" as const },
};

// ─── Component ───────────────────────────────────────────
const ModuleMenu = ({ modules, dict, features, isPartnerAdmin, teamRole = "MEMBER", serviceBadge = 0 }: Props) => {
  const [open, setOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const hasFeature = (feature: string) => features.includes("all") || features.includes(feature);
  const hasModule = (name: string) => modules.find((m: any) => m.name === name && m.enabled);
  const isNonMember = teamRole !== "MEMBER";

  // ─── Active state helpers ────────────────
  const isPath = (pattern: RegExp) => pattern.test(pathname);
  const startsWithPath = (path: string) => pathname.startsWith(path);
  const isDashboard = pathname === "/dashboard" || /^\/[a-zA-Z0-9-]+\/dashboard(\/|$)/.test(pathname);
  const isCrmLeads = isPath(/^\/([a-z]{2}\/)?crm\/leads/) || isPath(/^\/([a-z]{2}\/)?crm\/lead-wizard/) || isPath(/^\/([a-z]{2}\/)?crm\/lead-pools/) || isPath(/^\/([a-z]{2}\/)?crm\/campaigns/);
  const isCrmOpps = isPath(/^\/([a-z]{2}\/)?crm\/opportunities/);
  const isCrmCommand = isPath(/^\/([a-z]{2}\/)?crm\/sales-command/);
  const isCrmDialer = isPath(/^\/([a-z]{2}\/)?crm\/dialer/);
  const isCrmQuotes = isPath(/^\/([a-z]{2}\/)?crm\/quotes/);
  const isCrmProducts = isPath(/^\/([a-z]{2}\/)?crm\/products/);
  const isCrmCases = isPath(/^\/([a-z]{2}\/)?crm\/cases/);
  const isCrmOutreach = isPath(/^\/([a-z]{2}\/)?crm\/outreach/);
  const isCrmWizard = isPath(/^\/([a-z]{2}\/)?crm\/lead-wizard/);
  const isCrmForms = isPath(/^\/([a-z]{2}\/)?messages\/forms/);
  const isCrmAccounts = isPath(/^\/([a-z]{2}\/)?crm\/accounts/);
  const isCrmContacts = isPath(/^\/([a-z]{2}\/)?crm\/contacts/);
  const isCrmContracts = isPath(/^\/([a-z]{2}\/)?crm\/contracts/);
  const isCrmProjects = isPath(/^\/([a-z]{2}\/)?crm\/my-projects/) || isPath(/^\/([a-z]{2}\/)?campaigns/);
  const isCrmTasks = isPath(/^\/([a-z]{2}\/)?projects\/tasks/);
  const isInvoice = isPath(/^\/([a-z]{2}\/)?invoice/);
  const isReports = isPath(/^\/([a-z]{2}\/)?reports/);
  const isEmployees = isPath(/^\/([a-z]{2}\/)?employees/);
  const isFlows = isPath(/^\/([a-z]{2}\/)?crm\/workflows/);
  const isGuards = isPath(/^\/([a-z]{2}\/)?crm\/validation-rules/);
  const isApprovals = isPath(/^\/([a-z]{2}\/)?crm\/approvals/);
  const isAdmin = isPath(/^\/([a-z]{2}\/)?admin/);
  const isUniversity = startsWithPath("/crm/university");
  const isPartner = isPath(/^\/([a-z]{2}\/)?partners/);
  const isEmails = isPath(/^\/([a-z]{2}\/)?emails/);
  const isMessages = isPath(/^\/([a-z]{2}\/)?messages(\/|$)/);

  // ─── Flyout sub-items ────────────────────
  const leadsSubItems: SubMenuItemType[] = [
    { label: "LeadGen Wizard", href: "/crm/lead-wizard", icon: Wand2 },
    { label: "Lead Pools", href: "/crm/lead-pools", icon: Target },
    { label: "Outreach", href: "/crm/outreach", icon: Megaphone },
  ];

  const oppsSubItems: SubMenuItemType[] = [
    { label: "Pipeline View", href: "/crm/opportunities" },
    { label: "Won / Lost", href: "/crm/opportunities?view=closed" },
  ];

  const commandSubItems: SubMenuItemType[] = [
    { label: "My Command", href: "/crm/sales-command" },
    { label: "Team Command", href: "/crm/sales-command?view=team" },
  ];

  const serviceSubItems: SubMenuItemType[] = [
    { label: "Agent Workspace", href: "/crm/cases" },
    { label: "Case Queue", href: "/crm/cases?view=queue" },
    { label: "Knowledge Base", href: "/crm/cases?view=kb" },
  ];

  const contractsSubItems: SubMenuItemType[] = [
    { label: "All Contracts", href: "/crm/contracts" },
    { label: "Deal Rooms", href: "/crm/contracts?view=rooms" },
  ];

  const flowsSubItems: SubMenuItemType[] = [
    { label: "All Workflows", href: "/crm/workflows" },
    { label: "Visual Editor", href: "/crm/workflows?view=editor" },
  ];

  const platformSubItems: SubMenuItemType[] = [
    { label: "Team Management", href: "/partners" },
    { label: "System Keys", href: "/partners/ai-system-config" },
    { label: "Model Pricing", href: "/partners/ai-pricing" },
    { label: "System Email", href: "/partners/email-system-config" },
    { label: "Manage Plans", href: "/partners/plans" },
  ];

  // ─── Hydration ───────────────────────────
  useEffect(() => {
    setIsMounted(true);
    try {
      const persisted = localStorage.getItem("sidebar-open");
      if (persisted !== null) setOpen(persisted === "true");
    } catch (_) { }
  }, []);

  if (!isMounted) return null;

  const toggleSidebar = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem("sidebar-open", String(next)); } catch (_) { }
  };

  // ─── Render ──────────────────────────────
  return (
    <>
      {/* ═══════════════ DESKTOP SIDEBAR ═══════════════ */}
      <div className="hidden md:flex h-screen sticky top-0 z-[100]">
        <motion.div
          data-sidebar
          initial={open ? "expanded" : "collapsed"}
          animate={open ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          className={cn(
            "relative h-full flex flex-col border-r border-primary/20 shadow-xl group",
            "bg-gradient-to-b from-background/95 via-background/90 to-background/95",
            "backdrop-blur-xl"
          )}
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
          </div>

          {/* ─── Logo ─── */}
          <div className="flex items-center justify-center h-16 relative shrink-0 overflow-hidden">
            <motion.div variants={logoVariants} className="absolute left-3">
              <ThemedLogo variant="wide" className="h-9 w-auto object-contain" />
            </motion.div>
            <motion.div variants={compactLogoVariants} className="absolute">
              <ThemedLogo variant="compact" className="h-8 w-auto object-contain" />
            </motion.div>
          </div>

          {/* ─── Toggle Button ─── */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute -right-3 top-16 z-[100]",
              "h-6 w-6 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground shadow-md transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              "hover:scale-110 focus:outline-none ring-2 ring-background"
            )}
          >
            {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {/* ─── Scrollable Navigation ─── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
            <div className="flex flex-col gap-0.5 px-1.5">

              {/* ══════ HOME ══════ */}
              <MenuItem
                href="/dashboard"
                icon={Home}
                title={dict.ModuleMenu.dashboard}
                isOpen={open}
                isActive={isDashboard}
              />

              {/* ══════ SALES HUB ══════ */}
              <HubLabel label="Sales Hub" isOpen={open} />

              <ExpandableMenuItem
                href="/crm/sales-command"
                icon={Radio}
                title="Command"
                isOpen={open}
                isActive={isCrmCommand}
                items={commandSubItems}
              />
              <ExpandableMenuItem
                href="/crm/opportunities"
                icon={Target}
                title="Deals"
                isOpen={open}
                isActive={isCrmOpps}
                items={oppsSubItems}
              />
              <MenuItem
                href="/crm/dialer"
                icon={Phone}
                title="Dialer"
                isOpen={open}
                isActive={isCrmDialer}
              />
              <MenuItem
                href="/crm/quotes"
                icon={FileText}
                title="Quotes"
                isOpen={open}
                isActive={isCrmQuotes}
              />

              {/* ══════ SERVICE HUB ══════ */}
              <HubLabel label="Service Hub" isOpen={open} />

              <ExpandableMenuItem
                href="/crm/cases"
                icon={Headset}
                title="Service"
                isOpen={open}
                isActive={isCrmCases}
                items={serviceSubItems}
                badge={serviceBadge}
              />

              {/* ══════ MARKETING HUB ══════ */}
              {isNonMember && (
                <>
                  <HubLabel label="Marketing Hub" isOpen={open} />

                  {hasModule("messages") && hasFeature("messages") && (
                    <MenuItem
                      href="/messages/forms"
                      icon={FormInput}
                      title="Forms"
                      isOpen={open}
                      isActive={isCrmForms}
                    />
                  )}

                  <ExpandableMenuItem
                    href="/crm/leads"
                    icon={Users}
                    title="Leads"
                    isOpen={open}
                    isActive={isCrmLeads}
                    items={leadsSubItems}
                  />

                  {hasModule("projects") && hasFeature("projects") && (
                    <MenuItem
                      href="/campaigns"
                      icon={ServerIcon}
                      title={dict.ModuleMenu.projects || "Projects"}
                      isOpen={open}
                      isActive={isCrmProjects}
                    />
                  )}
                </>
              )}

              {/* ══════ OPERATIONS ══════ */}
              <HubLabel label="Operations" isOpen={open} />

              <MenuItem
                href="/crm/accounts"
                icon={Building2}
                title="Accounts"
                isOpen={open}
                isActive={isCrmAccounts}
              />
              <MenuItem
                href="/crm/contacts"
                icon={Contact}
                title="Contacts"
                isOpen={open}
                isActive={isCrmContacts}
              />
              <ExpandableMenuItem
                href="/crm/contracts"
                icon={FileText}
                title="Contracts"
                isOpen={open}
                isActive={isCrmContracts}
                items={contractsSubItems}
              />

              <MenuItem
                href="/crm/products"
                icon={Package}
                title="Products"
                isOpen={open}
                isActive={isCrmProducts}
              />

              {/* ══════ MANAGEMENT ══════ */}
              {isNonMember && (
                <>
                  <HubLabel label="Management" isOpen={open} />

                  {hasModule("invoice") && hasFeature("invoices") && (
                    <MenuItem
                      href="/invoice"
                      icon={FileCheck}
                      title={dict.ModuleMenu.invoices || "Invoices"}
                      isOpen={open}
                      isActive={isInvoice}
                    />
                  )}
                  {hasModule("reports") && hasFeature("reports") && (
                    <MenuItem
                      href="/reports"
                      icon={FileBarChart}
                      title={dict.ModuleMenu.reports || "Reports"}
                      isOpen={open}
                      isActive={isReports}
                    />
                  )}
                  {hasModule("employee") && hasFeature("employee") && (
                    <MenuItem
                      href="/employees"
                      icon={UserCog}
                      title="Staff"
                      isOpen={open}
                      isActive={isEmployees}
                    />
                  )}
                </>
              )}

              {/* ══════ AUTOMATION ══════ */}
              {isNonMember && (
                <>
                  <HubLabel label="Automation" isOpen={open} />

                  <MenuItem
                    href="/crm/approvals"
                    icon={CheckCircle2}
                    title="Approvals"
                    isOpen={open}
                    isActive={isApprovals}
                  />
                  <ExpandableMenuItem
                    href="/crm/workflows"
                    icon={Zap}
                    title="Flows"
                    isOpen={open}
                    isActive={isFlows}
                    items={flowsSubItems}
                  />
                  <MenuItem
                    href="/crm/validation-rules"
                    icon={Shield}
                    title="Guards"
                    isOpen={open}
                    isActive={isGuards}
                  />
                </>
              )}

              {/* ══════ SYSTEM ══════ */}
              {isNonMember && (
                <>
                  <HubLabel label="System" isOpen={open} />

                  <MenuItem
                    href="/admin"
                    icon={Wrench}
                    title={dict.ModuleMenu.settings || "Admin"}
                    isOpen={open}
                    isActive={isAdmin}
                  />
                  <MenuItem
                    href="/crm/university"
                    icon={GraduationCap}
                    title="Learn"
                    isOpen={open}
                    isActive={isUniversity}
                  />
                </>
              )}

              {/* ══════ PLATFORM (Partner Admin only) ══════ */}
              {isPartnerAdmin && (
                <>
                  <HubLabel label="Platform" isOpen={open} isDouble />

                  <ExpandableMenuItem
                    href="/partners"
                    icon={Globe}
                    title="Platform"
                    isOpen={open}
                    isActive={isPartner}
                    items={platformSubItems}
                  />
                </>
              )}

            </div>
          </div>

          {/* ─── Footer / Version ─── */}
          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            className="p-3 flex justify-center shrink-0"
          >
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-t border-white/5 flex flex-row overflow-x-auto items-center justify-between px-4 py-2 gap-4 no-scrollbar safe-area-pb">
        <MenuItem href="/dashboard" icon={Home} title={dict.ModuleMenu.dashboard} isOpen={false} isActive={isDashboard} isMobile />
        <MenuItem href="/crm/leads" icon={Users} title="Sales" isOpen={false} isActive={isCrmLeads || isCrmOpps || isCrmCommand} isMobile />
        <MenuItem href="/crm/cases" icon={Headset} title="Service" isOpen={false} isActive={isCrmCases} isMobile />
        <MenuItem href="/crm/accounts" icon={Building2} title="Ops" isOpen={false} isActive={isCrmAccounts || isCrmContacts || isCrmContracts} isMobile />
        {hasModule("emails") && hasFeature("emails") && (
          <MenuItem href="/emails" icon={Mail} title={dict.ModuleMenu.emails} isOpen={false} isActive={isEmails} isMobile />
        )}
        {isNonMember && (
          <MenuItem href="/admin" icon={Wrench} title={dict.ModuleMenu.settings} isOpen={false} isActive={isAdmin} isMobile />
        )}
        {isPartnerAdmin && (
          <MenuItem href="/partners" icon={Globe} title="Platform" isOpen={false} isActive={isPartner} isMobile />
        )}
      </div>
    </>
  );
};

export default ModuleMenu;
