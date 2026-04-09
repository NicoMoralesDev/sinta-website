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
