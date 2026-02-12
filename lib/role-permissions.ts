import { LayoutDashboard, Users, User, Phone, Briefcase, FileText, CheckSquare, GraduationCap, Laptop, Bot, LineChart, MessageSquare, FormInput, FileCheck, FileBarChart, Mail, FileEdit } from "lucide-react";

export interface CrmModule {
    id: string;
    name: string;
    description?: string;
    route?: string;
    children?: CrmModule[];
}

// All available CRM modules with Detailed Drill-Down

export type TeamRole = "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "VIEWER";

export const ALL_ROLES: { label: string; value: TeamRole }[] = [
    { label: "Super Admin", value: "SUPER_ADMIN" },
    { label: "Admin", value: "ADMIN" },
    { label: "Member", value: "MEMBER" },
    { label: "Viewer", value: "VIEWER" },
];

export const CRM_MODULES: CrmModule[] = [

    {
        id: 'dashboard',
        name: 'Dashboard',
        route: '/crm/dashboard',
        description: 'CRM overview and metrics',
        children: [
            { id: 'dashboard.view', name: 'View Dashboard', description: 'Access the main dashboard page' },
            {
                id: 'dashboard.widgets',
                name: 'Widgets',
                description: 'Toggle specific dashboard cards',
                children: [
                    { id: 'dashboard.widgets.welcome', name: 'Welcome Message', description: 'Greeting card' },
                    { id: 'dashboard.widgets.stats_overview', name: 'Stats Overview', description: 'Top statistics row' },
                    { id: 'dashboard.widgets.daily_tasks', name: 'Daily Tasks', description: 'Daily task list' },
                    { id: 'dashboard.widgets.messages', name: 'Recent Messages', description: 'Recent communications' },
                    { id: 'dashboard.widgets.my_leads', name: 'My Leads', description: 'Lead summary' },
                    { id: 'dashboard.widgets.new_projects', name: 'New Projects', description: 'Project summary' },
                    { id: 'dashboard.widgets.team_analytics', name: 'Team Analytics', description: 'Team performance charts' },
                    { id: 'dashboard.widgets.gamification', name: 'Gamification', description: 'Leaderboards' },
                    { id: 'dashboard.widgets.jump_back_in', name: 'Jump Back In', description: 'Recent history' },
                ]
            },
            {
                id: 'dashboard.actions',
                name: 'Actions',
                description: 'Dashboard actions',
                children: [
                    { id: 'dashboard.actions.export', name: 'Export Data', description: 'Export dashboard reports' }
                ]
            }
        ]
    },
    {
        id: 'leads',
        name: 'Calendar',
        route: '/crm/calendar',
        description: 'Global task and event management',
        children: [
            {
                id: 'leads.tabs',
                name: 'Tabs Access',
                description: 'Toggle specific tabs',
                children: [
                    { id: 'leads.tabs.all', name: 'All Leads View', description: 'Main list view' },
                    { id: 'leads.tabs.workspace', name: 'Workspace View', description: 'Pipeline workspace' },
                    { id: 'leads.tabs.dialer', name: 'Dialer View', description: 'Embedded dialer' },
                ]
            },
            {
                id: 'leads.components',
                name: 'Components',
                description: 'Page components',
                children: [
                    { id: 'leads.components.filters', name: 'Filter Sidebar', description: 'Advanced filtering' },
                    { id: 'leads.components.stats', name: 'Pipeline Stats', description: 'Top stats bar' },
                ]
            },
            {
                id: 'leads.actions',
                name: 'Actions',
                description: 'Lead operations',
                children: [
                    { id: 'leads.actions.create', name: 'Create Lead', description: 'Add new leads' },
                    { id: 'leads.actions.import', name: 'Import Leads', description: 'Import from CSV' },
                    { id: 'leads.actions.export', name: 'Export Leads', description: 'Export leads list' },
                    { id: 'leads.actions.assign', name: 'Assign Lead', description: 'Reassign leads' },
                    { id: 'leads.actions.convert', name: 'Convert to Deal', description: 'Convert lead to opportunity' },
                    { id: 'leads.actions.delete', name: 'Delete Lead', description: 'Remove leads' },
                ]
            }
        ]
    },
    {
        id: 'accounts',
        name: 'Accounts',
        route: '/crm/accounts',
        description: 'Manage company accounts',
        children: [
            { id: 'accounts.view', name: 'View Accounts', description: 'Access account list' },
            { id: 'accounts.detail_view', name: 'Account Detail View', description: 'Access account details page' },
            {
                id: 'accounts.detail',
                name: 'Detail Page Widgets',
                description: 'Sections on detail page',
                children: [
                    { id: 'accounts.detail.info', name: 'Basic Info', description: 'Overview card' },
                    { id: 'accounts.detail.tasks', name: 'Tasks Widget', description: 'Tasks section' },
                    { id: 'accounts.detail.contacts', name: 'Contacts Widget', description: 'Associated contacts' },
                    { id: 'accounts.detail.opportunities', name: 'Opportunities Widget', description: 'Associated deals' },
                    { id: 'accounts.detail.contracts', name: 'Contracts Widget', description: 'Associated contracts' },
                    { id: 'accounts.detail.leads', name: 'Leads Widget', description: 'Associated leads' },
                    { id: 'accounts.detail.documents', name: 'Documents Widget', description: 'Uploaded files' },
                ]
            },
            {
                id: 'accounts.actions',
                name: 'Actions',
                description: 'Account operations',
                children: [
                    { id: 'accounts.actions.create', name: 'Create Account', description: 'Add new accounts' },
                    { id: 'accounts.actions.edit', name: 'Edit Details', description: 'Modify account info' },
                    { id: 'accounts.actions.delete', name: 'Delete Account', description: 'Remove accounts' },
                    { id: 'accounts.actions.export', name: 'Export Accounts', description: 'Export account list' },
                    { id: 'accounts.actions.add_note', name: 'Add Note', description: 'Create timeline note' },
                ]
            }
        ]
    },
    {
        id: 'contacts',
        name: 'Contacts',
        route: '/crm/contacts',
        description: 'Manage contacts',
        children: [
            { id: 'contacts.view', name: 'View Contacts', description: 'Access contact list' },
            { id: 'contacts.detail_view', name: 'Contact Detail View', description: 'Access contact details page' },
            {
                id: 'contacts.detail',
                name: 'Detail Page Widgets',
                description: 'Sections on detail page',
                children: [
                    { id: 'contacts.detail.info', name: 'Basic Info', description: 'Profile card' },
                    { id: 'contacts.detail.communication', name: 'Communication', description: 'Email/SMS history' },
                    { id: 'contacts.detail.opportunities', name: 'Opportunities Widget', description: 'Associated deals' },
                    { id: 'contacts.detail.documents', name: 'Documents Widget', description: 'Uploaded files' },
                    { id: 'contacts.detail.tasks', name: 'Tasks Widget', description: 'Associated tasks' },
                    { id: 'contacts.detail.accounts', name: 'Linked Accounts', description: 'Associated companies' },
                ]
            },
            {
                id: 'contacts.actions',
                name: 'Actions',
                description: 'Contact operations',
                children: [
                    { id: 'contacts.actions.create', name: 'Create Contact', description: 'Add new contacts' },
                    { id: 'contacts.actions.edit', name: 'Edit Profile', description: 'Modify contact info' },
                    { id: 'contacts.actions.delete', name: 'Delete Contact', description: 'Remove contacts' },
                    { id: 'contacts.actions.import', name: 'Import Contacts', description: 'Import from CSV' },
                    { id: 'contacts.actions.export', name: 'Export Contacts', description: 'Export contact list' },
                ]
            }
        ]
    },
    {
        id: 'opportunities',
        name: 'Opportunities',
        route: '/crm/opportunities',
        description: 'Sales pipeline',
        children: [
            { id: 'opportunities.view', name: 'Pipeline View', description: 'View opportunities board' },
            { id: 'opportunities.list_view', name: 'List View', description: 'View opportunities table' },
            { id: 'opportunities.detail_view', name: 'Detail View', description: 'Access deal details' },
            {
                id: 'opportunities.detail',
                name: 'Detail Widgets',
                description: 'Sections on detail page',
                children: [
                    { id: 'opportunities.detail.info', name: 'Basic Info', description: 'Deal overview' },
                    { id: 'opportunities.detail.accounts', name: 'Linked Accounts', description: 'Associated accounts' },
                    { id: 'opportunities.detail.contacts', name: 'Linked Contacts', description: 'Associated contacts' },
                    { id: 'opportunities.detail.documents', name: 'Documents', description: 'Deal files' },
                ]
            },
            {
                id: 'opportunities.actions',
                name: 'Actions',
                description: 'Opportunity operations',
                children: [
                    { id: 'opportunities.actions.create', name: 'Create Deal', description: 'Add new deals' },
                    { id: 'opportunities.actions.move_stage', name: 'Move Stages', description: 'Drag and drop' },
                    { id: 'opportunities.actions.won_lost', name: 'Mark Won/Lost', description: 'Close deals' },
                    { id: 'opportunities.actions.delete', name: 'Delete Deal', description: 'Remove deals' },
                    { id: 'opportunities.actions.edit', name: 'Edit Deal', description: 'Modify deal info' },
                ]
            }
        ]
    },
    {
        id: 'ai_lab',
        name: 'AI Lab',
        route: '/crm/prompt',
        description: 'AI Tools & Prompt Generation',
        children: [
            { id: 'ai_lab.prompt_generator', name: 'Prompt Generator', description: 'Access generator tool' },
            {
                id: 'ai_lab.actions',
                name: 'Actions',
                description: 'AI operations',
                children: [
                    { id: 'ai_lab.actions.generate', name: 'Generate Prompt', description: 'Run generation' },
                    { id: 'ai_lab.actions.push_voicehub', name: 'Push to VoiceHub', description: 'Deploy to voice agent' },
                ]
            }
        ]
    },
    {
        id: 'sales-command',
        name: 'Sales Command',
        route: '/crm/sales-command',
        description: 'Sales automation tools',
        children: [
            { id: 'sales_command.my_command', name: 'My Command', description: 'Personal dashboard' },
            { id: 'sales_command.team_command', name: 'Team Command', description: 'Manager dashboard' },
            { id: 'sales_command.analytics', name: 'Unified Analytics', description: 'Cross-module analytics' },
            {
                id: 'sales_command.widgets',
                name: 'Widgets',
                description: 'Dashboard widgets',
                children: [
                    { id: 'sales_command.widgets.leaderboard', name: 'Leaderboard', description: 'Team rankings' },
                    { id: 'sales_command.widgets.conversion', name: 'Conversion Charts', description: 'Funnel metrics' },
                    { id: 'sales_command.widgets.activity', name: 'Activity Feed', description: 'Recent actions' },
                ]
            }
        ]
    },
    {
        id: 'contracts',
        name: 'Contracts',
        route: '/crm/contracts',
        description: 'Contract management',
        children: [
            { id: 'contracts.view', name: 'View Contracts', description: 'Access contracts list' },
            {
                id: 'contracts.detail',
                name: 'Detail Page',
                description: 'Contract details',
                children: [
                    { id: 'contracts.detail.preview', name: 'PDF Preview', description: 'View document' },
                    {
                        id: 'contracts.detail.signatures',
                        name: 'Signatures',
                        description: 'Signature status'
                    },
                    {
                        id: 'contracts.deal_room',
                        name: 'Deal Room (Digital Sales Room)',
                        description: 'Interactive proposal sites',
                        children: [
                            { id: 'contracts.deal_room.view', name: 'View Rooms', description: 'Access Deal Rooms' },
                            { id: 'contracts.deal_room.create', name: 'Create Room', description: 'Generate new room from contract' },
                            { id: 'contracts.deal_room.analytics', name: 'Room Analytics', description: 'View tracking data' },
                        ]
                    }]
            },
            {
                id: 'contracts.actions',
                name: 'Actions',
                description: 'Contract operations',
                children: [
                    { id: 'contracts.actions.create', name: 'Draft Contract', description: 'Create new' },
                    { id: 'contracts.actions.edit', name: 'Edit Contract', description: 'Modify contract' },
                    { id: 'contracts.actions.delete', name: 'Delete Contract', description: 'Remove contract' },
                    { id: 'contracts.actions.send', name: 'Send for Signature', description: 'Email to client' },
                    { id: 'contracts.actions.sign', name: 'Sign Contract', description: 'Sign internal' },
                    { id: 'contracts.actions.void', name: 'Void Contract', description: 'Cancel contract' },
                ]
            }
        ]
    },
    {
        id: 'projects',
        name: 'Projects',
        route: '/crm/my-projects',
        description: 'Project boards',
        children: [
            { id: 'projects.board_view', name: 'Board View', description: 'Kanban board' },
            { id: 'projects.list_view', name: 'List View', description: 'Project list' },
            {
                id: 'projects.detail',
                name: 'Detail Page',
                description: 'Project details',
                children: [
                    { id: 'projects.detail.comments', name: 'Comments', description: 'Discussion thread' },
                    { id: 'projects.detail.attachments', name: 'Attachments', description: 'Files' },
                ]
            },
            {
                id: 'projects.actions',
                name: 'Actions',
                description: 'Project operations',
                children: [
                    { id: 'projects.actions.create', name: 'Create Project', description: 'Add new' },
                    { id: 'projects.actions.edit', name: 'Edit Project', description: 'Modify project' },
                    { id: 'projects.actions.move', name: 'Move Status', description: 'Change stage' },
                    { id: 'projects.actions.assign', name: 'Assign Members', description: 'Manage team' },
                    { id: 'projects.actions.delete', name: 'Delete Project', description: 'Remove project' },
                ]
            }
        ]
    },
    {
        id: 'tasks',
        name: 'Tasks',
        route: '/crm/tasks',
        description: 'Global task management',
        children: [
            { id: 'tasks.view', name: 'Task List', description: 'List view' },
            { id: 'tasks.calendar', name: 'Calendar View', description: 'Calendar view' },
            {
                id: 'tasks.actions',
                name: 'Actions',
                description: 'Task operations',
                children: [
                    { id: 'tasks.actions.create', name: 'Create Task', description: 'Add new' },
                    { id: 'tasks.actions.edit', name: 'Edit Task', description: 'Modify task' },
                    { id: 'tasks.actions.complete', name: 'Mark Complete', description: 'Finish task' },
                    { id: 'tasks.actions.delete', name: 'Delete Task', description: 'Remove task' },
                ]
            }
        ]
    },
    {
        id: 'dialer',
        name: 'Dialer',
        route: '/crm/dialer',
        description: 'Phone system',
        children: [
            { id: 'dialer.view', name: 'Dialer Interface', description: 'Keypad and controls' },
            { id: 'dialer.history', name: 'Call History', description: 'Logs' },
            { id: 'dialer.recordings', name: 'Recordings', description: 'Audio files' },
            {
                id: 'dialer.actions',
                name: 'Actions',
                description: 'Dialer operations',
                children: [
                    { id: 'dialer.actions.call', name: 'Make Calls', description: 'Outbound' },
                    { id: 'dialer.actions.listen', name: 'Listen', description: 'Play recordings' },
                    { id: 'dialer.actions.download', name: 'Download', description: 'Save recordings' },
                ]
            }
        ]
    },
    {
        id: 'university',
        name: 'University',
        route: '/crm/university',
        description: 'Training and resources',
        children: [
            { id: 'university.view', name: 'Course View', description: 'Access content' },
            { id: 'university.progress', name: 'My Progress', description: 'Tracking' },
            {
                id: 'university.widgets',
                name: 'Widgets',
                description: 'Page sections',
                children: [
                    { id: 'university.widgets.workflow_diagrams', name: 'Workflow Diagrams', description: 'Visual guides' },
                    { id: 'university.widgets.guides', name: 'Guides', description: 'Written content' },
                ]
            },
            {
                id: 'university.actions',
                name: 'Actions',
                description: 'Admin operations',
                children: [
                    { id: 'university.actions.manage', name: 'Manage Content', description: 'Upload/Edit' },
                ]
            }
        ]
    },
    {
        id: 'outreach',
        name: 'Outreach',
        route: '/crm/outreach',
        description: 'Marketing sequences',
        children: [
            { id: 'outreach.view', name: 'View Sequences', description: 'Access sequences page' },
            {
                id: 'outreach.actions',
                name: 'Actions',
                description: 'Sequence operations',
                children: [
                    { id: 'outreach.actions.create', name: 'Create Sequence', description: 'Add new' },
                    { id: 'outreach.actions.edit', name: 'Edit Sequence', description: 'Modify' },
                    { id: 'outreach.actions.delete', name: 'Delete Sequence', description: 'Remove' }
                ]
            }
        ]
    },
    {
        id: 'lead_pools',
        name: 'Lead Pools',
        route: '/crm/lead-pools',
        description: 'Lead distribution',
        children: [
            { id: 'lead_pools.view', name: 'View Pools', description: 'Access pool settings' },
            { id: 'lead_pools.actions.manage', name: 'Manage Pools', description: 'Create/Edit pools' }
        ]
    },
    {
        id: 'lead_wizard',
        name: 'Lead Wizard',
        route: '/crm/lead-wizard',
        description: 'Lead generation tool',
        children: [
            { id: 'lead_wizard.view', name: 'Access Wizard', description: 'Use generator' }
        ]
    },
    {
        id: 'workflows',
        name: 'FlowState',
        route: '/crm/workflows',
        description: 'Visual workflow automation',
        children: [
            { id: 'workflows.view', name: 'View Workflows', description: 'Access workflow list' },
            {
                id: 'workflows.actions',
                name: 'Actions',
                description: 'Workflow operations',
                children: [
                    { id: 'workflows.actions.create', name: 'Create Workflow', description: 'Build new automations' },
                    { id: 'workflows.actions.edit', name: 'Edit Workflow', description: 'Modify workflows' },
                    { id: 'workflows.actions.delete', name: 'Delete Workflow', description: 'Remove workflows' },
                    { id: 'workflows.actions.activate', name: 'Activate/Pause', description: 'Toggle workflow status' },
                ]
            },
            { id: 'workflows.logs', name: 'Execution Logs', description: 'View run history' }
        ]
    },
    {
        id: 'messages',
        name: 'Messages',
        route: '/messages',
        description: 'Internal team messaging',
        children: [
            { id: 'messages.view', name: 'View Messages', description: 'Access inbox' },
            { id: 'messages.send', name: 'Send Message', description: 'Compose new messages' },
        ]
    },
    {
        id: 'form_builder',
        name: 'Form Builder',
        route: '/messages/forms',
        description: 'Lead capture forms',
        children: [
            { id: 'form_builder.view', name: 'View Forms', description: 'List existing forms' },
            { id: 'form_builder.create', name: 'Create Form', description: 'Build new forms' },
            { id: 'form_builder.submissions', name: 'View Submissions', description: 'Access form data' },
        ]
    },
    {
        id: 'invoice',
        name: 'Invoices',
        route: '/invoice',
        description: 'Invoice management',
        children: [
            { id: 'invoice.view', name: 'View Invoices', description: 'List invoices' },
            { id: 'invoice.upload', name: 'Upload Invoice', description: 'Import new invoices' },
        ]
    },
    {
        id: 'reports',
        name: 'Reports',
        route: '/reports',
        description: 'Business analytics and reports',
        children: [
            { id: 'reports.view', name: 'View Reports', description: 'Access reporting tools' },
        ]
    },
    {
        id: 'emails',
        name: 'Emails',
        route: '/emails',
        description: 'External email management',
        children: [
            { id: 'emails.view', name: 'View Emails', description: 'Access email client' },
        ]
    },
    {
        id: 'employee',
        name: 'Employees',
        route: '/employees',
        description: 'Staff management',
        children: [
            { id: 'employee.view', name: 'View Employees', description: 'Access employee list' },
        ]
    },
    {
        id: 'databox',
        name: 'Databox',
        route: '/databox',
        description: 'Custom data storage',
        children: [
            { id: 'databox.view', name: 'View Databox', description: 'Access databox tools' },
        ]
    },
    {
        id: 'approvals',
        name: 'Approvals',
        route: '/crm/approvals',
        description: 'Approval processes and requests',
        children: [
            { id: 'approvals.view', name: 'View Approvals', description: 'Access approval list' },
            { id: 'approvals.manage', name: 'Manage Approvals', description: 'Approve or reject requests' }
        ]
    },
    {
        id: 'cases',
        name: 'Cases',
        route: '/crm/cases',
        description: 'Service Cloud Case Management',
        children: [
            { id: 'cases.view', name: 'View Cases', description: 'Access case list' },
            { id: 'cases.create', name: 'Create Case', description: 'Open new support cases' },
            { id: 'cases.edit', name: 'Edit Case', description: 'Modify case details' },
            { id: 'cases.delete', name: 'Delete Case', description: 'Remove cases' }
        ]
    },
    {
        id: 'notifications',
        name: 'Notifications',
        route: '/crm/notifications',
        description: 'System notification center',
        children: [
            { id: 'notifications.view', name: 'View Notifications', description: 'Access all notifications' }
        ]
    },
    {
        id: 'products',
        name: 'Products',
        route: '/crm/products',
        description: 'Product and inventory catalog',
        children: [
            { id: 'products.view', name: 'View Products', description: 'Access product list' },
            { id: 'products.create', name: 'Create Product', description: 'Add new products' },
            { id: 'products.edit', name: 'Edit Product', description: 'Modify products' },
            { id: 'products.delete', name: 'Delete Product', description: 'Remove products' }
        ]
    },
    {
        id: 'quotes',
        name: 'Quotes',
        route: '/crm/quotes',
        description: 'Quote creation and management',
        children: [
            { id: 'quotes.view', name: 'View Quotes', description: 'Access quote list' },
            { id: 'quotes.create', name: 'Create Quote', description: 'Generate new quotes' },
            { id: 'quotes.edit', name: 'Edit Quote', description: 'Modify existing quotes' },
            { id: 'quotes.delete', name: 'Delete Quote', description: 'Remove quotes' }
        ]
    },
    {
        id: 'guard-rules',
        name: 'Guard Rules',
        route: '/crm/validation-rules',
        description: 'Manage data validation logic',
        children: [
            { id: 'guard-rules.view', name: 'View Rules', description: 'Access validation rules list' },
            { id: 'guard-rules.manage', name: 'Manage Rules', description: 'Create and edit rules' }
        ]
    }
];

export const ROLE_CONFIGS: Record<Exclude<TeamRole, 'SUPER_ADMIN'>, { label: string; description: string; defaultModules: string[] }> = {
    ADMIN: {
        label: "Admin",
        description: "Full access to department resources",
        defaultModules: [
            'dashboard', 'dashboard.view',
            'leads', 'leads.tabs.all',
            'accounts', 'accounts.view',
            'contacts', 'contacts.view',
            'messages', 'form_builder',
            'approvals', 'cases', 'notifications', 'products', 'quotes', 'guard-rules', 'workflows'
        ]
    },
    MEMBER: {
        label: "Member",
        description: "Standard access to assigned resources",
        defaultModules: [
            'dashboard', 'dashboard.view',
            'contacts', 'contacts.view',
            'leads', 'leads.tabs.all', 'leads.tabs.workspace', 'leads.tabs.dialer',
            'cases', 'notifications', 'products', 'quotes'
        ]
    },
    VIEWER: {
        label: "Viewer",
        description: "Read-only access to view data",
        defaultModules: ['dashboard', 'dashboard.view']
    }
};

// Role Hierarchy Levels (Higher # = More Privilege)
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
    SUPER_ADMIN: 100,
    ADMIN: 50,
    MEMBER: 10,
    VIEWER: 0,
};

// Matrix defining which roles can create which other roles
export const ROLE_CREATION_MATRIX: Record<TeamRole, TeamRole[]> = {
    SUPER_ADMIN: ['ADMIN', 'MEMBER', 'VIEWER'],
    ADMIN: ['MEMBER', 'VIEWER'],
    MEMBER: [],
    VIEWER: []
};
