import type { Metadata } from "next";
import { SubmitWizard } from "@/features/submit";

export const metadata: Metadata = { title: "Submit Analysis" };

/**
 * Submit Analysis route.
 * Thin wrapper — all wizard logic lives in the `submit` feature module so this
 * page stays declarative and other routes are untouched.
 */
export default function SubmitPage() {
  return <SubmitWizard />;
}
