"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  isEventCloseInNext24Hours,
  suggestLiveWindowForEventDate,
} from "@/app/admin/_components/events-live-suggestions";
import type {
  AdminEvent,
  AdminLiveBroadcastConfig,
  StreamOverrideMode,
} from "@/lib/server/admin/types";

type Props = {
  config: AdminLiveBroadcastConfig;
  events: AdminEvent[];
};

type FormState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

type Draft = {
  eventId: string;
  streamVideoId: string;
  streamStartAt: string;
  streamEndAt: string;
  streamOverrideMode: StreamOverrideMode;
};

type StreamSuggestion = {
  eventId: string;
  label: string;
  startAtArtLocal: string;
  endAtArtLocal: string;
};

const MAX_REFERENCE_CHAMPIONSHIPS = 3;

function RequiredMark() {
  return <span className="ml-1 text-red-300">*</span>;
}

function toArtDateTimeInputValue(iso: string | null): string {
  if (!iso) {
    return "";
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsed);

  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const year = byType.get("year");
  const month = byType.get("month");
  const day = byType.get("day");
  const hour = byType.get("hour");
  const minute = byType.get("minute");

  if (!year || !month || !day || !hour || !minute) {
    return "";
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toDraft(config: AdminLiveBroadcastConfig): Draft {
  return {
    eventId: config.eventId ?? "",
    streamVideoId: config.streamVideoId ? `https://www.youtube.com/watch?v=${config.streamVideoId}` : "",
    streamStartAt: toArtDateTimeInputValue(config.streamStartAt),
    streamEndAt: toArtDateTimeInputValue(config.streamEndAt),
    streamOverrideMode: config.streamOverrideMode,
  };
}

export function LiveBroadcastManager({ config, events }: Props) {
  const router = useRouter();

  const [state, setState] = useState<FormState>({ loading: false, error: null, success: null });
  const [draft, setDraft] = useState<Draft>(() => toDraft(config));

  useEffect(() => {
    setDraft(toDraft(config));
  }, [config]);

  const allChampionshipIds = useMemo(() => {
    const ids: string[] = [];
    for (const event of events) {
      if (!ids.includes(event.championshipId)) {
        ids.push(event.championshipId);
      }
    }
    return ids;
  }, [events]);

  const eventOptions = useMemo(() => {
    const sourceEvents = events.some((event) => event.isActive)
      ? events.filter((event) => event.isActive)
      : events;

    const sorted = [...sourceEvents].sort((left, right) => {
      if (left.seasonYear !== right.seasonYear) {
        return right.seasonYear - left.seasonYear;
      }
      if (left.roundNumber !== right.roundNumber) {
        return right.roundNumber - left.roundNumber;
      }
      return left.circuitName.localeCompare(right.circuitName);
    });

    const championshipOrder: string[] = [];
    for (const event of sorted) {
      if (!championshipOrder.includes(event.championshipId)) {
        championshipOrder.push(event.championshipId);
      }
    }

    const allowedChampionships = new Set(championshipOrder.slice(0, MAX_REFERENCE_CHAMPIONSHIPS));
    return sorted.filter((event) => allowedChampionships.has(event.championshipId));
  }, [events]);

  const streamSuggestions = useMemo<StreamSuggestion[]>(() => {
    const now = new Date();
    const collected: StreamSuggestion[] = [];

    for (const event of eventOptions) {
      if (!event.eventDate || !isEventCloseInNext24Hours(event.eventDate, now)) {
        continue;
      }

      const suggestion = suggestLiveWindowForEventDate(event.eventDate, now);
      if (!suggestion) {
        continue;
      }

      collected.push({
        eventId: event.id,
        label: `${event.seasonYear} ${event.championshipName} R${event.roundNumber} - ${event.circuitName}`,
        startAtArtLocal: suggestion.startAtArtLocal,
        endAtArtLocal: suggestion.endAtArtLocal,
      });
    }

    return collected.sort((left, right) => left.startAtArtLocal.localeCompare(right.startAtArtLocal));
  }, [eventOptions]);

  const nextSuggestion = streamSuggestions.at(0) ?? null;

  function applySuggestion(suggestion: StreamSuggestion) {
    setDraft((previous) => ({
      ...previous,
      eventId: suggestion.eventId,
      streamStartAt: suggestion.startAtArtLocal,
      streamEndAt: suggestion.endAtArtLocal,
      streamOverrideMode: "auto",
    }));
    setState((previous) => ({
      ...previous,
      error: null,
      success: "Sugerencia aplicada: horario LIVE autocompletado (ART).",
    }));
  }

  function clearDraft() {
    setDraft((previous) => ({
      ...previous,
      streamVideoId: "",
      streamStartAt: "",
      streamEndAt: "",
      streamOverrideMode: "auto",
    }));
    setState((previous) => ({
      ...previous,
      error: null,
      success: "Config LIVE limpiada en el formulario (recuerda guardar).",
    }));
  }

  async function saveConfig() {
    setState({ loading: true, error: null, success: null });

    const payload = {
      eventId: draft.eventId || null,
      streamVideoId: draft.streamVideoId || null,
      streamStartAt: draft.streamStartAt || null,
      streamEndAt: draft.streamEndAt || null,
      streamOverrideMode: draft.streamOverrideMode,
    };

    try {
      const response = await fetch("/api/v1/admin/live-broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "No se pudo guardar LIVE.", success: null });
        return;
      }

      setState({
        loading: false,
        error: null,
        success: json.dryRun ? "Vista previa dry-run generada." : "Config LIVE guardada.",
      });
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  return (
    <section className="rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4">
      <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">Live Stream</h3>
      <p className="mt-1 text-xs text-racing-white/60">
        Configuracion global de transmision para Home/Hero.
      </p>

      <div className="mt-4 grid gap-3">
        <label className="text-xs text-racing-white/65">
          <span className="mb-1 block uppercase tracking-wider">Evento de referencia</span>
          <select
            value={draft.eventId}
            onChange={(eventInput) => setDraft((previous) => ({ ...previous, eventId: eventInput.target.value }))}
            className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
          >
            <option value="">Sin evento asociado</option>
            {eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.seasonYear} {event.championshipName} R{event.roundNumber} - {event.circuitName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-racing-white/65">
          <span className="mb-1 block uppercase tracking-wider">YouTube URL / ID<RequiredMark /></span>
          <input
            value={draft.streamVideoId}
            onChange={(eventInput) => setDraft((previous) => ({ ...previous, streamVideoId: eventInput.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
            className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,220px)_minmax(0,180px)]">
        <label className="text-xs text-racing-white/65">
          <span className="mb-1 block uppercase tracking-wider">Inicio LIVE (ART)<RequiredMark /></span>
          <input
            value={draft.streamStartAt}
            onChange={(eventInput) => setDraft((previous) => ({ ...previous, streamStartAt: eventInput.target.value }))}
            type="datetime-local"
            className="h-9 w-full rounded-sm border border-racing-steel/45 bg-white px-3 py-2 text-sm text-black [color-scheme:light]"
          />
        </label>

        <label className="text-xs text-racing-white/65">
          <span className="mb-1 block uppercase tracking-wider">Fin LIVE (ART)<RequiredMark /></span>
          <input
            value={draft.streamEndAt}
            onChange={(eventInput) => setDraft((previous) => ({ ...previous, streamEndAt: eventInput.target.value }))}
            type="datetime-local"
            className="h-9 w-full rounded-sm border border-racing-steel/45 bg-white px-3 py-2 text-sm text-black [color-scheme:light]"
          />
        </label>

        <label className="text-xs text-racing-white/65">
          <span className="mb-1 block uppercase tracking-wider">Override<RequiredMark /></span>
          <select
            value={draft.streamOverrideMode}
            onChange={(eventInput) =>
              setDraft((previous) => ({
                ...previous,
                streamOverrideMode: eventInput.target.value as StreamOverrideMode,
              }))}
            className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
          >
            <option value="auto">auto</option>
            <option value="force_on">force_on</option>
            <option value="force_off">force_off</option>
          </select>
        </label>
      </div>

      <p className="mt-2 text-[11px] text-racing-white/50">
        Campos con *: requeridos para publicar LIVE en modo auto. Los horarios se cargan en ART (UTC-03:00) y se guardan en UTC automaticamente.
      </p>

      <div className="mt-2 rounded-sm border border-racing-steel/25 bg-racing-black/35 p-2 text-[11px] text-racing-white/65">
        <p className="font-semibold text-racing-white/75 uppercase">Como funciona override</p>
        <p className="mt-1"><span className="text-racing-yellow">auto</span>: muestra en Home desde 30 minutos antes del inicio hasta el fin.</p>
        <p className="mt-1"><span className="text-racing-yellow">force_on</span>: fuerza visible siempre (si hay video).</p>
        <p className="mt-1"><span className="text-racing-yellow">force_off</span>: oculta siempre aunque haya horario.</p>
      </div>

      {allChampionshipIds.length > MAX_REFERENCE_CHAMPIONSHIPS ? (
        <p className="mt-2 text-[11px] text-racing-white/50">
          Evento de referencia: se muestran los eventos de los ultimos {MAX_REFERENCE_CHAMPIONSHIPS} campeonatos detectados.
        </p>
      ) : null}

      {nextSuggestion ? (
        <div className="mt-3 rounded-sm border border-racing-yellow/35 bg-racing-yellow/10 px-3 py-2 text-xs text-racing-yellow/95">
          <p className="font-semibold uppercase tracking-wider">Sugerencia automatica (proximas 24h)</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-racing-white/75">Evento cercano: {nextSuggestion.label}</p>
            <button
              type="button"
              onClick={() => applySuggestion(nextSuggestion)}
              className="rounded-sm border border-racing-yellow/45 px-2 py-1 text-[11px] font-semibold tracking-wider text-racing-yellow uppercase transition-colors hover:bg-racing-yellow/15"
            >
              Usar sugerencia
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={state.loading}
          onClick={() => void saveConfig()}
          className="h-9 rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
        >
          {state.loading ? "Guardando..." : "Guardar Live Stream"}
        </button>
        <button
          type="button"
          disabled={state.loading}
          onClick={clearDraft}
          className="h-9 rounded-sm border border-racing-white/30 px-4 py-2 text-xs font-semibold tracking-wider text-racing-white uppercase disabled:opacity-60"
        >
          Limpiar formulario
        </button>
      </div>

      {state.error ? <p className="mt-2 text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="mt-2 text-xs text-green-300">{state.success}</p> : null}

    </section>
  );
}

