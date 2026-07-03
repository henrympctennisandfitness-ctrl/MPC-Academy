import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = { title: "Academy Events" };

/** Academy Events. Socials, competitions, camps and tours. */
export default function EventsPage() {
  return (
    <PagePlaceholder
      icon={CalendarDays}
      title="Academy events"
      description="Socials, competitions, camps and members' tours will be listed here."
    />
  );
}
