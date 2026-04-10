"use client";

import { useState } from "react";

type ShareNavigator = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  clipboard?: {
    write?: (items: ClipboardItem[]) => Promise<void>;
  };
};

export type ShareResultStatus = "shared-file" | "copied-image" | "opened" | "aborted";

type ShareResultsImageArgs = {
  fetchImpl: typeof fetch;
  navigatorObject?: ShareNavigator;
  clipboardItemCtor?: typeof ClipboardItem;
  imageUrl: string;
  title: string;
  text: string;
  fileName: string;
  openFallback: (url: string) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function buildShareAsset(
  fetchImpl: typeof fetch,
  imageUrl: string,
  fileName: string,
): Promise<{ blob: Blob; file: File } | null> {
  const response = await fetchImpl(imageUrl, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();
  const type = response.headers.get("content-type") ?? "image/png";

  return {
    blob,
    file: new File([blob], fileName, { type }),
  };
}

async function copyImageToClipboard(
  blob: Blob,
  navigatorObject: ShareNavigator | undefined,
  clipboardItemCtor: typeof ClipboardItem | undefined,
): Promise<boolean> {
  if (!navigatorObject?.clipboard?.write || !clipboardItemCtor || !blob.type.startsWith("image/")) {
    return false;
  }

  await navigatorObject.clipboard.write([
    new clipboardItemCtor({
      [blob.type]: blob,
    }),
  ]);

  return true;
}

function canShareImageFiles(
  navigatorObject: ShareNavigator | undefined,
  fileName: string,
): boolean {
  if (!navigatorObject?.share || !navigatorObject.canShare || typeof File === "undefined") {
    return false;
  }

  try {
    return navigatorObject.canShare({
      files: [new File([""], fileName, { type: "image/png" })],
    });
  } catch {
    return false;
  }
}

export async function shareResultsImage({
  fetchImpl,
  navigatorObject,
  clipboardItemCtor,
  imageUrl,
  title,
  text,
  fileName,
  openFallback,
}: ShareResultsImageArgs): Promise<ShareResultStatus> {
  let asset: { blob: Blob; file: File } | null = null;
  const supportsFileShare = canShareImageFiles(navigatorObject, fileName);

  if (!supportsFileShare) {
    openFallback(imageUrl);
    return "opened";
  }

  try {
    asset = await buildShareAsset(fetchImpl, imageUrl, fileName);
    if (asset && navigatorObject?.share) {
      await navigatorObject.share({
        title,
        text,
        files: [asset.file],
      });
      return "shared-file";
    }
  } catch (error) {
    if (isAbortError(error)) {
      return "aborted";
    }
  }

  try {
    if (asset && (await copyImageToClipboard(asset.blob, navigatorObject, clipboardItemCtor))) {
      return "copied-image";
    }
  } catch (error) {
    if (isAbortError(error)) {
      return "aborted";
    }
  }

  openFallback(imageUrl);
  return "opened";
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
        clipboardItemCtor: typeof ClipboardItem === "undefined" ? undefined : ClipboardItem,
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
