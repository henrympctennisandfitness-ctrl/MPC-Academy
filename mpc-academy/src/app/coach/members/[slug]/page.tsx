import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEMBERS, getMemberBySlug, MemberProfile } from "@/features/members";

/** Pre-render every member profile for the coach roster. */
export function generateStaticParams() {
  return MEMBERS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  return { title: member ? `Coach · ${member.name}` : "Member not found" };
}

/** Coach-facing member profile. Back link returns to the coach roster. */
export default async function CoachMemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getMemberBySlug(slug)) notFound();
  return <MemberProfile slug={slug} backHref="/coach/members" backLabel="All members" />;
}
