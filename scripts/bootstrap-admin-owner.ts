import { closeDbPool, getDbPool } from "../lib/server/db.ts";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

function normalizeAdminUsername(value: string): string {
  return value.trim().toLowerCase();
}

async function hashAdminPassword(password: string): Promise<string> {
  const pepper = process.env.ADMIN_PASSWORD_PEPPER?.trim();
  if (!pepper) {
    throw new Error("Missing ADMIN_PASSWORD_PEPPER.");
  }

  const salt = randomBytes(16).toString("hex");
  const raw = `${password}${pepper}`;
  const key = (await scrypt(raw, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

type BootstrapSummary = {
  username: string;
  created: boolean;
  role: "owner";
  mustChangePassword: boolean;
};

async function main(): Promise<void> {
  const usernameRaw =
    process.env.ADMIN_BOOTSTRAP_USERNAME?.trim() ??
    process.env.ADMIN_BOOTSTRAP_EMAIL?.trim() ??
    "";
  const passwordRaw = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() ?? "";

  if (!usernameRaw) {
    throw new Error("Missing ADMIN_BOOTSTRAP_USERNAME.");
  }

  if (!passwordRaw || passwordRaw.length < 10) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must have at least 10 characters.");
  }

  const usernameNormalized = normalizeAdminUsername(usernameRaw);
  const pool = getDbPool();

  const existingResult = await pool.query<{ id: string }>(
    "select id from users where username_normalized = $1 limit 1",
    [usernameNormalized],
  );

  if (existingResult.rows.length > 0) {
    const summary: BootstrapSummary = {
      username: usernameRaw,
      created: false,
      role: "owner",
      mustChangePassword: true,
    };
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const passwordHash = await hashAdminPassword(passwordRaw);

  await pool.query(
    `
      insert into users (
        username,
        username_normalized,
        password_hash,
        role,
        is_active,
        must_change_password,
        failed_attempts,
        locked_until,
        updated_at
      )
      values ($1, $2, $3, 'owner', true, true, 0, null, now())
    `,
    [usernameRaw, usernameNormalized, passwordHash],
  );

  const summary: BootstrapSummary = {
    username: usernameRaw,
    created: true,
    role: "owner",
    mustChangePassword: true,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDbPool();
  });
