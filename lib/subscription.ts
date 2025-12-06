import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/config/subscriptions";

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

export const hasFeature = (
    planSlug: string | undefined,
    featureName: string
) => {
    const plan = getSubscriptionPlan(planSlug);
    if (plan.features.includes("all")) return true;
    return plan.features.includes(featureName);
};
