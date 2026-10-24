import { workspace } from "@/lib/server";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Stamp, statusTone, statusLabel } from "@/components/ui/status";
import { SubscribeButton } from "@/components/features/subscribe-button";
import { ManageBillingButton } from "@/components/features/manage-billing-button";

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
}

export default async function BillingPage() {
  const ws = await workspace();
  const { profile } = ws;
  const access = await ws.access();
  const sub = await ws.subscription();
  const hasPaddleCustomer = Boolean(sub?.paddle_customer_id);
  const onPaidPlan = access.status === "active";

  return (
    <PageShell>
      <PageHeader
        kicker="Account"
        title="Billing"
        description="Your CostPacket subscription."
      />

      <div className="max-w-xl space-y-6">
        <div className="rounded-[3px] border border-rule bg-surface p-6">
          <div className="flex items-center justify-between">
            <div className="label">Current plan</div>
            <Stamp tone={statusTone(access.active ? "active" : access.status)}>
              {access.isTrial ? "Trial" : statusLabel(access.status)}
            </Stamp>
          </div>

          <p className="mt-3 text-sm text-ink-muted">
            {access.isTrial && access.trialEndsAt
              ? `Free trial — full access until ${fmt(access.trialEndsAt)}. Subscribe to keep your workspace active.`
              : onPaidPlan
                ? `Active subscription${access.currentPeriodEnd ? ` — renews ${fmt(access.currentPeriodEnd)}` : ""}.`
                : access.status === "past_due"
                  ? "Your last payment failed. Update your card to restore access."
                  : access.status === "paused"
                    ? "Your subscription is paused."
                    : "No active subscription. Subscribe to create projects, tasks, and expenses."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {!onPaidPlan && access.companyId && profile.role === "ADMIN" && (
              <SubscribeButton />
            )}
            {hasPaddleCustomer && <ManageBillingButton />}
          </div>
        </div>

        <p className="text-xs text-ink-faint">
          Billed by Paddle, our Merchant of Record. Card details are handled by
          Paddle — CostPacket never sees them. Subcontractor payouts are a
          separate manual ledger and are not billed here.
        </p>
      </div>
    </PageShell>
  );
}
