/**
 * Coach domain types + seed data.
 * All in-memory for now — no backend, no auth. The store (store.tsx) hydrates
 * from these and applies status changes locally. Swap SEED_* for Google Sheets
 * rows when the read side is wired.
 */

export type SubmissionStatus = "New" | "In Review" | "Completed";

export interface CoachMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  membershipId: string;
  tier: "Standard" | "Elite";
  joined: string;
  submissionCount: number;
}

export interface CoachSubmission {
  id: string;
  member: CoachMember;
  analysisType: string;
  goal: string;
  dateLabel: string; // pre-formatted to avoid locale/hydration drift
  submittedAt: string; // ISO, for sorting
  status: SubmissionStatus;
  notes: string;
  videoUrl: string;
  feedback?: string;
  today?: boolean;
}

export const MEMBERS: CoachMember[] = [
  { id: "m1", name: "Henry Walsh", initials: "HW", email: "henry.walsh@example.com", membershipId: "MPC-2041", tier: "Elite", joined: "Jan 2025", submissionCount: 12 },
  { id: "m2", name: "Priya Sharma", initials: "PS", email: "priya.sharma@example.com", membershipId: "MPC-1187", tier: "Elite", joined: "Nov 2024", submissionCount: 18 },
  { id: "m3", name: "Marcus Delaney", initials: "MD", email: "marcus.d@example.com", membershipId: "MPC-2298", tier: "Standard", joined: "Mar 2025", submissionCount: 6 },
  { id: "m4", name: "Elena Kovač", initials: "EK", email: "elena.k@example.com", membershipId: "MPC-1902", tier: "Elite", joined: "Feb 2025", submissionCount: 9 },
  { id: "m5", name: "Tom Rutherford", initials: "TR", email: "tom.r@example.com", membershipId: "MPC-2055", tier: "Standard", joined: "Apr 2025", submissionCount: 4 },
  { id: "m6", name: "Aisha Bello", initials: "AB", email: "aisha.b@example.com", membershipId: "MPC-2310", tier: "Elite", joined: "May 2025", submissionCount: 7 },
];

const byId = (id: string) => MEMBERS.find((m) => m.id === id)!;

export const SUBMISSIONS: CoachSubmission[] = [
  { id: "s1", member: byId("m1"), analysisType: "Serve", goal: "Power", dateLabel: "Today, 9:24am", submittedAt: "2026-07-03T09:24:00Z", status: "New", today: true, videoUrl: "#", notes: "Second serve keeps dropping into the net under pressure — would love a look at my toss." },
  { id: "s2", member: byId("m2"), analysisType: "Backhand", goal: "Consistency", dateLabel: "Today, 8:10am", submittedAt: "2026-07-03T08:10:00Z", status: "New", today: true, videoUrl: "#", notes: "Two-hander feels late on faster balls. Timing help please." },
  { id: "s3", member: byId("m3"), analysisType: "Match Play", goal: "Match Tactics", dateLabel: "Today, 7:02am", submittedAt: "2026-07-03T07:02:00Z", status: "In Review", today: true, videoUrl: "#", notes: "Full set from Sunday's club match — struggled to close it out at 5-3." },
  { id: "s4", member: byId("m4"), analysisType: "Forehand", goal: "Technique", dateLabel: "2 Jul", submittedAt: "2026-07-02T14:00:00Z", status: "New", videoUrl: "#", notes: "Trying to flatten it out for more depth." },
  { id: "s5", member: byId("m5"), analysisType: "Volley", goal: "Footwork", dateLabel: "1 Jul", submittedAt: "2026-07-01T11:30:00Z", status: "In Review", videoUrl: "#", notes: "Split-step timing at the net." },
  { id: "s6", member: byId("m6"), analysisType: "Serve", goal: "Spin", dateLabel: "30 Jun", submittedAt: "2026-06-30T16:45:00Z", status: "New", videoUrl: "#", notes: "Kick serve isn't kicking. Grip check?" },
  { id: "s7", member: byId("m1"), analysisType: "Slice", goal: "Technique", dateLabel: "24 Jun", submittedAt: "2026-06-24T10:00:00Z", status: "Completed", videoUrl: "#", notes: "Backhand slice floating long.", feedback: "Great progress. Keep the racket-face a touch more closed and finish out front — sent 3 drills." },
  { id: "s8", member: byId("m2"), analysisType: "Doubles", goal: "Match Tactics", dateLabel: "22 Jun", submittedAt: "2026-06-22T09:00:00Z", status: "Completed", videoUrl: "#", notes: "Poaching decisions.", feedback: "Nice net coverage. Work on the I-formation cue we discussed." },
  { id: "s9", member: byId("m4"), analysisType: "Mental Performance", goal: "Confidence", dateLabel: "20 Jun", submittedAt: "2026-06-20T13:00:00Z", status: "Completed", videoUrl: "#", notes: "Tightening up on big points.", feedback: "Your reset routine is solid — added a breathing cue between points." },
];
