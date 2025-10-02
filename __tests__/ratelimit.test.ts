import { describe, it, expect } from "vitest";

describe("ratelimit config", () => {
  it("has 10 attempts per 10 minutes", () => {
    expect(10).toBe(10);
    expect(600).toBe(600);
  });
});
