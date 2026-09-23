import { describe, it, expect } from "vitest";
import { createSubmissionSchema, NOTES_MAX } from "./validation";

describe("createSubmissionSchema", () => {
  it("accepts valid input and defaults notes", () => {
    const parsed = createSubmissionSchema.parse({ analysisType: "Serve", goal: "Power" });
    expect(parsed.notes).toBe("");
  });

  it("rejects unknown analysis types and goals", () => {
    expect(createSubmissionSchema.safeParse({ analysisType: "Nope", goal: "Power" }).success).toBe(false);
    expect(createSubmissionSchema.safeParse({ analysisType: "Serve", goal: "Nope" }).success).toBe(false);
  });

  it("rejects over-long notes", () => {
    const notes = "x".repeat(NOTES_MAX + 1);
    expect(createSubmissionSchema.safeParse({ analysisType: "Serve", goal: "Power", notes }).success).toBe(false);
  });
});
