"use client";

import { Check, Clock, Sparkles } from "lucide-react";
import { useMySubscription, useRequestSubscription, useSubscriptionPlans } from "@vrm/api-client";
import type { SubscriptionPlan } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, PageSpinner, PageTransition, useToast } from "@vrm/ui";

const STATUS_TONE: Record<string, "warning" | "success" | "neutral" | "danger"> = {
  PENDING: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
  CANCELLED: "danger",
};

export function SubscriptionPage() {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscription, isLoading: subLoading } = useMySubscription();
  const requestSubscription = useRequestSubscription();
  const toast = useToast();

  if (plansLoading || subLoading) return <PageSpinner />;

  const onRequest = async (plan: SubscriptionPlan) => {
    try {
      await requestSubscription.mutateAsync(plan.id);
      toast.success(
        `Requested the ${plan.name} plan`,
        "Our team will confirm your payment and activate it shortly.",
      );
    } catch (err) {
      toast.error("Could not request plan", err instanceof Error ? err.message : undefined);
    }
  };

  const canRequest = !subscription || subscription.status === "EXPIRED" || subscription.status === "CANCELLED";

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Subscription</h1>
        <p className="text-sm text-primary-400">
          Higher tiers unlock more vehicle listings, a lower commission rate, and fleet analytics.
        </p>
      </div>

      {subscription && (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">Current plan</p>
              <h3 className="mt-1 font-heading text-lg font-bold">{subscription.plan?.name ?? "—"}</h3>
              {subscription.status === "ACTIVE" && (
                <p className="mt-1 text-xs text-primary-400">Renews / expires {new Date(subscription.expiresAt).toLocaleDateString()}</p>
              )}
              {subscription.status === "PENDING" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                  <Clock size={13} /> Awaiting payment confirmation from our team
                </p>
              )}
            </div>
            <Badge tone={STATUS_TONE[subscription.status] ?? "neutral"}>{subscription.status}</Badge>
          </div>
        </Card>
      )}

      {!plans?.length ? (
        <EmptyState icon={<Sparkles size={26} />} title="No subscription plans available yet" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan?.id === plan.id && (subscription.status === "ACTIVE" || subscription.status === "PENDING");
            const features = plan.features ?? {};
            return (
              <Card key={plan.id} className={`flex flex-col gap-4 p-5 ${isCurrent ? "border-secondary" : ""}`}>
                <div>
                  <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                  {plan.description && <p className="mt-1 text-xs text-primary-400">{plan.description}</p>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-extrabold text-secondary dark:text-accent-300">₹{plan.price}</span>
                  <span className="text-xs text-primary-400">/ {plan.durationDays} days</span>
                </div>
                <ul className="flex flex-1 flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-secondary" />
                    {plan.maxVehicles ? `Up to ${plan.maxVehicles} vehicles` : "Unlimited vehicles"}
                  </li>
                  {features.commissionOverride != null && (
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-secondary" /> {String(features.commissionOverride)}% commission rate
                    </li>
                  )}
                  {features.analytics === true && (
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-secondary" /> Fleet analytics dashboard
                    </li>
                  )}
                  {features.listingBoost === true && (
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-secondary" /> Priority listing boost
                    </li>
                  )}
                  {typeof features.support === "string" && (
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-secondary" /> {features.support} support
                    </li>
                  )}
                </ul>
                {isCurrent ? (
                  <Badge tone={STATUS_TONE[subscription!.status] ?? "neutral"} className="w-fit">
                    {subscription!.status === "PENDING" ? "Requested" : "Current plan"}
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    fullWidth
                    disabled={!canRequest}
                    isLoading={requestSubscription.isPending}
                    onClick={() => onRequest(plan)}
                  >
                    {canRequest ? "Request this plan" : "Complete or cancel your current plan first"}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
