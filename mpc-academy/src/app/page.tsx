import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { CoachStudioCard } from "@/components/CoachStudioCard";
import { Home } from "lucide-react";
import { canAccessCoach } from "@/lib/access";

/** Home dashboard. Scaffold only — the real dashboard lands here later. */
export default function HomePage() {
  // Coaches/admins get a Coach Studio entry point; Academy Members never see it.
  // AUTH (future): derive this from the real session user instead of the mock.
  const showCoachStudio = canAccessCoach();

  return (
    <div className="space-y-6">
      {showCoachStudio && <CoachStudioCard />}
      <PagePlaceholder
        icon={Home}
        title="Home"
        description="Your dashboard will live here — greeting, coaching tip, progress and quick actions."
      />
    </div>
  );
}
