import { session } from "@/lib/server";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/features/accept-invite-form";
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const s = await session();
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md border border-rule bg-surface p-8 rounded-[3px] space-y-4">
        <h1 className="font-display text-2xl">Join a workspace</h1>
        {!token ? (
          <p>This link is missing its invitation token.</p>
        ) : !s ? (
          <>
            <p>Sign in or create an account with the invited email address.</p>
            <Link
              className="underline"
              href={
                "/login?redirectTo=" +
                encodeURIComponent("/accept-invite?token=" + token)
              }
            >
              Sign in
            </Link>
            <p>
              <Link
                className="underline"
                href={
                  "/signup?redirectTo=" +
                  encodeURIComponent("/accept-invite?token=" + token)
                }
              >
                Create account
              </Link>
            </p>
          </>
        ) : (
          <AcceptInviteForm
            token={token}
            verified={s.user.emailVerified}
            email={s.user.email}
          />
        )}
      </div>
    </main>
  );
}
