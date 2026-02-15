import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { AdminAuthError } from "./errors";
import type { AdminRole, AdminSession } from "./types";

const scrypt = promisify(scryptCallback);

export const ADMIN_SESSION_COOKIE = "sinta_admin_session";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_MAX_FAILED_ATTEMPTS = 5;
const DEFAULT_LOCK_MINUTES = 15;

export type AdminRuntimeConfig = {
  enableInDev: boolean;
  devDryRun: boolean;
  sessionSecret: string;
  passwordPepper: string;
  sessionTtlSeconds: number;
  maxFailedAttempts: number;
  lockMinutes: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getAdminRuntimeConfig(): AdminRuntimeConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const enableInDev = process.env.ADMIN_ENABLE_IN_DEV !== "0";
  const devDryRun = process.env.ADMIN_DEV_DRY_RUN !== "0";

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET?.trim() ??
    (nodeEnv === "production" ? "" : "dev-admin-session-secret");
  const passwordPepper =
    process.env.ADMIN_PASSWORD_PEPPER?.trim() ??
    (nodeEnv === "production" ? "" : "dev-admin-password-pepper");

  if (!sessionSecret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  }

  if (!passwordPepper) {
    throw new Error("Missing ADMIN_PASSWORD_PEPPER environment variable.");
  }

  return {
    enableInDev,
    devDryRun,
    sessionSecret,
    passwordPepper,
    sessionTtlSeconds: parsePositiveInt(process.env.ADMIN_SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS),
    maxFailedAttempts: parsePositiveInt(process.env.ADMIN_MAX_FAILED_ATTEMPTS, DEFAULT_MAX_FAILED_ATTEMPTS),
    lockMinutes: parsePositiveInt(process.env.ADMIN_LOCK_MINUTES, DEFAULT_LOCK_MINUTES),
  };
}

export function assertAdminRuntimeAllowed(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const config = getAdminRuntimeConfig();

  if (nodeEnv !== "production" && !config.enableInDev) {
    throw new AdminAuthError("Admin is disabled in this environment.");
  }
}

export function isAdminDryRunMode(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const config = getAdminRuntimeConfig();
  return nodeEnv === "development" && config.devDryRun;
}

export function normalizeAdminUsername(value: string): string {
  return value.trim().toLowerCase();
}

export async function hashAdminPassword(password: string): Promise<string> {
  const config = getAdminRuntimeConfig();
  const salt = randomBytes(16).toString("hex");
  const raw = `${password}${config.passwordPepper}`;
  const key = (await scrypt(raw, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyAdminPassword(password: string, encodedHash: string): Promise<boolean> {
  const config = getAdminRuntimeConfig();
  const [salt, expectedHex] = encodedHash.split(":");
  if (!salt || !expectedHex) {
    return false;
  }

  const raw = `${password}${config.passwordPepper}`;
  const actual = (await scrypt(raw, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenPayload(payloadB64: string): string {
  const config = getAdminRuntimeConfig();
  return createHmac("sha256", config.sessionSecret).update(payloadB64).digest("base64url");
}

export function createAdminSessionToken(input: {
  userId: string;
  username: string;
  role: AdminRole;
  mustChangePassword: boolean;
}): string {
  const config = getAdminRuntimeConfig();
  const expiresAtMs = Date.now() + config.sessionTtlSeconds * 1000;
  const payload: AdminSession = {
    userId: input.userId,
    username: input.username,
    role: input.role,
    mustChangePassword: input.mustChangePassword,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const signature = signTokenPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function parseAdminSessionToken(token: string): AdminSession {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    throw new AdminAuthError("Unauthorized.");
  }

  const expectedSignature = signTokenPayload(payloadB64);
  const left = Buffer.from(signature, "base64url");
  const right = Buffer.from(expectedSignature, "base64url");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new AdminAuthError("Unauthorized.");
  }

  let payload: AdminSession;
  try {
    payload = JSON.parse(decodeBase64Url(payloadB64)) as AdminSession;
  } catch {
    throw new AdminAuthError("Unauthorized.");
  }

  if (!payload?.userId || !payload.username || !payload.role || !payload.expiresAt) {
    throw new AdminAuthError("Unauthorized.");
  }

  if (!["owner", "editor"].includes(payload.role)) {
    throw new AdminAuthError("Unauthorized.");
  }

  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new AdminAuthError("Session expired.");
  }

  return payload;
}

export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  let out = "";

  for (let index = 0; index < 16; index += 1) {
    const value = bytes[index];
    if (value === undefined) {
      continue;
    }

    out += alphabet[value % alphabet.length];
  }

  return out;
}
