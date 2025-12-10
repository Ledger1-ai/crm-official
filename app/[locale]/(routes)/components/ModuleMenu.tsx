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
import { Menu, Coins } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";


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

  return (

    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen sticky top-0">
        <div
          className={` ${open ? "w-72" : "w-24 "
            }  h-full p-5 pt-8 relative duration-300 sidebar border-r bg-background`}
          data-open={open ? "true" : "false"}
        >
          <div className={cn(
            "flex items-center",
            open ? "flex-row gap-x-4" : "flex-col gap-y-2"
          )}>
            <button
              aria-label="Toggle sidebar"
              aria-expanded={open}
              aria-controls="app-sidebar"
              className={cn(
                "sidebar-toggle transition-transform duration-300",
                open ? "rotate-0" : "",
                !open && "flex justify-center w-full"
              )}
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

            {/* Logo - Full logo when open, compact logo when closed */}
            {open ? (
              <img
                src="/logo.png"
                alt="App logo"
                className="h-8 w-auto origin-left duration-200"
              />
            ) : (
              <img
                src="/crmlogo.png"
                alt="App logo compact"
                className="h-8 w-auto duration-200"
              />
            )}
          </div>
          <div id="app-sidebar" className="pt-6 sidebar-list overflow-y-auto h-[calc(100vh-100px)]">
            <DashboardMenu open={open} title={dict.ModuleMenu.dashboard} />
            {modules.find(
              (menuItem: any) => menuItem.name === "crm" && menuItem.enabled
            ) && hasFeature("crm") ? (
              <div className="flex flex-row items-center p-2 w-auto md:w-full">
                <button
                  className={`menu-item ${pathname.includes("crm") ? "menu-item-active" : ""} w-full`}
                  onClick={() => router.push("/crm")}
                >
                  <Coins className="w-6 icon" />
                  <span className={open ? "" : "hidden"}>{dict.ModuleMenu.crm.title}</span>
                </button>
              </div>
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
          <div
            className={cn("flex justify-center items-center w-full mt-auto", {
              hidden: !open,
            })}
          >
            <span className="microtext text-gray-500 pb-2">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex flex-row overflow-x-auto items-center justify-between px-4 py-2 gap-4 no-scrollbar">
        <DashboardMenu open={false} title={dict.ModuleMenu.dashboard} />
        {modules.find(
          (menuItem: any) => menuItem.name === "crm" && menuItem.enabled
        ) && hasFeature("crm") ? (
          <div className="flex flex-row items-center p-2 w-auto md:w-full">
            <button
              className={`menu-item ${pathname.includes("crm") ? "menu-item-active" : ""}`}
              onClick={() => router.push("/crm")}
            >
              <Coins className="w-6 icon" />
            </button>
          </div>
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "projects" && menuItem.enabled
        ) && hasFeature("projects") ? (
          <ProjectModuleMenu open={false} title={dict.ModuleMenu.projects} />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "emails" && menuItem.enabled
        ) && hasFeature("emails") ? (
          <EmailsModuleMenu open={false} title={dict.ModuleMenu.emails} />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "employee" && menuItem.enabled
        ) && hasFeature("employee") ? (
          <EmployeesModuleMenu open={false} />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "invoice" && menuItem.enabled
        ) && hasFeature("invoices") ? (
          <InvoicesModuleMenu open={false} title={dict.ModuleMenu.invoices} />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "reports" && menuItem.enabled
        ) && hasFeature("reports") ? (
          <ReportsModuleMenu open={false} title={dict.ModuleMenu.reports} />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "documents" && menuItem.enabled
        ) && hasFeature("documents") ? (
          <DocumentsModuleMenu
            open={false}
            title={dict.ModuleMenu.documents}
          />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "databox" && menuItem.enabled
        ) && hasFeature("databox") ? (
          <DataboxModuleMenu open={false} />
        ) : null}
        {modules.find(
          (menuItem: any) => menuItem.name === "openai" && menuItem.enabled
        ) && hasFeature("openai") ? (
          <ChatGPTModuleMenu open={false} />
        ) : null}
        <AdministrationMenu open={false} title={dict.ModuleMenu.settings} />
        {isPartnerAdmin && <PartnerMenu open={false} />}
      </div>
    </>
  );
};

export default ModuleMenu;
