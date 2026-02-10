export type ReportableObject = {
    id: string;
    label: string;
    modelName: string;
    fields: {
        id: string;
        label: string;
        type: 'string' | 'number' | 'date' | 'boolean' | 'relation';
        relationTo?: string;
    }[];
};

export const REPORTABLE_OBJECTS: ReportableObject[] = [
    {
        id: 'leads',
        label: 'Leads',
        modelName: 'crm_Leads',
        fields: [
            { id: 'firstName', label: 'First Name', type: 'string' },
            { id: 'lastName', label: 'Last Name', type: 'string' },
            { id: 'company', label: 'Company', type: 'string' },
            { id: 'email', label: 'Email', type: 'string' },
            { id: 'status', label: 'Status', type: 'string' },
            { id: 'pipeline_stage', label: 'Pipeline Stage', type: 'string' },
            { id: 'createdAt', label: 'Created At', type: 'date' },
        ]
    },
    {
        id: 'accounts',
        label: 'Accounts',
        modelName: 'crm_Accounts',
        fields: [
            { id: 'name', label: 'Account Name', type: 'string' },
            { id: 'email', label: 'Email', type: 'string' },
            { id: 'industry', label: 'Industry', type: 'string' },
            { id: 'annual_revenue', label: 'Annual Revenue', type: 'number' },
            { id: 'status', label: 'Status', type: 'string' },
            { id: 'createdAt', label: 'Created At', type: 'date' },
        ]
    },
    {
        id: 'opportunities',
        label: 'Opportunities',
        modelName: 'crm_Opportunities',
        fields: [
            { id: 'name', label: 'Opportunity Name', type: 'string' },
            { id: 'budget', label: 'Budget', type: 'number' },
            { id: 'expected_revenue', label: 'Expected Revenue', type: 'number' },
            { id: 'close_date', label: 'Close Date', type: 'date' },
            { id: 'status', label: 'Status', type: 'string' },
            { id: 'createdAt', label: 'Created At', type: 'date' },
        ]
    },
    {
        id: 'tasks',
        label: 'Tasks',
        modelName: 'Tasks',
        fields: [
            { id: 'title', label: 'Title', type: 'string' },
            { id: 'priority', label: 'Priority', type: 'string' },
            { id: 'taskStatus', label: 'Status', type: 'string' },
            { id: 'dueDateAt', label: 'Due Date', type: 'date' },
            { id: 'createdAt', label: 'Created At', type: 'date' },
        ]
    },
    {
        id: 'contracts',
        label: 'Contracts',
        modelName: 'crm_Contracts',
        fields: [
            { id: 'title', label: 'Contract Title', type: 'string' },
            { id: 'value', label: 'Value', type: 'number' },
            { id: 'startDate', label: 'Start Date', type: 'date' },
            { id: 'endDate', label: 'End Date', type: 'date' },
            { id: 'status', label: 'Status', type: 'string' },
        ]
    }
];
