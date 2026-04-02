import { describe, it } from "vitest";

const canonicalSessionOrder = ["qs", "s", "qf", "f", "p"] as const;
const legacyAliases = {
  primary: "s",
  secondary: "f",
} as const;

describe("admin event results contract", () => {
  it.todo(
    "normalizes legacy primary and secondary payload rows into the canonical field contract before validation",
  );

  it.todo(
    `rejects duplicate canonical rows once ${legacyAliases.primary}, ${legacyAliases.secondary}, and ${canonicalSessionOrder.join(
      ", ",
    )} inputs are normalized`,
  );

  it.todo(
    "accepts canonical qs, s, qf, f, and p raw values through updateEventResults and the admin results route adapter",
  );
});
