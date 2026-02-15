import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import type {
  ParsedHistoryWorkbook,
  ParsedRaceEvent,
  ParsedRaceResult,
  ResultStatus,
  SessionKind,
} from "./types.ts";

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

type SheetRows = Map<number, Map<string, string>>;

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

const STATUS_VALUES: Record<string, ResultStatus> = {
  DNF: "DNF",
  DNQ: "DNQ",
  DSQ: "DSQ",
  X: "ABSENT",
};

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9A-Fa-f]+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minOffset = Math.max(0, buffer.length - 65_557);

  for (let index = buffer.length - 22; index >= minOffset; index -= 1) {
    if (buffer.readUInt32LE(index) === EOCD_SIGNATURE) {
      return index;
    }
  }

  throw new Error("Invalid XLSX file: end of central directory not found.");
}

function parseZipEntries(buffer: Buffer): Map<string, ZipEntry> {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);

  const entries = new Map<string, ZipEntry>();
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    const signature = buffer.readUInt32LE(cursor);
    if (signature !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Invalid XLSX file: malformed central directory.");
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraFieldLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);

    const fileName = buffer
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString("utf8");

    entries.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    cursor += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function readZipFile(buffer: Buffer, entries: Map<string, ZipEntry>, path: string): Buffer {
  const entry = entries.get(path);
  if (!entry) {
    throw new Error(`Invalid XLSX file: missing entry ${path}.`);
  }

  const localOffset = entry.localHeaderOffset;
  const signature = buffer.readUInt32LE(localOffset);
  if (signature !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error(`Invalid XLSX file: malformed local header for ${path}.`);
  }

  const fileNameLength = buffer.readUInt16LE(localOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + entry.compressedSize;
  const data = buffer.subarray(dataStart, dataEnd);

  if (entry.compressionMethod === 0) {
    return data;
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(data);
  }

  throw new Error(`Unsupported compression method for ${path}: ${entry.compressionMethod}.`);
}

function parseAttributes(value: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributeRegex = /([:\w-]+)="([^"]*)"/g;

  for (const match of value.matchAll(attributeRegex)) {
    const key = match[1];
    const rawValue = decodeXmlEntities(match[2]);
    if (key) {
      attributes.set(key, rawValue);
    }
  }

  return attributes;
}

function parseSharedStrings(xml: string): string[] {
  const output: string[] = [];
  const sharedStringRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  const textRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;

  for (const sharedMatch of xml.matchAll(sharedStringRegex)) {
    const fragment = sharedMatch[1] ?? "";
    const parts: string[] = [];

    for (const textMatch of fragment.matchAll(textRegex)) {
      parts.push(decodeXmlEntities(textMatch[1] ?? ""));
    }

    output.push(parts.join(""));
  }

  return output;
}

function resolveSheetPath(workbookXml: string, relationshipsXml: string, targetSheet: string): string {
  const sheetRegex = /<sheet\b([^>]*)\/?>(?:<\/sheet>)?/g;
  const relationshipRegex = /<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/g;

  let relationshipId: string | null = null;

  for (const sheetMatch of workbookXml.matchAll(sheetRegex)) {
    const attributes = parseAttributes(sheetMatch[1] ?? "");
    const name = attributes.get("name");

    if (name === targetSheet) {
      relationshipId = attributes.get("r:id") ?? null;
      break;
    }
  }

  if (!relationshipId) {
    throw new Error(`Sheet \"${targetSheet}\" not found in workbook.`);
  }

  for (const relationshipMatch of relationshipsXml.matchAll(relationshipRegex)) {
    const attributes = parseAttributes(relationshipMatch[1] ?? "");
    if (attributes.get("Id") !== relationshipId) {
      continue;
    }

    const target = attributes.get("Target");
    if (!target) {
      throw new Error(`Relationship ${relationshipId} has no target.`);
    }

    if (target.startsWith("/")) {
      return target.replace(/^\//, "");
    }

    return `xl/${target}`;
  }

  throw new Error(`Relationship ${relationshipId} not found in workbook rels.`);
}

function parseSheetRows(sheetXml: string, sharedStrings: string[]): SheetRows {
  const rows: SheetRows = new Map();
  const rowRegex = /<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;

  for (const rowMatch of sheetXml.matchAll(rowRegex)) {
    const rowIndex = Number.parseInt(rowMatch[1] ?? "", 10);
    if (!Number.isFinite(rowIndex)) {
      continue;
    }

    const cellMap = new Map<string, string>();
    const rowContent = rowMatch[2] ?? "";

    for (const cellMatch of rowContent.matchAll(cellRegex)) {
      const attributeChunk = cellMatch[1] ?? "";
      const body = cellMatch[2] ?? "";
      const attributes = parseAttributes(attributeChunk);
      const cellRef = attributes.get("r");
      if (!cellRef) {
        continue;
      }

      const columnMatch = /^([A-Z]+)/.exec(cellRef);
      if (!columnMatch?.[1]) {
        continue;
      }
      const column = columnMatch[1];
      const cellType = attributes.get("t") ?? "";

      let value = "";

      if (cellType === "s") {
        const sharedValue = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        const index = Number.parseInt(sharedValue ?? "", 10);
        if (Number.isFinite(index) && index >= 0 && index < sharedStrings.length) {
          value = sharedStrings[index] ?? "";
        }
      } else if (cellType === "inlineStr") {
        const chunks: string[] = [];
        for (const textMatch of body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
          chunks.push(decodeXmlEntities(textMatch[1] ?? ""));
        }
        value = chunks.join("");
      } else {
        const rawValue = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
        value = decodeXmlEntities(rawValue);
      }

      const normalized = normalizeText(value);
      if (normalized) {
        cellMap.set(column, normalized);
      }
    }

    rows.set(rowIndex, cellMap);
  }

  return rows;
}

function lettersInRange(from: string, to: string): string[] {
  const output: string[] = [];
  const start = from.charCodeAt(0);
  const end = to.charCodeAt(0);

  for (let value = start; value <= end; value += 1) {
    output.push(String.fromCharCode(value));
  }

  return output;
}

function parseResultValue(rawValue: string): { position: number | null; status: ResultStatus | null } {
  const upper = rawValue.toUpperCase();
  const mappedStatus = STATUS_VALUES[upper];
  if (mappedStatus) {
    return { position: null, status: mappedStatus };
  }

  if (/^\d+(?:\.0+)?$/.test(rawValue)) {
    return { position: Number.parseInt(rawValue, 10), status: null };
  }

  return { position: null, status: null };
}

function makeEventKey(seasonYear: number, championshipSlug: string, sourceRow: number): string {
  return `${seasonYear}:${championshipSlug}:${sourceRow}`;
}

export function parseHistoryWorkbookFromBuffer(buffer: Buffer): ParsedHistoryWorkbook {
  const sheetName = "Estadisticas";
  const zipEntries = parseZipEntries(buffer);

  const workbookXml = readZipFile(buffer, zipEntries, "xl/workbook.xml").toString("utf8");
  const workbookRelsXml = readZipFile(buffer, zipEntries, "xl/_rels/workbook.xml.rels").toString(
    "utf8",
  );

  const sharedStringsXml = zipEntries.has("xl/sharedStrings.xml")
    ? readZipFile(buffer, zipEntries, "xl/sharedStrings.xml").toString("utf8")
    : "";

  const sheetPath = resolveSheetPath(workbookXml, workbookRelsXml, sheetName);
  const sheetXml = readZipFile(buffer, zipEntries, sheetPath).toString("utf8");

  const sharedStrings = parseSharedStrings(sharedStringsXml);
  const rows = parseSheetRows(sheetXml, sharedStrings);

  const row3 = rows.get(3) ?? new Map<string, string>();
  const row4 = rows.get(4) ?? new Map<string, string>();

  const columnMappings = new Map<
    string,
    { driverAlias: string; sessionKind: SessionKind; sessionLabel: string }
  >();

  let currentDriver = "";
  const driverColumnCount = new Map<string, number>();

  for (const column of lettersInRange("J", "W")) {
    const driverValue = row3.get(column);
    if (driverValue) {
      currentDriver = driverValue;
    }

    if (!currentDriver) {
      continue;
    }

    const count = (driverColumnCount.get(currentDriver) ?? 0) + 1;
    driverColumnCount.set(currentDriver, count);

    const sessionKind: SessionKind = count % 2 === 1 ? "primary" : "secondary";
    const sessionLabel =
      row4.get(column) ?? (sessionKind === "primary" ? "Sprint" : "Final");

    columnMappings.set(column, {
      driverAlias: currentDriver,
      sessionKind,
      sessionLabel,
    });
  }

  const warnings: string[] = [];

  type TempEvent = Omit<ParsedRaceEvent, "roundNumber">;
  type TempResult = Omit<ParsedRaceResult, "roundNumber">;

  const tempEvents: TempEvent[] = [];
  const tempResults: TempResult[] = [];
  const seenEventKeys = new Set<string>();

  let currentSeasonYear: number | null = null;
  let currentChampionshipName = "";

  const rowIndexes = Array.from(rows.keys()).sort((left, right) => left - right);

  for (const rowIndex of rowIndexes) {
    const row = rows.get(rowIndex);
    if (!row) {
      continue;
    }

    const seasonYearValue = row.get("G");
    if (seasonYearValue && /^\d{4}(?:\.0+)?$/.test(seasonYearValue)) {
      currentSeasonYear = Number.parseInt(seasonYearValue, 10);
    }

    const championshipValue = row.get("H");
    if (championshipValue) {
      currentChampionshipName = championshipValue;
    }

    const circuitName = row.get("I");
    if (!circuitName) {
      continue;
    }

    if (circuitName === "Circuito" || circuitName === "Torneo" || circuitName === "Promedio") {
      continue;
    }

    if (!currentSeasonYear || !currentChampionshipName) {
      warnings.push(`Skipped row ${rowIndex}: missing season/championship context.`);
      continue;
    }

    const championshipSlug = slugify(currentChampionshipName);
    if (!championshipSlug) {
      warnings.push(`Skipped row ${rowIndex}: invalid championship slug.`);
      continue;
    }

    const eventKey = makeEventKey(currentSeasonYear, championshipSlug, rowIndex);
    const rowResults: TempResult[] = [];

    for (const [column, mapping] of columnMappings.entries()) {
      const rawValue = row.get(column);
      if (!rawValue) {
        continue;
      }

      const parsedValue = parseResultValue(rawValue);
      if (parsedValue.position === null && parsedValue.status === null) {
        warnings.push(`Skipped value at row ${rowIndex}, column ${column}: ${rawValue}`);
        continue;
      }

      rowResults.push({
        eventKey,
        seasonYear: currentSeasonYear,
        championshipName: currentChampionshipName,
        championshipSlug,
        sourceRow: rowIndex,
        circuitName,
        driverAlias: mapping.driverAlias,
        sessionKind: mapping.sessionKind,
        rawValue,
        position: parsedValue.position,
        status: parsedValue.status,
      });
    }

    if (rowResults.length === 0) {
      continue;
    }

    if (!seenEventKeys.has(eventKey)) {
      tempEvents.push({
        seasonYear: currentSeasonYear,
        championshipName: currentChampionshipName,
        championshipSlug,
        circuitName,
        sourceSheet: sheetName,
        sourceRow: rowIndex,
      });
      seenEventKeys.add(eventKey);
    }

    tempResults.push(...rowResults);
  }

  const roundsByEventKey = new Map<string, number>();

  const groupedEvents = new Map<string, TempEvent[]>();
  for (const event of tempEvents) {
    const groupKey = `${event.seasonYear}:${event.championshipSlug}`;
    const group = groupedEvents.get(groupKey) ?? [];
    group.push(event);
    groupedEvents.set(groupKey, group);
  }

  for (const group of groupedEvents.values()) {
    group.sort((left, right) => left.sourceRow - right.sourceRow);
    group.forEach((event, index) => {
      const roundNumber = index + 1;
      roundsByEventKey.set(
        makeEventKey(event.seasonYear, event.championshipSlug, event.sourceRow),
        roundNumber,
      );
    });
  }

  const events: ParsedRaceEvent[] = tempEvents
    .map((event) => {
      const roundNumber = roundsByEventKey.get(
        makeEventKey(event.seasonYear, event.championshipSlug, event.sourceRow),
      );

      if (!roundNumber) {
        throw new Error(`Missing round number for row ${event.sourceRow}.`);
      }

      return {
        ...event,
        roundNumber,
      };
    })
    .sort((left, right) => {
      if (left.seasonYear !== right.seasonYear) {
        return left.seasonYear - right.seasonYear;
      }

      if (left.championshipSlug !== right.championshipSlug) {
        return left.championshipSlug.localeCompare(right.championshipSlug);
      }

      return left.roundNumber - right.roundNumber;
    });

  const results: ParsedRaceResult[] = tempResults
    .map((result) => {
      const roundNumber = roundsByEventKey.get(result.eventKey);
      if (!roundNumber) {
        throw new Error(`Missing round number for result at row ${result.sourceRow}.`);
      }

      return {
        ...result,
        roundNumber,
      };
    })
    .sort((left, right) => {
      if (left.seasonYear !== right.seasonYear) {
        return left.seasonYear - right.seasonYear;
      }

      if (left.championshipSlug !== right.championshipSlug) {
        return left.championshipSlug.localeCompare(right.championshipSlug);
      }

      if (left.roundNumber !== right.roundNumber) {
        return left.roundNumber - right.roundNumber;
      }

      return left.driverAlias.localeCompare(right.driverAlias);
    });

  return {
    events,
    results,
    warnings,
    sourceSheet: sheetName,
  };
}

export function parseHistoryWorkbookFromFile(filePath: string): ParsedHistoryWorkbook {
  const buffer = readFileSync(filePath);
  return parseHistoryWorkbookFromBuffer(buffer);
}

export function normalizeAlias(value: string): string {
  return normalizeText(value).toLowerCase();
}

export function normalizeSessionLabel(value: string): string {
  return normalizeText(value);
}

export function toChampionshipSlug(value: string): string {
  return slugify(value);
}

