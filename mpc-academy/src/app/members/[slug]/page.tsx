import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEMBERS, getMemberBySlug, MemberProfile } from "@/features/members";

/** Pre-render every known member profile at build time. */
export function generateStaticParams() {
  return MEMBERS.map((m) => ({ slug: m.slug }));
}

/** Per-member page title. `params` is async in Next 15. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  return { title: member ? member.name : "Member not found" };
}

/** Member profile route. Validates the slug, then renders the profile. */
export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getMemberBySlug(slug)) notFound();
  return <MemberProfile slug={slug} />;
}
