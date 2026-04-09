"use client";

import { useState } from "react";

type ShareNavigator = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

export type ShareResultStatus = "shared-file" | "shared-url" | "opened" | "aborted";

type ShareResultsImageArgs = {
  fetchImpl: typeof fetch;
  navigatorObject?: ShareNavigator;
  imageUrl: string;
  title: string;
  text: string;
  fileName: string;
  openFallback: (url: string) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function buildShareFile(fetchImpl: typeof fetch, imageUrl: string, fileName: string): Promise<File | null> {
  const response = await fetchImpl(imageUrl, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();
  return new File([blob], fileName, {
    type: response.headers.get("content-type") ?? "image/png",
  });
}

export async function shareResultsImage({
  fetchImpl,
  navigatorObject,
  imageUrl,
  title,
  text,
  fileName,
  openFallback,
}: ShareResultsImageArgs): Promise<ShareResultStatus> {
  if (!navigatorObject?.share) {
    openFallback(imageUrl);
    return "opened";
  }

  try {
    const file = await buildShareFile(fetchImpl, imageUrl, fileName);
    if (file && navigatorObject.canShare?.({ files: [file] })) {
      await navigatorObject.share({
        title,
        text,
        files: [file],
      });
      return "shared-file";
    }
  } catch (error) {
    if (isAbortError(error)) {
      return "aborted";
    }
  }

  try {
    await navigatorObject.share({
      title,
      text,
      url: imageUrl,
    });
    return "shared-url";
  } catch (error) {
    if (isAbortError(error)) {
      return "aborted";
    }
  }

  openFallback(imageUrl);
  return "opened";
}

function slugifyFilePart(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "event";
}

export function buildResultsShareFileName(roundNumber: number, circuitName: string): string {
  return `sinta-r${roundNumber}-${slugifyFilePart(circuitName)}.png`;
}

type ResultShareButtonProps = {
  imageHref: string;
  label: string;
  pendingLabel: string;
  shareTitle: string;
  shareText: string;
  fileName: string;
  className?: string;
};

export function ResultShareButton({
  imageHref,
  label,
  pendingLabel,
  shareTitle,
  shareText,
  fileName,
  className,
}: ResultShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  async function onClick() {
    if (isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      const imageUrl = new URL(imageHref, window.location.origin).toString();
      await shareResultsImage({
        fetchImpl: fetch,
        navigatorObject: navigator,
        imageUrl,
        title: shareTitle,
        text: shareText,
        fileName,
        openFallback: (url) => {
          window.open(url, "_blank", "noopener,noreferrer");
        },
      });
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={isSharing}
      aria-busy={isSharing || undefined}
      data-share-image-href={imageHref}
      className={className}
    >
      {isSharing ? pendingLabel : label}
    </button>
  );
}
