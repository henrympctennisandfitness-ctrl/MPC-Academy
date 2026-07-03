import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { Gift } from "lucide-react";

export const metadata: Metadata = { title: "Member Benefits" };

/** Member Benefits. Partner perks, discount codes, equipment offers. */
export default function BenefitsPage() {
  return (
    <PagePlaceholder
      icon={Gift}
      title="Member benefits"
      description="Partner perks, equipment offers and discount codes will appear here."
    />
  );
}
