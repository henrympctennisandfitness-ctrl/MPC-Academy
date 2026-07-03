import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { Home } from "lucide-react";

/** Home dashboard. Scaffold only — the real dashboard lands here later. */
export default function HomePage() {
  return (
    <PagePlaceholder
      icon={Home}
      title="Home"
      description="Your dashboard will live here — greeting, coaching tip, progress and quick actions."
    />
  );
}
