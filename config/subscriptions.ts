export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Testing Plan",
        slug: "FREE",
        price: 2, // From screenshot
        features: ["crm", "projects", "documents"],
        limits: {
            max_users: 1,
            max_storage: 500, // MB
            credits: 50, // General monthly credits
        }
    },
    INDIVIDUAL_BASIC: {
        name: "Individual Basic",
        slug: "INDIVIDUAL_BASIC",
        price: 50,
        features: ["crm", "projects", "documents", "invoices", "reports", "openai", "emails"],
        limits: {
            max_users: 2,
            max_storage: 5000,
            credits: 1000,
        }
    },
    INDIVIDUAL_PRO: {
        name: "Individual Pro",
        slug: "INDIVIDUAL_PRO",
        price: 150,
        features: ["all"],
        limits: {
            max_users: 4,
            max_storage: 50000,
            credits: 10000,
        }
    }
};

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
