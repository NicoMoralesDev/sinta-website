import { describe, expect, it, vi } from "vitest";

import { shareResultsImage } from "@/app/components/result-share-button";

describe("result share button helpers", () => {
  it("shares a fetched image file when file sharing is supported", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const navigatorObject = {
      share: shareMock,
      canShare: vi.fn().mockReturnValue(true),
    };
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(new Blob(["png-binary"], { type: "image/png" }), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    const openFallback = vi.fn();

    const status = await shareResultsImage({
      fetchImpl,
      navigatorObject,
      imageUrl: "https://example.com/image.png",
      title: "Share",
      text: "Result image",
      fileName: "result.png",
      openFallback,
    });

    expect(status).toBe("shared-file");
    expect(fetchImpl).toHaveBeenCalledWith("https://example.com/image.png", { cache: "no-store" });
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Share",
        text: "Result image",
        files: [expect.any(File)],
      }),
    );
    expect(openFallback).not.toHaveBeenCalled();
  });

  it("falls back to URL sharing when file sharing is unavailable", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const navigatorObject = {
      share: shareMock,
      canShare: vi.fn().mockReturnValue(false),
    };
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(new Blob(["png-binary"], { type: "image/png" }), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );

    const status = await shareResultsImage({
      fetchImpl,
      navigatorObject,
      imageUrl: "https://example.com/image.png",
      title: "Share",
      text: "Result image",
      fileName: "result.png",
      openFallback: vi.fn(),
    });

    expect(status).toBe("shared-url");
    expect(shareMock).toHaveBeenCalledWith({
      title: "Share",
      text: "Result image",
      url: "https://example.com/image.png",
    });
  });

  it("opens the fallback URL when sharing is unavailable", async () => {
    const openFallback = vi.fn();

    const status = await shareResultsImage({
      fetchImpl: vi.fn(),
      navigatorObject: {},
      imageUrl: "https://example.com/image.png",
      title: "Share",
      text: "Result image",
      fileName: "result.png",
      openFallback,
    });

    expect(status).toBe("opened");
    expect(openFallback).toHaveBeenCalledWith("https://example.com/image.png");
  });
});
