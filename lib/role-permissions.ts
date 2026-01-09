/**
 * CRM Role Permissions and Module Access Configuration
 * 
 * Defines role types and their default module access for the CRM.
 * Owner/Super Admin roles have full access and don't need module configuration.
 */

// Team roles in hierarchical order
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// CRM Module definition
export interface CrmModule {
    id: string;
    name: string;
    route: string;
    description: string;
    icon?: string;
}

// All available CRM modules
export const CRM_MODULES: CrmModule[] = [
    { id: 'dashboard', name: 'Dashboard', route: '/crm/dashboard', description: 'CRM overview and metrics' },
    { id: 'accounts', name: 'Accounts', route: '/crm/accounts', description: 'Manage company accounts' },
    { id: 'contacts', name: 'Contacts', route: '/crm/contacts', description: 'Manage contacts' },
    { id: 'leads', name: 'Leads', route: '/crm/leads', description: 'Lead management and tracking' },
    { id: 'opportunities', name: 'Opportunities', route: '/crm/opportunities', description: 'Sales opportunities pipeline' },
    { id: 'contracts', name: 'Contracts', route: '/crm/contracts', description: 'Contract management' },
    { id: 'tasks', name: 'Tasks', route: '/crm/tasks', description: 'Task management' },
    { id: 'projects', name: 'Projects', route: '/crm/my-projects', description: 'Project boards' },
    { id: 'sales-command', name: 'Sales Command', route: '/crm/sales-command', description: 'Sales automation tools' },
    { id: 'dialer', name: 'Dialer', route: '/crm/dialer', description: 'Phone dialer integration' },
    { id: 'university', name: 'University', route: '/crm/university', description: 'Training and resources' },
];

// Role metadata
export interface RoleConfig {
    label: string;
    description: string;
    canEdit: boolean;
    canDelete: boolean;
    canManageSettings: boolean;
    defaultModules: string[]; // Module IDs enabled by default
}

// Role configurations (Owner has god mode - not included)
export const ROLE_CONFIGS: Record<Exclude<TeamRole, 'OWNER'>, RoleConfig> = {
    ADMIN: {
        label: 'Admin',
        description: 'Full access to all system features',
        canEdit: true,
        canDelete: true,
        canManageSettings: true,
        defaultModules: CRM_MODULES.map(m => m.id), // All modules
    },
    MEMBER: {
        label: 'Member',
        description: 'Can manage content but not system settings',
        canEdit: true,
        canDelete: false,
        canManageSettings: false,
        defaultModules: ['dashboard', 'leads', 'accounts', 'contacts', 'tasks'], // Subset
    },
    VIEWER: {
        label: 'Viewer',
        description: 'Read-only access',
        canEdit: false,
        canDelete: false,
        canManageSettings: false,
        defaultModules: [], // No modules enabled by default
    },
};

// Helper to check if a role has access to a module
export function hasModuleAccess(role: TeamRole, moduleId: string, customModules?: string[]): boolean {
    // Owner always has access
    if (role === 'OWNER') return true;

    // Use custom modules if provided, otherwise use defaults
    const enabledModules = customModules ?? ROLE_CONFIGS[role].defaultModules;
    return enabledModules.includes(moduleId);
}

// Helper to get display name for role
export function getRoleLabel(role: TeamRole): string {
    if (role === 'OWNER') return 'Owner';
    return ROLE_CONFIGS[role].label;
}
