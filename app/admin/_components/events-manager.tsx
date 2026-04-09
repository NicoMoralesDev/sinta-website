"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminCanonicalResultField,
  AdminChampionship,
  AdminEvent,
  AdminEventResultCellValue,
  AdminEventResultsGrid,
  EventResultCellInput,
} from "@/lib/server/admin/types";
import { CANONICAL_RESULT_FIELDS, type ResultStatus } from "@/lib/server/history/types";

type Props = {
  events: AdminEvent[];
  championships: AdminChampionship[];
  championshipFilterId?: string | null;
};

type FormState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

type EventDraft = {
  championshipId: string;
  roundNumber: string;
  circuitName: string;
  eventDate: string;
};

type ResultValues = Record<AdminCanonicalResultField, string>;

export type EditableResultRow = {
  driverId: string;
  driverName: string;
  initialValues: ResultValues;
  values: ResultValues;
};

type ParsedResultValue = {
  position: number | null;
  status: ResultStatus | null;
  rawValue: string;
};

export type ParsedResultInput =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "value"; value: ParsedResultValue };

export const COMPACT_RESULT_FIELD_LABELS: Record<AdminCanonicalResultField, string> = {
  qs: "QS",
  s: "S",
  qf: "QF",
  f: "F",
  p: "P",
};

function cellToValue(cell: AdminEventResultCellValue | null | undefined): string {
  if (!cell) {
    return "";
  }
  if (cell.rawValue.trim()) {
    return cell.rawValue;
  }
  if (cell.position !== null) {
    return String(cell.position);
  }
  if (cell.status) {
    return cell.status;
  }
  return "";
}

function createEmptyResultValues(): ResultValues {
  return CANONICAL_RESULT_FIELDS.reduce((result, field) => {
    result[field] = "";
    return result;
  }, {} as ResultValues);
}

function createCellKey(driverId: string, field: AdminCanonicalResultField): string {
  return `${driverId}:${field}`;
}

function isPointsField(field: AdminCanonicalResultField): boolean {
  return field === "p";
}

function normalizePointsNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getResultFieldLabel(
  field: AdminCanonicalResultField,
  labels: Record<AdminCanonicalResultField, string>,
  compact: boolean,
): string {
  return compact ? COMPACT_RESULT_FIELD_LABELS[field] : labels[field] ?? COMPACT_RESULT_FIELD_LABELS[field];
}

export function parseResultInput(field: AdminCanonicalResultField, value: string): ParsedResultInput {
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return { kind: "empty" };
  }

  if (isPointsField(field)) {
    if (!/^\d+(\.\d)?$/.test(normalized)) {
      return { kind: "invalid" };
    }

    const numberValue = Number.parseFloat(normalized);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return { kind: "invalid" };
    }

    return {
      kind: "value",
      value: {
        position: numberValue,
        status: null,
        rawValue: normalizePointsNumber(numberValue),
      },
    };
  }

  if (/^\d+$/.test(normalized)) {
    const numberValue = Number.parseInt(normalized, 10);
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      return { kind: "invalid" };
    }

    return {
      kind: "value",
      value: {
        position: numberValue,
        status: null,
        rawValue: String(numberValue),
      },
    };
  }

  if (normalized === "DNF" || normalized === "DNQ" || normalized === "DSQ" || normalized === "ABSENT") {
    return {
      kind: "value",
      value: {
        position: null,
        status: normalized,
        rawValue: normalized,
      },
    };
  }

  return { kind: "invalid" };
}

function normalizeResultInputForComparison(field: AdminCanonicalResultField, value: string): string {
  const parsed = parseResultInput(field, value);
  if (parsed.kind === "empty") {
    return "";
  }
  if (parsed.kind === "value") {
    return parsed.value.rawValue;
  }
  return value.trim().toUpperCase();
}

export function createEditableResultRows(grid: AdminEventResultsGrid): EditableResultRow[] {
  return grid.drivers.map((driver) => {
    const initialValues = createEmptyResultValues();

    for (const field of grid.fieldOrder) {
      initialValues[field] = cellToValue(driver.results[field]);
    }

    return {
      driverId: driver.driverId,
      driverName: driver.driverName,
      initialValues,
      values: { ...initialValues },
    };
  });
}

export function getInvalidResultCellKeys(
  rows: EditableResultRow[],
  fieldOrder: AdminCanonicalResultField[],
): Set<string> {
  const invalidCellKeys = new Set<string>();

  for (const row of rows) {
    for (const field of fieldOrder) {
      if (parseResultInput(field, row.values[field]).kind === "invalid") {
        invalidCellKeys.add(createCellKey(row.driverId, field));
      }
    }
  }

  return invalidCellKeys;
}

export function getDirtyResultCellKeys(
  rows: EditableResultRow[],
  fieldOrder: AdminCanonicalResultField[],
): Set<string> {
  const dirtyCellKeys = new Set<string>();

  for (const row of rows) {
    for (const field of fieldOrder) {
      if (
        normalizeResultInputForComparison(field, row.values[field]) !==
        normalizeResultInputForComparison(field, row.initialValues[field])
      ) {
        dirtyCellKeys.add(createCellKey(row.driverId, field));
      }
    }
  }

  return dirtyCellKeys;
}

export function serializeDirtyResultCells(
  rows: EditableResultRow[],
  fieldOrder: AdminCanonicalResultField[],
): EventResultCellInput[] {
  const dirtyRows: EventResultCellInput[] = [];

  for (const row of rows) {
    for (const field of fieldOrder) {
      const normalizedCurrent = normalizeResultInputForComparison(field, row.values[field]);
      const normalizedInitial = normalizeResultInputForComparison(field, row.initialValues[field]);

      if (normalizedCurrent === normalizedInitial) {
        continue;
      }

      const parsed = parseResultInput(field, row.values[field]);
      if (parsed.kind === "invalid") {
        throw new Error(`Invalid cell for ${row.driverName} in ${field}.`);
      }

      if (parsed.kind === "empty") {
        dirtyRows.push({
          driverId: row.driverId,
          sessionKind: field,
          position: null,
          status: null,
          rawValue: "",
          isActive: false,
        });
        continue;
      }

      dirtyRows.push({
        driverId: row.driverId,
        sessionKind: field,
        position: parsed.value.position,
        status: parsed.value.status,
        rawValue: parsed.value.rawValue,
        isActive: true,
      });
    }
  }

  return dirtyRows;
}

function toDraft(event: AdminEvent): EventDraft {
  return {
    championshipId: event.championshipId,
    roundNumber: String(event.roundNumber),
    circuitName: event.circuitName,
    eventDate: event.eventDate ?? "",
  };
}

type EventResultsEditorPanelProps = {
  event: AdminEvent;
  grid: AdminEventResultsGrid;
  rows: EditableResultRow[];
  invalidCellKeys: Set<string>;
  dirtyCellKeys?: Set<string>;
  isSaving: boolean;
  onCellChange: (driverId: string, field: AdminCanonicalResultField, value: string) => void;
  onSave: () => void;
  registerInput?: (driverId: string, field: AdminCanonicalResultField, node: HTMLInputElement | null) => void;
};

export function EventResultsEditorPanel({
  event,
  grid,
  rows,
  invalidCellKeys,
  dirtyCellKeys = new Set<string>(),
  isSaving,
  onCellChange,
  onSave,
  registerInput,
}: EventResultsEditorPanelProps) {
  return (
    <>
      <h4 className="font-mono text-xs font-semibold tracking-wider text-racing-yellow uppercase">
        Resultados: {event.seasonYear} {event.championshipName} R{event.roundNumber} - {event.circuitName}
      </h4>
      <div className="mt-1 space-y-1 text-xs text-racing-white/55">
        <p>Race fields accept positive integers or DNF / DNQ / DSQ / ABSENT.</p>
        <p>Points accepts numbers &gt;= 0 with an optional single decimal using `.`.</p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[860px] table-fixed border-collapse text-xs">
          <colgroup>
            <col className="w-[220px]" />
            {grid.fieldOrder.map((field) => (
              <col key={field} className={field === "p" ? "w-[130px]" : "w-[120px]"} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
              <th className="px-2 py-2 text-left">Piloto</th>
              {grid.fieldOrder.map((field) => (
                <th key={field} className="px-2 py-2 text-center">
                  <span className="hidden md:inline">{getResultFieldLabel(field, grid.fieldLabels, false)}</span>
                  <span className="md:hidden">{getResultFieldLabel(field, grid.fieldLabels, true)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.driverId}
                className={`border-b border-racing-steel/10 align-top ${
                  index % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]"
                }`}
              >
                <td className="px-2 py-2">
                  <div className="font-medium text-racing-white">{row.driverName}</div>
                </td>
                {grid.fieldOrder.map((field) => {
                  const cellKey = createCellKey(row.driverId, field);
                  const isInvalid = invalidCellKeys.has(cellKey);
                  const isDirty = dirtyCellKeys.has(cellKey);

                  return (
                    <td key={field} className="px-2 py-2">
                      <label className="mb-1 block text-[11px] tracking-wider text-racing-white/45 uppercase md:hidden">
                        {getResultFieldLabel(field, grid.fieldLabels, true)}
                      </label>
                      <input
                        ref={(node) => registerInput?.(row.driverId, field, node)}
                        value={row.values[field]}
                        onChange={(eventInput) => onCellChange(row.driverId, field, eventInput.target.value)}
                        aria-invalid={isInvalid || undefined}
                        className={`h-9 w-full rounded-sm border px-2 py-1 text-center uppercase ${
                          isInvalid
                            ? "border-red-400 bg-red-950/30 text-red-100"
                            : isDirty
                              ? "border-racing-yellow/55 bg-racing-black text-racing-white"
                              : "border-racing-steel/40 bg-racing-black text-racing-white"
                        }`}
                        placeholder={field === "p" ? "0 / 18.5" : "1 / DNF"}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={onSave}
        className="mt-3 rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : "Guardar resultados"}
      </button>
    </>
  );
}

export function EventsManager({ events, championships, championshipFilterId = null }: Props) {
  const router = useRouter();
  const resultInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [state, setState] = useState<FormState>({ loading: false, error: null, success: null });
  const [eventDrafts, setEventDrafts] = useState<Record<string, EventDraft>>({});

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [gridLoadingEventId, setGridLoadingEventId] = useState<string | null>(null);
  const [grid, setGrid] = useState<AdminEventResultsGrid | null>(null);
  const [editableRows, setEditableRows] = useState<EditableResultRow[]>([]);

  useEffect(() => {
    const nextDrafts: Record<string, EventDraft> = {};
    for (const event of events) {
      nextDrafts[event.id] = toDraft(event);
    }
    setEventDrafts(nextDrafts);
  }, [events]);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }
    if (!events.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(null);
      setGrid(null);
      setEditableRows([]);
    }
  }, [events, selectedEventId]);

  const championshipMap = useMemo(() => {
    return new Map(championships.map((championship) => [championship.id, championship]));
  }, [championships]);

  const filteredChampionship = championshipFilterId
    ? championshipMap.get(championshipFilterId) ?? null
    : null;

  const invalidCellKeys = useMemo(() => {
    if (!grid) {
      return new Set<string>();
    }
    return getInvalidResultCellKeys(editableRows, grid.fieldOrder);
  }, [editableRows, grid]);

  const dirtyCellKeys = useMemo(() => {
    if (!grid) {
      return new Set<string>();
    }
    return getDirtyResultCellKeys(editableRows, grid.fieldOrder);
  }, [editableRows, grid]);

  function updateDraft(id: string, field: keyof EventDraft, value: string) {
    setEventDrafts((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] ?? {
          championshipId: "",
          roundNumber: "",
          circuitName: "",
          eventDate: "",
        }),
        [field]: value,
      },
    }));
  }

  function updateResultCell(driverId: string, field: AdminCanonicalResultField, value: string) {
    setEditableRows((previous) =>
      previous.map((row) =>
        row.driverId === driverId
          ? {
              ...row,
              values: {
                ...row.values,
                [field]: value,
              },
            }
          : row,
      ),
    );
  }

  async function refreshWithMessage(message: string, dryRun?: boolean) {
    setState({ loading: false, error: null, success: dryRun ? "Vista previa dry-run generada." : message });
    router.refresh();
  }

  async function createEvent(formData: FormData) {
    setState({ loading: true, error: null, success: null });

    const selectedChampionshipId = String(formData.get("championshipId") ?? "") || championshipFilterId || "";
    const payload = {
      championshipId: selectedChampionshipId,
      roundNumber: Number(formData.get("roundNumber") ?? 0),
      circuitName: String(formData.get("circuitName") ?? ""),
      eventDate: String(formData.get("eventDate") ?? "") || null,
      sourceSheet: "admin",
      sourceRow: 0,
    };

    try {
      const response = await fetch("/api/v1/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al crear.", success: null });
        return;
      }
      await refreshWithMessage("Evento creado.", json.dryRun);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function updateEvent(id: string) {
    const draft = eventDrafts[id];
    if (!draft) {
      return;
    }

    setState({ loading: true, error: null, success: null });

    const payload = {
      id,
      championshipId: draft.championshipId,
      roundNumber: Number(draft.roundNumber),
      circuitName: draft.circuitName,
      eventDate: draft.eventDate || null,
    };

    try {
      const response = await fetch("/api/v1/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al actualizar.", success: null });
        return;
      }
      await refreshWithMessage("Evento actualizado.", json.dryRun);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function toggleEvent(id: string, isActive: boolean) {
    setState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/v1/admin/events/${id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error en la acción.", success: null });
        return;
      }
      await refreshWithMessage("Estado del evento actualizado.", json.dryRun);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function loadGrid(eventId: string): Promise<void> {
    setSelectedEventId(eventId);
    setGridLoadingEventId(eventId);
    setState((previous) => ({ ...previous, error: null }));

    try {
      const response = await fetch(`/api/v1/admin/events/${eventId}/results`);
      const json = (await response.json()) as { ok?: boolean; error?: string; grid?: AdminEventResultsGrid };
      if (!response.ok || !json.ok || !json.grid) {
        setState({ loading: false, error: json.error ?? "No se pudo cargar resultados.", success: null });
        setGrid(null);
        setEditableRows([]);
        return;
      }

      setGrid(json.grid);
      setEditableRows(createEditableResultRows(json.grid));
    } catch {
      setState({ loading: false, error: "Error de red al cargar resultados.", success: null });
      setGrid(null);
      setEditableRows([]);
    } finally {
      setGridLoadingEventId(null);
    }
  }

  async function toggleResultsEditor(eventId: string) {
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
      setGrid(null);
      setEditableRows([]);
      return;
    }

    await loadGrid(eventId);
  }

  async function saveResults() {
    if (!selectedEventId || !grid) {
      return;
    }

    setState({ loading: true, error: null, success: null });

    if (invalidCellKeys.size > 0) {
      const firstInvalidCellKey = [...invalidCellKeys][0];
      resultInputRefs.current[firstInvalidCellKey]?.focus();
      setState({ loading: false, error: "Revisa los resultados marcados antes de guardar.", success: null });
      return;
    }

    let rows: EventResultCellInput[];

    try {
      rows = serializeDirtyResultCells(editableRows, grid.fieldOrder);
    } catch {
      setState({ loading: false, error: "No se pudieron preparar los cambios de resultados.", success: null });
      return;
    }

    if (rows.length === 0) {
      setState({ loading: false, error: null, success: "No hay cambios para guardar." });
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/events/${selectedEventId}/results`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "No se pudo guardar resultados.", success: null });
        return;
      }

      setState({
        loading: false,
        error: null,
        success: json.dryRun ? "Vista previa dry-run generada." : "Resultados del evento guardados.",
      });
      router.refresh();
      await loadGrid(selectedEventId);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">Nuevo evento</h3>
        <p className="mt-1 text-xs text-racing-white/60">
          Selecciona campeonato, ronda, circuito y fecha del evento.
        </p>
        {filteredChampionship ? (
          <p className="mt-1 text-xs text-racing-yellow/90">
            Filtro activo: {filteredChampionship.seasonYear} - {filteredChampionship.name}{" "}
            <Link href="/admin/events" className="text-racing-white/80 underline underline-offset-2">
              limpiar
            </Link>
          </p>
        ) : null}
        <form action={createEvent} className="mt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_120px_minmax(0,1fr)_170px_auto]">
            <label className="text-xs text-racing-white/65">
              <span className="mb-1 block uppercase tracking-wider">Campeonato</span>
              <select
                name="championshipId"
                defaultValue={filteredChampionship?.id ?? ""}
                className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
              >
                <option value="">Seleccionar campeonato</option>
                {championships.map((championship) => (
                  <option key={championship.id} value={championship.id}>
                    {championship.seasonYear} - {championship.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-racing-white/65">
              <span className="mb-1 block uppercase tracking-wider">Ronda</span>
              <input
                name="roundNumber"
                type="number"
                placeholder="1"
                className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-racing-white/65">
              <span className="mb-1 block uppercase tracking-wider">Circuito</span>
              <input
                name="circuitName"
                placeholder="Nombre del circuito"
                className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-racing-white/65">
              <span className="mb-1 block uppercase tracking-wider">Fecha</span>
              <input
                name="eventDate"
                type="date"
                className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={state.loading}
              className="h-9 self-end rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
            >
              {state.loading ? "Guardando..." : "Crear evento"}
            </button>
          </div>
        </form>
      </section>

      {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-green-300">{state.success}</p> : null}

      <section className="space-y-2 rounded-sm border border-racing-steel/25 bg-racing-carbon/45 p-3">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
          Eventos cargados
        </h3>

        <div className="overflow-auto">
          <table className="min-w-full table-fixed border-collapse text-xs">
            <colgroup>
              <col className="w-[280px]" />
              <col className="w-[80px]" />
              <col />
              <col className="w-[160px]" />
              <col className="w-[96px]" />
              <col className="w-[280px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
                <th className="px-2 py-2 text-left">Campeonato</th>
                <th className="px-2 py-2 text-left">Ronda</th>
                <th className="px-2 py-2 text-left">Circuito</th>
                <th className="px-2 py-2 text-left">Fecha</th>
                <th className="px-2 py-2 text-center">Estado</th>
                <th className="px-2 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => {
                const draft = eventDrafts[event.id] ?? toDraft(event);
                const isSelected = selectedEventId === event.id;
                const isLoadingGrid = gridLoadingEventId === event.id;

                return (
                  <Fragment key={event.id}>
                    <tr
                      className={`border-b border-racing-steel/10 align-middle ${
                        index % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <select
                          value={draft.championshipId}
                          onChange={(eventInput) => updateDraft(event.id, "championshipId", eventInput.target.value)}
                          className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                        >
                          {championships.map((championship) => (
                            <option key={championship.id} value={championship.id}>
                              {championship.seasonYear} - {championship.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={draft.roundNumber}
                          onChange={(eventInput) => updateDraft(event.id, "roundNumber", eventInput.target.value)}
                          className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          value={draft.circuitName}
                          onChange={(eventInput) => updateDraft(event.id, "circuitName", eventInput.target.value)}
                          className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={draft.eventDate}
                          onChange={(eventInput) => updateDraft(event.id, "eventDate", eventInput.target.value)}
                          className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                        />
                      </td>

                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex rounded-sm border border-racing-steel/30 px-2 py-1 text-[11px] uppercase text-racing-white/80">
                          {event.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void updateEvent(event.id)}
                            className="h-8 rounded-sm border border-racing-yellow/40 px-3 text-xs font-semibold text-racing-yellow uppercase"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleEvent(event.id, !event.isActive)}
                            className="h-8 rounded-sm border border-racing-white/30 px-3 text-xs font-semibold text-racing-white uppercase"
                          >
                            {event.isActive ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleResultsEditor(event.id)}
                            className="h-8 rounded-sm border border-racing-yellow/30 px-3 text-xs font-semibold text-racing-yellow uppercase"
                          >
                            {isSelected ? "Ocultar resultados" : "Editar resultados"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isSelected ? (
                      <tr className="border-b border-racing-steel/15 bg-racing-black/50">
                        <td colSpan={6} className="px-3 py-3">
                          {isLoadingGrid ? <p className="mt-2 text-xs text-racing-white/60">Cargando resultados...</p> : null}

                          {!isLoadingGrid && grid ? (
                            <EventResultsEditorPanel
                              event={event}
                              grid={grid}
                              rows={editableRows}
                              invalidCellKeys={invalidCellKeys}
                              dirtyCellKeys={dirtyCellKeys}
                              isSaving={state.loading}
                              onCellChange={updateResultCell}
                              onSave={() => {
                                void saveResults();
                              }}
                              registerInput={(driverId, field, node) => {
                                resultInputRefs.current[createCellKey(driverId, field)] = node;
                              }}
                            />
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
