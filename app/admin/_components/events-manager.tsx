"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

import type { AdminChampionship, AdminEvent, AdminEventResultsGrid } from "@/lib/server/admin/types";

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

type EditableGridRow = {
  driverId: string;
  driverName: string;
  primaryValue: string;
  secondaryValue: string;
};

type EventDraft = {
  championshipId: string;
  roundNumber: string;
  circuitName: string;
  eventDate: string;
};

function cellToValue(cell: { position: number | null; status: string | null; rawValue: string } | null): string {
  if (!cell) {
    return "";
  }
  if (cell.position !== null) {
    return String(cell.position);
  }
  if (cell.status) {
    return cell.status;
  }
  return cell.rawValue;
}

function toDraft(event: AdminEvent): EventDraft {
  return {
    championshipId: event.championshipId,
    roundNumber: String(event.roundNumber),
    circuitName: event.circuitName,
    eventDate: event.eventDate ?? "",
  };
}

function parseCellInput(value: string):
  | { position: number; status: null; rawValue: string }
  | { position: null; status: "DNF" | "DNQ" | "DSQ" | "ABSENT"; rawValue: string }
  | null {
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    const position = Number.parseInt(normalized, 10);
    if (!Number.isFinite(position) || position <= 0) {
      return null;
    }

    return {
      position,
      status: null,
      rawValue: normalized,
    };
  }

  if (normalized === "DNF" || normalized === "DNQ" || normalized === "DSQ" || normalized === "ABSENT") {
    return {
      position: null,
      status: normalized,
      rawValue: normalized,
    };
  }

  return null;
}

export function EventsManager({ events, championships, championshipFilterId = null }: Props) {
  const router = useRouter();

  const [state, setState] = useState<FormState>({ loading: false, error: null, success: null });
  const [eventDrafts, setEventDrafts] = useState<Record<string, EventDraft>>({});

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [gridLoadingEventId, setGridLoadingEventId] = useState<string | null>(null);
  const [grid, setGrid] = useState<AdminEventResultsGrid | null>(null);
  const [editableRows, setEditableRows] = useState<EditableGridRow[]>([]);

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

  function getSessionLabelsForEvent(eventId: string | null): { primary: string; secondary: string } {
    if (!eventId) {
      return { primary: "Sprint", secondary: "Final" };
    }
    const event = events.find((entry) => entry.id === eventId);
    if (!event) {
      return { primary: "Sprint", secondary: "Final" };
    }
    const championship = championshipMap.get(event.championshipId);
    return {
      primary: championship?.primarySessionLabel || "Sprint",
      secondary: championship?.secondarySessionLabel || "Final",
    };
  }

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

  async function loadGrid(eventId: string) {
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
      setEditableRows(
        json.grid.drivers.map((driver) => ({
          driverId: driver.driverId,
          driverName: driver.driverName,
          primaryValue: cellToValue(driver.primary),
          secondaryValue: cellToValue(driver.secondary),
        })),
      );
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
    if (!selectedEventId) {
      return;
    }

    setState({ loading: true, error: null, success: null });

    const rows: Array<{
      driverId: string;
      sessionKind: "primary" | "secondary";
      position: number | null;
      status: "DNF" | "DNQ" | "DSQ" | "ABSENT" | null;
      rawValue: string;
      isActive: boolean;
    }> = [];

    const labels = getSessionLabelsForEvent(selectedEventId);

    for (const row of editableRows) {
      const primary = parseCellInput(row.primaryValue);
      if (row.primaryValue.trim() && !primary) {
        setState({ loading: false, error: `Valor inválido para ${row.driverName} en ${labels.primary}.`, success: null });
        return;
      }
      if (primary) {
        rows.push({
          driverId: row.driverId,
          sessionKind: "primary",
          position: primary.position,
          status: primary.status,
          rawValue: primary.rawValue,
          isActive: true,
        });
      }

      const secondary = parseCellInput(row.secondaryValue);
      if (row.secondaryValue.trim() && !secondary) {
        setState({ loading: false, error: `Valor inválido para ${row.driverName} en ${labels.secondary}.`, success: null });
        return;
      }
      if (secondary) {
        rows.push({
          driverId: row.driverId,
          sessionKind: "secondary",
          position: secondary.position,
          status: secondary.status,
          rawValue: secondary.rawValue,
          isActive: true,
        });
      }
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
          Selecciona campeonato, ronda, circuito y fecha opcional.
        </p>
        {filteredChampionship ? (
          <p className="mt-1 text-xs text-racing-yellow/90">
            Filtro activo: {filteredChampionship.seasonYear} - {filteredChampionship.name}{" "}
            <Link href="/admin/events" className="underline underline-offset-2 text-racing-white/80">
              limpiar
            </Link>
          </p>
        ) : null}
        <form action={createEvent} className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_120px_minmax(0,1fr)_170px_auto]">
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
            <span className="mb-1 block uppercase tracking-wider">Fecha (opcional)</span>
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
                const sessionLabels = getSessionLabelsForEvent(event.id);
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
                          <h4 className="font-mono text-xs font-semibold tracking-wider text-racing-yellow uppercase">
                            Resultados: {event.seasonYear} {event.championshipName} R{event.roundNumber} - {event.circuitName}
                          </h4>
                          <p className="mt-1 text-xs text-racing-white/55">
                            Ingresa posiciones numéricas o estados: DNF, DNQ, DSQ, ABSENT.
                          </p>
                          <p className="mt-1 text-xs text-racing-white/45">
                            Modelo actual: 2 sesiones por evento ({sessionLabels.primary} y {sessionLabels.secondary}).
                          </p>

                          {isLoadingGrid ? <p className="mt-2 text-xs text-racing-white/60">Cargando resultados...</p> : null}

                          {!isLoadingGrid && grid ? (
                            <>
                              <div className="mt-2 overflow-auto">
                                <table className="min-w-full table-fixed border-collapse text-xs">
                                  <colgroup>
                                    <col />
                                    <col className="w-[170px]" />
                                    <col className="w-[170px]" />
                                  </colgroup>
                                  <thead>
                                    <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
                                      <th className="px-2 py-2 text-left">Piloto</th>
                                      <th className="px-2 py-2 text-center">Posición {sessionLabels.primary}</th>
                                      <th className="px-2 py-2 text-center">Posición {sessionLabels.secondary}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {editableRows.map((row, index) => (
                                      <tr
                                        key={row.driverId}
                                        className={`border-b border-racing-steel/10 align-middle ${
                                          index % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]"
                                        }`}
                                      >
                                        <td className="px-2 py-2">{row.driverName}</td>
                                        <td className="px-2 py-2">
                                          <input
                                            value={row.primaryValue}
                                            onChange={(eventInput) => {
                                              const next = [...editableRows];
                                              next[index] = { ...row, primaryValue: eventInput.target.value };
                                              setEditableRows(next);
                                            }}
                                            className="h-8 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1 text-center"
                                            placeholder="1 / DNF"
                                          />
                                        </td>
                                        <td className="px-2 py-2">
                                          <input
                                            value={row.secondaryValue}
                                            onChange={(eventInput) => {
                                              const next = [...editableRows];
                                              next[index] = { ...row, secondaryValue: eventInput.target.value };
                                              setEditableRows(next);
                                            }}
                                            className="h-8 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1 text-center"
                                            placeholder="1 / DNF"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <button
                                type="button"
                                disabled={state.loading}
                                onClick={() => void saveResults()}
                                className="mt-3 rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
                              >
                                {state.loading ? "Guardando..." : "Guardar resultados"}
                              </button>
                            </>
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
