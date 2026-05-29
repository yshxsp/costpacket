# CostPacket — Project Cleanup And Revenue Direction

> Updated: May 29, 2026. This file replaces the old broad BuildOps Lite status
> report with the current product direction and implementation priorities.

## Product Thesis

CostPacket should not try to become a full construction management suite. The
fastest path to useful revenue is a narrow workflow for small contractors:

- capture receipts and task expenses;
- tie every cost to the right project/job;
- approve or reject pending expenses;
- keep payout records and export PDF backup packets.

The near-term buyer is a small contractor, remodeler, or subcontractor-heavy
operator who is still using spreadsheets, texts, email, and QuickBooks cleanup.

## Keep

| Area | Status | Notes |
|---|---:|---|
| Supabase Auth and Postgres | Active | Existing role-based pages and RLS assumptions stay. |
| Supabase Storage receipts bucket | Active | Used for receipt images. |
| Gemini receipt parsing | Active | Keep AI scoped to receipt parsing. |
| Expense approvals | Active | Core wedge. |
| Payments table and Stripe IDs | Active | Keep as payout record workflow; avoid overpromising live payouts. |
| PDF expense export | Active | Useful for accountants, clients, and payout backup. |

## Remove Or Avoid

| Idea | Decision | Reason |
|---|---:|---|
| Fleet or equipment tracking | Reject | Expensive, operationally unrealistic, not a fast lead-gen wedge. |
| GPS-based task completion | Reject | Trust and liability risk; no clear buyer pull. |
| "Autonomous construction ops" positioning | Reject | Sounds generic and lowers trust. |
| Full Procore-style suite | Defer | Too broad for a small product to sell quickly. |

## Near-Term Build Priorities

1. Clean repo hygiene: skills, CodeGraphContext, Next.js 16 proxy migration,
   lint/type/build checks.
2. Rebrand the app shell and docs to CostPacket.
3. Tighten landing copy around job-costed expense packets.
4. Improve dashboard/expenses pages for dense operational scanning.
5. Validate the wedge with contractor conversations before expanding scope.

## Revenue Hypothesis

The initial target should be 10-20 customers at roughly USD 149-199/month, not
100+ low-price users. The message to test:

> "Turn job receipts and subcontractor expenses into approved cost packets
> before they hit bookkeeping."

If this does not produce conversations, pivot the wedge toward change-order
approval packets rather than expanding into generic project management.
