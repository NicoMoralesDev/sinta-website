"use client";

import { useState, type FormEvent } from "react";

type State = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

export function RevertForm() {
  const [state, setState] = useState<State>({ loading: false, error: null, success: null });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const entityType = String(formData.get("entityType") ?? "");
    const entityId = String(formData.get("entityId") ?? "");
    const targetAuditIdRaw = String(formData.get("targetAuditId") ?? "").trim();

    setState({ loading: true, error: null, success: null });

    try {
      const response = await fetch("/api/v1/admin/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          targetAuditId: targetAuditIdRaw || undefined,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        result?: { dryRun?: boolean; restoredFromAuditId?: string };
      };

      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al revertir.", success: null });
        return;
      }

      const suffix = json.result?.restoredFromAuditId
        ? ` Restaurado desde audit ${json.result.restoredFromAuditId}.`
        : "";

      setState({
        loading: false,
        error: null,
        success: json.result?.dryRun
          ? "Vista previa dry-run generada." + suffix
          : "Reversion aplicada." + suffix,
      });
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4 md:grid-cols-4">
      <select name="entityType" defaultValue="event" className="rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs">
        <option value="championship">championship</option>
        <option value="event">event</option>
        <option value="driver">driver</option>
        <option value="event_results">event_results</option>
      </select>
      <input name="entityId" placeholder="UUID de entidad" className="rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs" />
      <input name="targetAuditId" placeholder="UUID audit objetivo (owner opcional)" className="rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs" />
      <button type="submit" disabled={state.loading} className="rounded-sm bg-racing-yellow px-3 py-1.5 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60">
        {state.loading ? "Aplicando..." : "Revertir"}
      </button>

      {state.error ? <p className="md:col-span-4 text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="md:col-span-4 text-xs text-green-300">{state.success}</p> : null}
    </form>
  );
}
