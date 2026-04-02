"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { AdminChampionship } from "@/lib/server/admin/types";

type Props = {
  championships: AdminChampionship[];
};

type FormState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

type ChampionshipDraft = {
  seasonYear: string;
  name: string;
  organizerName: string;
  primarySessionLabel: string;
  secondarySessionLabel: string;
};

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function buildCreateChampionshipPayload(formData: FormData) {
  return {
    seasonYear: Number(formData.get("seasonYear") ?? 0),
    name: String(formData.get("name") ?? ""),
    organizerName: normalizeOptionalText(String(formData.get("organizerName") ?? "")),
    primarySessionLabel: String(formData.get("primarySessionLabel") ?? "Sprint"),
    secondarySessionLabel: String(formData.get("secondarySessionLabel") ?? "Final"),
  };
}

export function buildUpdateChampionshipPayload(id: string, draft: ChampionshipDraft) {
  return {
    id,
    seasonYear: Number(draft.seasonYear),
    name: draft.name,
    organizerName: normalizeOptionalText(draft.organizerName),
    primarySessionLabel: draft.primarySessionLabel,
    secondarySessionLabel: draft.secondarySessionLabel,
  };
}

function toDraft(championship: AdminChampionship): ChampionshipDraft {
  return {
    seasonYear: String(championship.seasonYear),
    name: championship.name,
    organizerName: championship.organizerName ?? "",
    primarySessionLabel: championship.primarySessionLabel,
    secondarySessionLabel: championship.secondarySessionLabel,
  };
}

export function ChampionshipsManager({ championships }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ loading: false, error: null, success: null });
  const [drafts, setDrafts] = useState<Record<string, Partial<ChampionshipDraft>>>({});
  const baseDrafts = useMemo(() => {
    const next: Record<string, ChampionshipDraft> = {};
    for (const championship of championships) {
      next[championship.id] = toDraft(championship);
    }
    return next;
  }, [championships]);

  function updateDraft(id: string, field: keyof ChampionshipDraft, value: string) {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] ?? {}),
        [field]: value,
      },
    }));
  }

  async function createChampionship(formData: FormData) {
    const payload = buildCreateChampionshipPayload(formData);

    setState({ loading: true, error: null, success: null });
    try {
      const response = await fetch("/api/v1/admin/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !responsePayload.ok) {
        setState({ loading: false, error: responsePayload.error ?? "Error al crear.", success: null });
        return;
      }
      setState({
        loading: false,
        error: null,
        success: responsePayload.dryRun ? "Vista previa dry-run generada." : "Campeonato creado.",
      });
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function updateChampionship(id: string) {
    const draft = {
      ...(baseDrafts[id] ?? {
        seasonYear: "",
        name: "",
        organizerName: "",
        primarySessionLabel: "Sprint",
        secondarySessionLabel: "Final",
      }),
      ...(drafts[id] ?? {}),
    };
    if (!draft) {
      return;
    }

    setState({ loading: true, error: null, success: null });
    try {
      const response = await fetch("/api/v1/admin/championships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildUpdateChampionshipPayload(id, draft)),
      });
      const responsePayload = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !responsePayload.ok) {
        setState({ loading: false, error: responsePayload.error ?? "Error al actualizar.", success: null });
        return;
      }
      setState({
        loading: false,
        error: null,
        success: responsePayload.dryRun ? "Vista previa dry-run generada." : "Campeonato actualizado.",
      });
      setDrafts({});
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setState({ loading: true, error: null, success: null });
    try {
      const response = await fetch(`/api/v1/admin/championships/${id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const responsePayload = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !responsePayload.ok) {
        setState({ loading: false, error: responsePayload.error ?? "Error en la acción.", success: null });
        return;
      }
      setState({
        loading: false,
        error: null,
        success: responsePayload.dryRun ? "Vista previa dry-run generada." : "Estado actualizado.",
      });
      setDrafts({});
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">Nuevo campeonato</h3>
        <p className="mt-1 text-xs text-racing-white/60">
          Completa temporada, nombre, organizador y sesiones. El slug se genera automáticamente.
        </p>
        <p className="mt-1 text-xs text-racing-white/45">Modelo actual: cada evento soporta dos sesiones (Sprint y Final).</p>
        <form
          className="mt-3 grid gap-3 md:grid-cols-[120px_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]"
          action={createChampionship}
        >
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Temporada</span>
            <input
              name="seasonYear"
              type="number"
              placeholder="2026"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Nombre</span>
            <input
              name="name"
              placeholder="Nombre del campeonato"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Organizador</span>
            <input
              name="organizerName"
              placeholder="Organizador"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Sesión Sprint</span>
            <input
              name="primarySessionLabel"
              defaultValue="Sprint"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Sesión Final</span>
            <input
              name="secondarySessionLabel"
              defaultValue="Final"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={state.loading}
            className="h-9 self-end rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
          >
            {state.loading ? "Guardando..." : "Crear campeonato"}
          </button>
        </form>
      </section>

      {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-green-300">{state.success}</p> : null}

      <section className="space-y-3 rounded-sm border border-racing-steel/25 bg-racing-carbon/45 p-3">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
          Campeonatos cargados
        </h3>

        <div className="overflow-auto">
          <table className="min-w-full table-fixed border-collapse text-xs">
            <colgroup>
              <col className="w-[92px]" />
              <col className="w-[220px]" />
              <col className="w-[180px]" />
              <col className="w-[150px]" />
              <col className="w-[150px]" />
              <col className="w-[96px]" />
              <col className="w-[250px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
                <th className="px-2 py-2 text-left">Temporada</th>
                <th className="px-2 py-2 text-left">Nombre</th>
                <th className="px-2 py-2 text-left">Organizador</th>
                <th className="px-2 py-2 text-left">Sprint</th>
                <th className="px-2 py-2 text-left">Final</th>
                <th className="px-2 py-2 text-center">Estado</th>
                <th className="px-2 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {championships.map((championship, index) => {
                const draft = {
                  ...toDraft(championship),
                  ...(drafts[championship.id] ?? {}),
                };
                return (
                  <tr
                    key={championship.id}
                    className={`border-b border-racing-steel/10 align-middle ${
                      index % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]"
                    }`}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={draft.seasonYear}
                        onChange={(event) => updateDraft(championship.id, "seasonYear", event.target.value)}
                        className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={draft.name}
                        onChange={(event) => updateDraft(championship.id, "name", event.target.value)}
                        className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        aria-label={`Organizador ${championship.name}`}
                        value={draft.organizerName}
                        onChange={(event) => updateDraft(championship.id, "organizerName", event.target.value)}
                        placeholder="Organizador"
                        className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={draft.primarySessionLabel}
                        onChange={(event) => updateDraft(championship.id, "primarySessionLabel", event.target.value)}
                        className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={draft.secondarySessionLabel}
                        onChange={(event) => updateDraft(championship.id, "secondarySessionLabel", event.target.value)}
                        className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="inline-flex rounded-sm border border-racing-steel/30 px-2 py-1 text-[11px] uppercase text-racing-white/80">
                        {championship.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void updateChampionship(championship.id)}
                          className="h-8 rounded-sm border border-racing-yellow/40 px-3 text-xs font-semibold text-racing-yellow uppercase"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleActive(championship.id, !championship.isActive)}
                          className="h-8 rounded-sm border border-racing-white/30 px-3 text-xs font-semibold text-racing-white uppercase"
                        >
                          {championship.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <Link
                          href={`/admin/events?championshipId=${championship.id}`}
                          className="inline-flex h-8 items-center rounded-sm border border-racing-yellow/30 px-3 text-xs font-semibold text-racing-yellow uppercase"
                        >
                          Cargar eventos
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
