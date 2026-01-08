"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Coins, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemedLogo } from "@/components/ThemedLogo";

import ProjectModuleMenu from "./menu-items/Projects";
import SecondBrainModuleMenu from "./menu-items/SecondBrain";
import InvoicesModuleMenu from "./menu-items/Invoices";
import ReportsModuleMenu from "./menu-items/Reports";
import ChatGPTModuleMenu from "./menu-items/ChatGPT";
import EmployeesModuleMenu from "./menu-items/Employees";
import DataboxModuleMenu from "./menu-items/Databoxes";
import CrmModuleMenu from "./menu-items/Crm";
import MessagesModuleMenu from "./menu-items/Messages";
import FormBuilderModuleMenu from "./menu-items/FormBuilder";
import AdministrationMenu from "./menu-items/Administration";
import PartnerMenu from "./menu-items/Partner";
import DashboardMenu from "./menu-items/Dashboard";
import EmailsModuleMenu from "./menu-items/Emails";
import UniversityModuleMenu from "./menu-items/University";

type Props = {
  modules: any;
  dict: any;
  features: string[];
  isPartnerAdmin: boolean;
  teamRole?: string;
};

const AnyMenu = Menu as any;

const sidebarVariants = {
  expanded: {
    width: "14rem", // w-56
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      staggerChildren: 0.05,
    } as const,
  },
  collapsed: {
    width: "6rem", // w-24
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      staggerChildren: 0.05,
    } as const,
  },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0, display: "block" },
  collapsed: { opacity: 0, x: -20, transitionEnd: { display: "none" } },
};

const compactLogoVariants = {
  expanded: { opacity: 0, x: -20, display: "none" },
  collapsed: { opacity: 1, x: 0, display: "block" },
};

const ModuleMenu = ({ modules, dict, features, isPartnerAdmin, teamRole = "MEMBER" }: Props) => {
  const [open, setOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const hasFeature = (feature: string) => features.includes("all") || features.includes(feature);

  useEffect(() => {
    setIsMounted(true);
    try {
      const persisted = localStorage.getItem("sidebar-open");
      if (persisted !== null) {
        setOpen(persisted === "true");
      }
    } catch (_) { }
  }, []);

  if (!isMounted) {
    return null;
  }

  const toggleSidebar = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem("sidebar-open", String(next));
    } catch (_) { }
  };

  return (
    <>
      <div className="hidden md:flex h-screen sticky top-0 z-[100]">
        <motion.div
          initial={open ? "expanded" : "collapsed"}
          animate={open ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          className={cn(
            "relative h-full flex flex-col border-r shadow-xl group", // Removed overflow-hidden
            // Glassmorphism & Premium Aesthetics
            "bg-gradient-to-b from-background/95 via-background/90 to-background/95", // Subtle gradient
            "backdrop-blur-xl", // Heavy blur for glass effect
            "border-white/5" // Subtle border
          )}
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
          </div>

          {/* Header / Logo Area */}
          <div className="flex items-center justify-center h-20 mb-2 relative shrink-0">
            {/* Full Logo (Expanded) */}
            <motion.div variants={logoVariants} className="absolute left-6">
              <ThemedLogo
                variant="wide"
                className="h-12 w-auto object-contain"
              />
            </motion.div>

            {/* Compact Logo (Collapsed) - Centered */}
            <motion.div variants={compactLogoVariants} className="absolute">
              <ThemedLogo
                variant="compact"
                className="h-10 w-auto object-contain"
              />
            </motion.div>
          </div>

          {/* Toggle Button - Floating on the border, visible on hover */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute -right-3 top-20 z-[100]", // Positioned lower (next to dashboard approx) and higher z-index
              "h-6 w-6 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground shadow-md transition-all duration-200",
              "opacity-0 group-hover:opacity-100", // Hidden until hover
              "hover:scale-110 focus:outline-none ring-2 ring-background"
            )}
          >
            {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>


          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
            <div className="flex flex-col gap-1 px-3">
              <DashboardMenu open={open} title={dict.ModuleMenu.dashboard} />

              {/* Separator for clarity */}
              <div className="my-2 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent opacity-50 mx-2" />

              {modules.find((m: any) => m.name === "projects" && m.enabled) && hasFeature("projects") && teamRole !== "MEMBER" && (
                <ProjectModuleMenu open={open} title={dict.ModuleMenu.projects} />
              )}

              {modules.find(
                (menuItem: any) => menuItem.name === "crm" && menuItem.enabled
              ) && hasFeature("crm") && (
                  <CrmModuleMenu open={open} localizations={dict.ModuleMenu.crm} />
                )}

              {/* Other Modules */}
              {/* Note: I am not refactoring EVERY component separately yet, but passing 'open' creates re-renders. 
                    Ideally, these sub-menus should also be wrapped or updated. 
                    For now, I rely on their internal rendering but the container gives the width constraint. */}
              {modules.find((m: any) => m.name === "emails" && m.enabled) && hasFeature("emails") && (
                <EmailsModuleMenu open={open} title={dict.ModuleMenu.emails} />
              )}
              {modules.find((m: any) => m.name === "messages" && m.enabled) && hasFeature("messages") && (
                <>
                  <MessagesModuleMenu open={open} title={dict.ModuleMenu.messages || "Messages"} />
                  <FormBuilderModuleMenu open={open} />
                </>
              )}
              {modules.find((m: any) => m.name === "employee" && m.enabled) && hasFeature("employee") && teamRole !== "MEMBER" && (
                <EmployeesModuleMenu open={open} />
              )}
              {modules.find((m: any) => m.name === "invoice" && m.enabled) && hasFeature("invoices") && (
                <InvoicesModuleMenu open={open} title={dict.ModuleMenu.invoices} />
              )}
              {modules.find((m: any) => m.name === "reports" && m.enabled) && hasFeature("reports") && (
                <ReportsModuleMenu open={open} title={dict.ModuleMenu.reports} />
              )}
              <UniversityModuleMenu open={open} title="University" />
              {modules.find((m: any) => m.name === "databox" && m.enabled) && hasFeature("databox") && teamRole !== "MEMBER" && (
                <DataboxModuleMenu open={open} />
              )}
              {modules.find((m: any) => m.name === "openai" && m.enabled) && hasFeature("openai") && (
                <ChatGPTModuleMenu open={open} />
              )}
              {teamRole !== "MEMBER" && <AdministrationMenu open={open} title={dict.ModuleMenu.settings} />}
              {isPartnerAdmin && <PartnerMenu open={open} />}
            </div>
          </div>

          {/* Footer / Version */}
          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            className="p-4 flex justify-center shrink-0"
          >
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Bottom Navigation (Preserved/Minimally Touched) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-t border-white/5 flex flex-row overflow-x-auto items-center justify-between px-4 py-2 gap-4 no-scrollbar safe-area-pb">
        <DashboardMenu open={false} title={dict.ModuleMenu.dashboard} isMobile />
        {modules.find((m: any) => m.name === "projects" && m.enabled) && hasFeature("projects") && teamRole !== "MEMBER" && (
          <ProjectModuleMenu open={false} title={dict.ModuleMenu.projects} isMobile />
        )}
        {modules.find((m: any) => m.name === "crm" && m.enabled) && hasFeature("crm") && (
          <CrmModuleMenu open={false} localizations={dict.ModuleMenu.crm} isMobile />
        )}
        {modules.find((m: any) => m.name === "emails" && m.enabled) && hasFeature("emails") && (
          <EmailsModuleMenu open={false} title={dict.ModuleMenu.emails} isMobile />
        )}
        {modules.find((m: any) => m.name === "messages" && m.enabled) && hasFeature("messages") && (
          <>
            <MessagesModuleMenu open={false} title={dict.ModuleMenu.messages || "Messages"} isMobile />
            <FormBuilderModuleMenu open={false} isMobile />
          </>
        )}
        {modules.find((m: any) => m.name === "employee" && m.enabled) && hasFeature("employee") && teamRole !== "MEMBER" && (
          <EmployeesModuleMenu open={false} isMobile />
        )}
        {modules.find((m: any) => m.name === "invoice" && m.enabled) && hasFeature("invoices") && (
          <InvoicesModuleMenu open={false} title={dict.ModuleMenu.invoices} isMobile />
        )}
        {modules.find((m: any) => m.name === "reports" && m.enabled) && hasFeature("reports") && (
          <ReportsModuleMenu open={false} title={dict.ModuleMenu.reports} isMobile />
        )}
        <UniversityModuleMenu open={false} title="University" isMobile />
        {modules.find((m: any) => m.name === "databox" && m.enabled) && hasFeature("databox") && teamRole !== "MEMBER" && (
          <DataboxModuleMenu open={false} isMobile />
        )}
        {modules.find((m: any) => m.name === "openai" && m.enabled) && hasFeature("openai") && (
          <ChatGPTModuleMenu open={false} isMobile />
        )}
        {teamRole !== "MEMBER" && <AdministrationMenu open={false} title={dict.ModuleMenu.settings} isMobile />}
        {isPartnerAdmin && <PartnerMenu open={false} isMobile />}
      </div>
    </>
  );
};

export default ModuleMenu;
