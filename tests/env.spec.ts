import { describe, expect, it } from "vitest";
import { readAppEnv } from "@/lib/server/env";

describe("readAppEnv", () => {
  it("returns DATABASE_URL when valid", () => {
    const env = readAppEnv({
      DATABASE_URL: "postgresql://postgres:secret@example.com:5432/postgres",
    });

    expect(env.DATABASE_URL).toContain("postgresql://");
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => readAppEnv({})).toThrow("Missing DATABASE_URL");
  });

  it("throws when DATABASE_URL is not a postgres URL", () => {
    expect(() =>
      readAppEnv({
        DATABASE_URL: "https://example.com",
      }),
    ).toThrow("DATABASE_URL must start");
  });
});
