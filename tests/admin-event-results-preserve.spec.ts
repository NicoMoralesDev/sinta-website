import { describe, it } from "vitest";

describe("admin event results preserve", () => {
  it.todo(
    "preserve untouched persisted canonical rows when a save payload omits qs, qf, or p cells for a legacy event",
  );

  it.todo(
    "preserve legacy omissions instead of synthesizing canonical rows during replace-all save normalization",
  );

  it.todo("preserve existing canonical raw values when an admin edit changes only one field in the save-path");
});
