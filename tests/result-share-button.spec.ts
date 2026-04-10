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
      clipboardItemCtor: undefined,
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

  it("copies the fetched image to the clipboard when native file sharing fails", async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    const shareMock = vi.fn().mockRejectedValue(new Error("Share failed."));
    class ClipboardItemMock {
      items: Record<string, Blob>;

      constructor(items: Record<string, Blob>) {
        this.items = items;
      }
    }

    const navigatorObject = {
      share: shareMock,
      canShare: vi.fn().mockReturnValue(true),
      clipboard: {
        write: writeMock,
      },
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
      clipboardItemCtor: ClipboardItemMock as unknown as typeof ClipboardItem,
      imageUrl: "https://example.com/image.png",
      title: "Share",
      text: "Result image",
      fileName: "result.png",
      openFallback: vi.fn(),
    });

    expect(status).toBe("copied-image");
    expect(shareMock).toHaveBeenCalledTimes(1);
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  it("opens the fallback URL when sharing is unavailable", async () => {
    const openFallback = vi.fn();
    const fetchImpl = vi.fn();

    const status = await shareResultsImage({
      fetchImpl,
      navigatorObject: {},
      clipboardItemCtor: undefined,
      imageUrl: "https://example.com/image.png",
      title: "Share",
      text: "Result image",
      fileName: "result.png",
      openFallback,
    });

    expect(status).toBe("opened");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(openFallback).toHaveBeenCalledWith("https://example.com/image.png");
  });
});
