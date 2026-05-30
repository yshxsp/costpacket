# CostPacket

CostPacket is a focused expense approval and job-costing workspace for small
contractors. It keeps receipts, task expenses, approvals, payout records, and
PDF packets tied to the job before the back office turns into spreadsheets and
message threads.

---

## Key Features

- **Job-costed expense inbox:** Review receipts and expenses by project, task,
  submitter, and status.
- **AI receipt parsing:** Extract vendor, amount, and description from receipt
  photos with Gemini Vision.
- **Approval workflow:** Contractors can approve or reject pending expenses with
  server-side authorization checks.
- **Payout records:** Track subcontractor payouts and Stripe transfer IDs.
- **PDF export:** Generate expense packets for bookkeeping, client review, or
  payment backup.
- **Mobile-first PWA:** Installable dashboard for field and office workflows.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) App Router
- **Runtime:** [React 19](https://react.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/) Postgres + Auth + Storage
- **AI Engine:** [Google Gemini AI](https://aistudio.google.com/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Payments:** [Stripe](https://stripe.com/)
- **Hosting:** [Cloudflare Workers](https://workers.cloudflare.com/) via the [OpenNext](https://opennext.js.org/cloudflare) adapter

---

## Getting Started

```bash
git clone https://github.com/yshxsp/costpacket.git
cd costpacket
npm install
cp .env.example .env.local
npm run dev
```

---

## Deployment (Cloudflare Workers)

CostPacket runs on Cloudflare Workers through the OpenNext adapter.

```bash
# one-time: authenticate wrangler with your Cloudflare account
npx wrangler login

# set runtime secrets (read by the Worker at request time)
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put GEMINI_API_KEY

# build + run locally on the Workers runtime
npm run preview

# build + deploy
npm run deploy
```

For local `npm run preview`, copy `.dev.vars.example` to `.dev.vars` and fill it in.

> **Note:** auth runs in an **Edge** `src/middleware.ts` (not Next 16's Node-runtime
> `proxy.ts`). The OpenNext Cloudflare adapter does not yet support Node-runtime proxy
> ([opennextjs-cloudflare#962](https://github.com/opennextjs/opennextjs-cloudflare/issues/962)).

---

## Product Direction

The product is intentionally not a full Procore-style construction management
suite. The current wedge is narrower: job-costed receipts, expense approvals,
and payout packets for small contractors.

Avoid adding fleet telemetry, GPS equipment tracking, or autonomous task
completion flows unless customer discovery proves a direct revenue path.
