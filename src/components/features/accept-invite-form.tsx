"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvite } from "@/app/actions/invites";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
export function AcceptInviteForm({
  token,
  verified,
  email,
}: {
  token: string;
  verified: boolean;
  email: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          if (!verified) {
            const { error } = await authClient.sendVerificationEmail({
              email,
              callbackURL: window.location.href,
            });
            setMessage(
              error?.message ??
                "Check your email, verify your address, then return to this invitation.",
            );
          } else {
            const result = await acceptInvite(token);
            if (result.error) setMessage(result.error);
            else {
              router.push("/dashboard");
              router.refresh();
            }
          }
        } catch {
          setMessage("The request failed. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-4"
    >
      <p>
        {verified
          ? "Accepting will join the company that invited you."
          : "Verify your email before joining this company."}
      </p>
      <Button disabled={busy}>
        {busy
          ? "Working…"
          : verified
            ? "Accept invitation"
            : "Send verification email"}
      </Button>
      <p role="status">{message}</p>
    </form>
  );
}
