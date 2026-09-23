import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  isTerminal,
  shouldReleaseEntitlement,
} from "./stateMachine";

describe("submission state machine", () => {
  it("allows the happy coaching path", () => {
    expect(canTransition("DRAFT", "UPLOADING", "MEMBER")).toBe(true);
    expect(canTransition("UPLOADING", "SUBMITTED", "SYSTEM")).toBe(true);
    expect(canTransition("SUBMITTED", "IN_REVIEW", "COACH")).toBe(true);
    expect(canTransition("IN_REVIEW", "COMPLETED", "COACH")).toBe(true);
  });

  it("forbids members from setting IN_REVIEW or COMPLETED", () => {
    expect(canTransition("SUBMITTED", "IN_REVIEW", "MEMBER")).toBe(false);
    expect(canTransition("IN_REVIEW", "COMPLETED", "MEMBER")).toBe(false);
    expect(() => assertTransition("SUBMITTED", "IN_REVIEW", "MEMBER")).toThrow();
  });

  it("lets members cancel pre-submission but not review states", () => {
    expect(canTransition("DRAFT", "CANCELLED", "MEMBER")).toBe(true);
    expect(canTransition("UPLOADING", "CANCELLED", "MEMBER")).toBe(true);
    expect(canTransition("SUBMITTED", "CANCELLED", "MEMBER")).toBe(false);
  });

  it("only admin can force-cancel later states", () => {
    expect(canTransition("IN_REVIEW", "CANCELLED", "ADMIN")).toBe(true);
    expect(canTransition("IN_REVIEW", "CANCELLED", "COACH")).toBe(false);
  });

  it("marks terminal states and rejects transitions out of them", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("FAILED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("SUBMITTED")).toBe(false);
    expect(canTransition("COMPLETED", "IN_REVIEW", "ADMIN")).toBe(false);
  });

  it("flags FAILED/CANCELLED as entitlement-releasing", () => {
    expect(shouldReleaseEntitlement("FAILED")).toBe(true);
    expect(shouldReleaseEntitlement("CANCELLED")).toBe(true);
    expect(shouldReleaseEntitlement("SUBMITTED")).toBe(false);
    expect(shouldReleaseEntitlement("COMPLETED")).toBe(false);
  });
});
