import { describe, it, expect } from "vitest";
import {
  hasRole,
  isCoach,
  isAdmin,
  canReviewSubmissions,
  ownsSubmission,
  canViewSubmission,
  type Principal,
} from "./roles";

const member: Principal = { userId: "u-member", roles: ["MEMBER"] };
const coach: Principal = { userId: "u-coach", roles: ["COACH", "ADMIN"] };

describe("role helpers", () => {
  it("hasRole reflects assignments", () => {
    expect(hasRole(member, "MEMBER")).toBe(true);
    expect(hasRole(member, "COACH")).toBe(false);
    expect(hasRole(coach, "ADMIN")).toBe(true);
  });

  it("isCoach is true for COACH or ADMIN only", () => {
    expect(isCoach(member)).toBe(false);
    expect(isCoach(coach)).toBe(true);
    expect(isCoach({ userId: "x", roles: ["ADMIN"] })).toBe(true);
  });

  it("only admins manage; only coaches review", () => {
    expect(isAdmin(member)).toBe(false);
    expect(canReviewSubmissions(member)).toBe(false);
    expect(canReviewSubmissions(coach)).toBe(true);
  });
});

describe("ownership boundaries", () => {
  it("member owns only their own submission", () => {
    expect(ownsSubmission(member, { memberId: "u-member" })).toBe(true);
    expect(ownsSubmission(member, { memberId: "someone-else" })).toBe(false);
  });

  it("member cannot view others' submissions (no enumeration); coach can", () => {
    const other = { memberId: "other-member" };
    expect(canViewSubmission(member, other)).toBe(false);
    expect(canViewSubmission(coach, other)).toBe(true);
  });
});
