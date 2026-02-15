import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getDriverListMock } = vi.hoisted(() => ({
  getDriverListMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getDriverList: getDriverListMock,
}));

import DriversPage from "@/app/drivers/page";

describe("drivers page flow", () => {
  it("renders filtered roster and profile links", async () => {
    getDriverListMock.mockResolvedValueOnce([
      {
        slug: "carlos-mino",
        canonicalName: "Carlos Miño",
        countryCode: "ar",
        countryName: "Argentina",
        role: "Driver",
      },
      {
        slug: "kevin-fontana",
        canonicalName: "Kevin Fontana",
        countryCode: "ar",
        countryName: "Argentina",
        role: "Driver",
      },
    ]);

    const element = await DriversPage({
      searchParams: {
        lang: "en",
        q: "mino",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("SINTA drivers");
    expect(html).toContain("Carlos Miño");
    expect(html).not.toContain("Kevin Fontana");
    expect(html).toContain("/drivers/carlos-mino?lang=en");
  });

  it("preserves filters in language switch links", async () => {
    getDriverListMock.mockResolvedValueOnce([]);

    const element = await DriversPage({
      searchParams: {
        lang: "en",
        q: "kevin",
        active: "false",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("/drivers?q=kevin&amp;active=false");
    expect(html).toContain("/drivers?q=kevin&amp;active=false&amp;lang=en");
  });
});
