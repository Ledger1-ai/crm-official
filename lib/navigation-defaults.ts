
import {
    Home, Users, Target, Radio, FileText, Phone, Package, Headset, Megaphone, Wand2, FormInput, Building2, Contact, Folder, CheckSquare, FileCheck, FileBarChart, UserCog, Zap, Shield, CheckCircle2, Wrench, GraduationCap, Globe, Mail, ServerIcon, MessageSquare, Calendar
} from "lucide-react";

export type NavItemType = "item" | "group";

export interface NavPermission {
    module?: string;
    feature?: string;
    minRole?: "MEMBER" | "ADMIN" | "PARTNER_ADMIN"; // ADMIN = isNonMember in current logic
}

export interface NavItem {
    id: string;
    type: NavItemType;
    label: string;
    iconName?: string;
    href?: string;
    children?: NavItem[];
    permissions?: NavPermission;
    isSystem?: boolean; // If true, can't be deleted?
    badge?: string; // e.g. "serviceBadge"
    hidden?: boolean;
}

export const DEFAULT_NAV_STRUCTURE: NavItem[] = [
    // 1. HOME
    {
        id: "nav_home",
        type: "item",
        label: "Dashboard",
        iconName: "Home",
        href: "/dashboard"
    },

    // 2. SALES HUB
    {
        id: "group_sales",
        type: "group",
        label: "Sales Hub",
        children: [
            {
                id: "nav_command",
                type: "item",
                label: "Command",
                iconName: "Radio",
                href: "/crm/sales-command",
                children: [
                    { id: "sub_command_my", type: "item", label: "My Command", href: "/crm/sales-command" },
                    { id: "sub_command_team", type: "item", label: "Team Command", href: "/crm/sales-command?view=team" }
                ]
            },
            {
                id: "nav_deals",
                type: "item",
                label: "Deals",
                iconName: "Target",
                href: "/crm/opportunities",
                children: [
                    { id: "sub_deals_pipeline", type: "item", label: "Pipeline View", href: "/crm/opportunities" },
                    { id: "sub_deals_closed", type: "item", label: "Won / Lost", href: "/crm/opportunities?view=closed" }
                ]
            },
            {
                id: "nav_dialer",
                type: "item",
                label: "Dialer",
                iconName: "Phone",
                href: "/crm/dialer"
            },
            {
                id: "nav_quotes",
                type: "item",
                label: "Quotes",
                iconName: "FileText",
                href: "/crm/quotes"
            },
        ]
    },

    // 3. SERVICE HUB
    {
        id: "group_service",
        type: "group",
        label: "Service Hub",
        children: [
            {
                id: "nav_service",
                type: "item",
                label: "Service",
                iconName: "Headset",
                href: "/crm/cases",
                badge: "serviceBadge",
                children: [
                    { id: "sub_service_workspace", type: "item", label: "Agent Workspace", href: "/crm/cases" },
                    { id: "sub_service_queue", type: "item", label: "Case Queue", href: "/crm/cases?view=queue" },
                    { id: "sub_service_kb", type: "item", label: "Knowledge Base", href: "/crm/cases?view=kb" }
                ]
            },
            {
                id: "nav_messages",
                type: "item",
                label: "Messages",
                iconName: "MessageSquare",
                href: "/messages",
                permissions: { module: "messages" }
            }
        ]
    },

    // 4. MARKETING HUB
    {
        id: "group_marketing",
        type: "group",
        label: "Marketing Hub",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_forms",
                type: "item",
                label: "Forms",
                iconName: "FormInput",
                href: "/messages/forms",
                permissions: { module: "messages", feature: "messages" }
            },
            {
                id: "nav_calendar",
                type: "item",
                label: "Calendar",
                iconName: "Calendar",
                href: "/crm/calendar",
                permissions: { minRole: "ADMIN" }
            },
            {
                id: "nav_leads",
                type: "item",
                label: "Leads",
                iconName: "Users",
                href: "/crm/leads",
                permissions: { minRole: "ADMIN" },
                children: [
                    { id: "sub_leads_wizard", type: "item", label: "LeadGen Wizard", href: "/crm/lead-wizard", iconName: "Wand2" },
                    { id: "sub_leads_pools", type: "item", label: "Lead Pools", href: "/crm/lead-pools", iconName: "Target" },
                    { id: "sub_leads_outreach", type: "item", label: "Outreach", href: "/crm/outreach", iconName: "Megaphone" }
                ]
            },
            {
                id: "nav_projects",
                type: "item",
                label: "Projects",
                iconName: "ServerIcon",
                href: "/campaigns",
                permissions: { module: "projects", feature: "projects" }
            }
        ]
    },

    // 5. OPERATIONS
    {
        id: "group_operations",
        type: "group",
        label: "Operations",
        children: [
            {
                id: "nav_accounts",
                type: "item",
                label: "Accounts",
                iconName: "Building2",
                href: "/crm/accounts"
            },
            {
                id: "nav_contacts",
                type: "item",
                label: "Contacts",
                iconName: "Contact",
                href: "/crm/contacts"
            },
            {
                id: "nav_contracts",
                type: "item",
                label: "Contracts",
                iconName: "FileText",
                href: "/crm/contracts",
                children: [
                    { id: "sub_contracts_all", type: "item", label: "All Contracts", href: "/crm/contracts" },
                    { id: "sub_contracts_rooms", type: "item", label: "Deal Rooms", href: "/crm/contracts?view=rooms" }
                ]
            },
            {
                id: "nav_products",
                type: "item",
                label: "Products",
                iconName: "Package",
                href: "/crm/products"
            }
        ]
    },

    // 6. MANAGEMENT
    {
        id: "group_management",
        type: "group",
        label: "Management",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_invoices",
                type: "item",
                label: "Invoices",
                iconName: "FileCheck",
                href: "/invoice",
                permissions: { module: "invoice", feature: "invoices" }
            },
            {
                id: "nav_reports",
                type: "item",
                label: "Reports",
                iconName: "FileBarChart",
                href: "/reports",
                permissions: { module: "reports", feature: "reports" }
            },
            {
                id: "nav_staff",
                type: "item",
                label: "Staff",
                iconName: "UserCog",
                href: "/employees",
                permissions: { module: "employee", feature: "employee" }
            }
        ]
    },

    // 7. AUTOMATION
    {
        id: "group_automation",
        type: "group",
        label: "Automation",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_approvals",
                type: "item",
                label: "Approvals",
                iconName: "CheckCircle2",
                href: "/crm/approvals"
            },
            {
                id: "nav_flows",
                type: "item",
                label: "Flows",
                iconName: "Zap",
                href: "/crm/workflows",
                children: [
                    { id: "sub_flows_all", type: "item", label: "All Workflows", href: "/crm/workflows" },
                    { id: "sub_flows_editor", type: "item", label: "Visual Editor", href: "/crm/workflows?view=editor" }
                ]
            },
            {
                id: "nav_guards",
                type: "item",
                label: "Guards",
                iconName: "Shield",
                href: "/crm/validation-rules"
            }
        ]
    },

    // 8. SYSTEM
    {
        id: "group_system",
        type: "group",
        label: "System",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_admin",
                type: "item",
                label: "Admin",
                iconName: "Wrench",
                href: "/admin"
            },
            {
                id: "nav_learn",
                type: "item",
                label: "Learn",
                iconName: "GraduationCap",
                href: "/crm/university"
            }
        ]
    },

    // 9. PLATFORM
    {
        id: "group_platform",
        type: "group",
        label: "Platform",
        permissions: { minRole: "PARTNER_ADMIN" },
        children: [
            {
                id: "nav_platform",
                type: "item",
                label: "Platform",
                iconName: "Globe",
                href: "/partners",
                children: [
                    { id: "sub_platform_team", type: "item", label: "Team Management", href: "/partners" },
                    { id: "sub_platform_keys", type: "item", label: "System Keys", href: "/partners/ai-system-config" },
                    { id: "sub_platform_price", type: "item", label: "Model Pricing", href: "/partners/ai-pricing" },
                    { id: "sub_platform_email", type: "item", label: "System Email", href: "/partners/email-system-config" },
                    { id: "sub_platform_plans", type: "item", label: "Manage Plans", href: "/partners/plans" }
                ]
            }
        ]
    }
];
