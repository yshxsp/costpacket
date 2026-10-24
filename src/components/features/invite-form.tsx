"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createInvite } from "@/app/actions/invites";

export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SUBCONTRACTOR");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setLink(null);
    try {
      const res = await createInvite(email, role);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setEmail("");
      router.refresh();
      if ("delivered" in res && res.delivered) {
        toast.success("Invite emailed");
      } else if ("link" in res && res.link) {
        setLink(res.link);
        toast.success("Invite created — share the link below");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[3px] border border-rule bg-surface p-4"
    >
      <label htmlFor="invite-email" className="label">
        Invite a teammate
      </label>
      <input
        id="invite-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@example.com"
        className="w-full rounded-[3px] border border-rule bg-background px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <div className="flex gap-2">
        <select
          aria-label="Teammate role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex-1 rounded-[3px] border border-rule bg-background px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="SUBCONTRACTOR">Subcontractor</option>
          <option value="CONTRACTOR">Contractor</option>
          {canInviteAdmin && <option value="ADMIN">Admin</option>}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[3px] bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send invite
        </button>
      </div>

      {link && (
        <div className="rounded-[3px] border border-rule bg-background p-2">
          <p className="label mb-1">Share this link (email not configured)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs text-ink-muted">
              {link}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast.success("Copied");
              }}
              className="rounded-[3px] border border-rule px-2 py-1 text-xs text-ink hover:bg-surface-sunken"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
