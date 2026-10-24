import { workspace } from "@/lib/server";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/features/profile-form";

export default async function SettingsPage() {
  const ws = await workspace();
  const { profile } = ws;

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <PageHeader
        kicker="Account"
        title="Profile"
        description="Manage your profile and payout details"
      />

      <Card className="p-6 md:p-8">
        <ProfileForm
          initialName={profile.name ?? ""}
          initialEmail={profile.email ?? ""}
          role={profile.role ?? "SUBCONTRACTOR"}
        />
      </Card>
    </div>
  );
}
