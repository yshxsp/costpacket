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

---

## Getting Started

```bash
git clone https://github.com/yshxsp/buildops-lite.git
cd buildops-lite
npm install
cp .env.example .env.local
npm run dev
```

---

## Product Direction

The product is intentionally not a full Procore-style construction management
suite. The current wedge is narrower: job-costed receipts, expense approvals,
and payout packets for small contractors.

Avoid adding fleet telemetry, GPS equipment tracking, or autonomous task
completion flows unless customer discovery proves a direct revenue path.
