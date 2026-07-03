import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { User } from "lucide-react";

export const metadata: Metadata = { title: "Your Profile" };

/** Settings / You. Profile, notifications, privacy, logout. */
export default function SettingsPage() {
  return (
    <PagePlaceholder
      icon={User}
      title="Your profile"
      description="Profile, notification and privacy settings will live here."
    />
  );
}
