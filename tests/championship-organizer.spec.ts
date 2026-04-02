import { describe, it } from "vitest";

const organizerName = "SINTA eSports";

describe("championship organizer", () => {
  it.todo(`persists ${organizerName} through createChampionship and updateChampionship`);

  it.todo("returns organizerName from listChampionships and the admin championships route");

  it.todo("treats organizerName as optional trimmed metadata and preserves null when updates are blank");
});
