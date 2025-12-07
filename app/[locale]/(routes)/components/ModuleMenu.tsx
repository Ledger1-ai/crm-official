"use client";

import React, { useEffect, useState } from "react";

import ProjectModuleMenu from "./menu-items/Projects";
import SecondBrainModuleMenu from "./menu-items/SecondBrain";
import InvoicesModuleMenu from "./menu-items/Invoices";
import ReportsModuleMenu from "./menu-items/Reports";
import DocumentsModuleMenu from "./menu-items/Documents";
import ChatGPTModuleMenu from "./menu-items/ChatGPT";
import EmployeesModuleMenu from "./menu-items/Employees";
import DataboxModuleMenu from "./menu-items/Databoxes";
import CrmModuleMenu from "./menu-items/Crm";

import AdministrationMenu from "./menu-items/Administration";
import PartnerMenu from "./menu-items/Partner";
import DashboardMenu from "./menu-items/Dashboard";
import EmailsModuleMenu from "./menu-items/Emails";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";



type Props = {
  modules: any;
  dict: any;
  features: string[]; // Replaced subscriptionPlan
  isPartnerAdmin: boolean;
};

const AnyMenu = Menu as any;

const ModuleMenu = ({ modules, dict, features, isPartnerAdmin }: Props) => {
  const [open, setOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

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

  return (
    <div className="flex flex-col">
      <div
        className={` ${open ? "w-72" : "w-24 "
          }  h-screen p-5  pt-8 relative duration-300 sidebar`}
        data-open={open ? "true" : "false"}
      >
        <div className="flex gap-x-4 items-center">
          <button
            aria-label="Toggle sidebar"
            aria-expanded={open}
            aria-controls="app-sidebar"
            className={`sidebar-toggle ${open ? "rotate-0" : ""}`}
            onClick={() => {
              const next = !open;
              setOpen(next);
              try {
                localStorage.setItem("sidebar-open", String(next));
              } catch (_) { }
            }}
          >
            <AnyMenu className="w-5 h-5" />
          </button>

          <img
            src="/logo.png"
            alt="App logo"
            className={`h-8 w-auto origin-left duration-200 ${!open && "scale-0"}`}
          />
        </div>
        <div id="app-sidebar" className="pt-6 sidebar-list">
          <DashboardMenu open={open} title={dict.ModuleMenu.dashboard} />
          {modules.find(
            (menuItem: any) => menuItem.name === "crm" && menuItem.enabled
          ) && hasFeature("crm") ? (
            <CrmModuleMenu open={open} localizations={dict.ModuleMenu.crm} />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "projects" && menuItem.enabled
          ) && hasFeature("projects") ? (
            <ProjectModuleMenu open={open} title={dict.ModuleMenu.projects} />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "emails" && menuItem.enabled
          ) && hasFeature("emails") ? (
            <EmailsModuleMenu open={open} title={dict.ModuleMenu.emails} />
          ) : null}
          {/* {modules.find(
            (menuItem: any) =>
              menuItem.name === "secondBrain" && menuItem.enabled
          ) ? (
            <SecondBrainModuleMenu open={open} />
          ) : null} */}
          {modules.find(
            (menuItem: any) => menuItem.name === "employee" && menuItem.enabled
          ) && hasFeature("employee") ? (
            <EmployeesModuleMenu open={open} />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "invoice" && menuItem.enabled
          ) && hasFeature("invoices") ? (
            <InvoicesModuleMenu open={open} title={dict.ModuleMenu.invoices} />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "reports" && menuItem.enabled
          ) && hasFeature("reports") ? (
            <ReportsModuleMenu open={open} title={dict.ModuleMenu.reports} />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "documents" && menuItem.enabled
          ) && hasFeature("documents") ? (
            <DocumentsModuleMenu
              open={open}
              title={dict.ModuleMenu.documents}
            />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "databox" && menuItem.enabled
          ) && hasFeature("databox") ? (
            <DataboxModuleMenu open={open} />
          ) : null}
          {modules.find(
            (menuItem: any) => menuItem.name === "openai" && menuItem.enabled
          ) && hasFeature("openai") ? (
            <ChatGPTModuleMenu open={open} />
          ) : null}
          <AdministrationMenu open={open} title={dict.ModuleMenu.settings} />
          {isPartnerAdmin && <PartnerMenu open={open} />}
        </div>
      </div>
      <div
        className={cn("flex justify-center items-center w-full", {
          hidden: !open,
        })}
      >
        <span className="microtext text-gray-500 pb-2">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </span>
      </div>
    </div>
  );
};

export default ModuleMenu;
