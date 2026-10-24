import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
export const metadata: Metadata = {
  title: "Privacy — CostPacket",
  description:
    "How CostPacket handles account details, job records and receipts.",
};
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Wordmark />
          <Link href="/" className="text-accent underline">
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[680px] px-6 py-12 text-[15px] leading-7 text-ink-muted">
        <h1 className="font-display text-4xl text-ink">Privacy</h1>
        <p className="mt-2 text-sm">Updated 24 October 2026</p>
        <p className="mt-8">
          CostPacket stores account details and the job records you choose to
          add. The sections below describe the current data flow.
        </p>
        <Section title="Accounts and sign-in">
          Your account includes your name, email address and a password hash.
          Better Auth manages sign-in sessions in Neon PostgreSQL. Session
          cookies keep you signed in. Sign-in requests are rate limited; session
          records can include an IP address and browser information.
        </Section>
        <Section title="Projects and receipts">
          Project, task, expense, team and payout records are stored in Neon.
          Receipt images are stored in a private Cloudflare R2 bucket. Access to
          records and files requires a signed-in account and permission in the
          relevant company.
        </Section>
        <Section title="Optional receipt extraction">
          When receipt extraction is configured, an uploaded image is sent to
          Google Gemini to suggest a vendor, amount and description. Check those
          suggestions before saving. Manual entry remains available without
          extraction.
        </Section>
        <Section title="Email">
          When configured, Resend delivers verification, password-reset and
          invitation emails. These messages contain the address and information
          needed for the requested action.
        </Section>
        <Section title="Subscriptions and payout records">
          When subscription checkout is configured, Paddle handles subscription
          payments and card details. CostPacket stores subscription identifiers
          and status. Subcontractor payouts are a manual ledger: marking an
          entry as paid records a confirmation and reference. It does not
          transfer money.
        </Section>
        <Section title="Exports and retention">
          You can export visible expenses and payout records. Records remain in
          the deployment until removed. Deleting a project removes its linked
          tasks, expenses and payout entries; stored receipt files are retained
          separately. Account-level and stored-file removal currently require
          the project operator.
        </Section>
        <Section title="Project owner">
          Dmytro Filonenko maintains CostPacket. The{" "}
          <a
            className="text-accent underline"
            href="https://github.com/yshxsp/costpacket"
          >
            project repository
          </a>{" "}
          contains the source and implementation notes. This app does not
          include advertising analytics or advertising cookies.
        </Section>
      </main>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
