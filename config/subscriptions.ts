export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Free",
        slug: "FREE",
        features: ["crm", "projects", "documents"],
        limits: {
            max_users: 3,
            max_storage: 1000, // MB
            credits: 100, // General monthly credits
        }
    },
    TEAM: {
        name: "Team",
        slug: "TEAM",
        features: ["crm", "projects", "documents", "invoices", "reports", "openai", "emails"], // Added emails
        limits: {
            max_users: 10,
            max_storage: 10000,
            credits: 5000,
        }
    },
    ENTERPRISE: {
        name: "Enterprise",
        slug: "ENTERPRISE",
        features: ["all"],
        limits: {
            max_users: 9999,
            max_storage: 100000,
            credits: 50000,
        }
    }
};

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
