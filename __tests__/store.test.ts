import { describe, it, expect } from "vitest";
import { MAX_VERSIONS } from "../lib/store";

describe("store versioning", () => {
  it("keeps max versions at 5", () => {
    expect(MAX_VERSIONS).toBe(5);
  });
});
