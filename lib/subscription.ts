import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/config/subscriptions";

// Define a type for the DB Plan partial we need
type DBPlan = {
    slug: string;
    features: string[];
    max_users: number;
    max_storage: number;
    max_credits: number;
}

type TeamWithPlan = {
    subscription_plan?: string | null; // Old Enum
    assigned_plan?: DBPlan | null;      // New Relation
}

export const getSubscriptionPlan = (slug?: string) => {
    const planSlug = (slug || "FREE") as SubscriptionPlanType;
    return SUBSCRIPTION_PLANS[planSlug] || SUBSCRIPTION_PLANS.FREE;
};

export const checkLimit = (
    planSlug: string | undefined,
    metric: keyof typeof SUBSCRIPTION_PLANS["FREE"]["limits"],
    currentUsage: number
) => {
    const plan = getSubscriptionPlan(planSlug);
    const limit = plan.limits[metric];

    if (limit === -1) return true; // Unlimited
    return currentUsage < limit;
};

export const checkTeamLimit = (
    team: TeamWithPlan,
    metric: keyof typeof SUBSCRIPTION_PLANS["FREE"]["limits"],
    currentUsage: number
) => {
    // 1. Check DB Plan
    if (team.assigned_plan) {
        let limit = 0;
        if (metric === 'max_users') limit = team.assigned_plan.max_users;
        if (metric === 'max_storage') limit = team.assigned_plan.max_storage;
        if (metric === 'credits') limit = team.assigned_plan.max_credits;

        if (limit === -1) return true;
        return currentUsage < limit;
    }

    // 2. Fallback to constant
    return checkLimit(team.subscription_plan || "FREE", metric, currentUsage);
}

export const hasFeature = (
    planSlug: string | undefined,
    featureName: string
) => {
    const plan = getSubscriptionPlan(planSlug);
    if (plan.features.includes("all")) return true;
    return plan.features.includes(featureName);
};

export const checkTeamFeature = (
    team: TeamWithPlan,
    featureName: string
) => {
    // 1. Check DB Plan
    if (team.assigned_plan) {
        if (team.assigned_plan.features.includes("all")) return true;
        return team.assigned_plan.features.includes(featureName);
    }

    // 2. Fallback to constant
    return hasFeature(team.subscription_plan || "FREE", featureName);
}
