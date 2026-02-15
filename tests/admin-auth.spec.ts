import { beforeEach, describe, expect, it } from "vitest";

import {
  createAdminSessionToken,
  hashAdminPassword,
  parseAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/server/admin/auth";

describe("admin auth", () => {
  beforeEach(() => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      ADMIN_SESSION_SECRET: "test-session-secret",
      ADMIN_PASSWORD_PEPPER: "test-password-pepper",
      ADMIN_SESSION_TTL_SECONDS: "3600",
    });
  });

  it("hashes and verifies password", async () => {
    const hash = await hashAdminPassword("super-secure-password");

    await expect(verifyAdminPassword("super-secure-password", hash)).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("creates and parses signed session tokens", () => {
    const token = createAdminSessionToken({
      userId: "11111111-1111-4111-8111-111111111111",
      username: "owner",
      role: "owner",
      mustChangePassword: true,
    });

    const session = parseAdminSessionToken(token);

    expect(session.userId).toBe("11111111-1111-4111-8111-111111111111");
    expect(session.username).toBe("owner");
    expect(session.role).toBe("owner");
    expect(session.mustChangePassword).toBe(true);
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects tampered tokens", () => {
    const token = createAdminSessionToken({
      userId: "11111111-1111-4111-8111-111111111111",
      username: "owner",
      role: "editor",
      mustChangePassword: false,
    });

    const [payload] = token.split(".");
    const tampered = `${payload}.invalid-signature`;

    expect(() => parseAdminSessionToken(tampered)).toThrow("Unauthorized");
  });
});
