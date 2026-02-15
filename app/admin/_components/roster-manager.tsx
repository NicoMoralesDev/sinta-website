"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import type { AdminDriver, AdminDriverAlias } from "@/lib/server/admin/types";

type Props = {
  drivers: AdminDriver[];
};

type FormState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

const COUNTRY_OPTIONS = [
  { code: "ar", label: "Argentina" },
  { code: "bo", label: "Bolivia" },
  { code: "br", label: "Brasil" },
  { code: "cl", label: "Chile" },
  { code: "co", label: "Colombia" },
  { code: "cr", label: "Costa Rica" },
  { code: "ec", label: "Ecuador" },
  { code: "gy", label: "Guyana" },
  { code: "mx", label: "México" },
  { code: "pe", label: "Perú" },
  { code: "py", label: "Paraguay" },
  { code: "sr", label: "Surinam" },
  { code: "uy", label: "Uruguay" },
  { code: "ve", label: "Venezuela" },
] as const;

export function RosterManager({ drivers }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ loading: false, error: null, success: null });

  const [aliasEditorDriverId, setAliasEditorDriverId] = useState<string | null>(null);
  const [aliases, setAliases] = useState<AdminDriverAlias[]>([]);
  const [aliasesLoading, setAliasesLoading] = useState(false);

  async function refreshMessage(message: string, dryRun?: boolean) {
    setState({ loading: false, error: null, success: dryRun ? "Vista previa dry-run generada." : message });
    router.refresh();
  }

  async function createDriver(formData: FormData) {
    setState({ loading: true, error: null, success: null });

    const firstNames = String(formData.get("firstNames") ?? "").trim();
    const lastNames = String(formData.get("lastNames") ?? "").trim();
    const canonicalName = `${firstNames} ${lastNames}`.trim().replace(/\s+/g, " ");

    if (!firstNames || !lastNames || !canonicalName) {
      setState({ loading: false, error: "Debes completar nombres y apellidos.", success: null });
      return;
    }

    const payload = {
      canonicalName,
      countryCode: String(formData.get("countryCode") ?? ""),
    };

    try {
      const response = await fetch("/api/v1/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al crear.", success: null });
        return;
      }
      await refreshMessage("Piloto creado.", json.dryRun);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function updateDriver(id: string, formData: FormData) {
    setState({ loading: true, error: null, success: null });
    const payload = {
      id,
      canonicalName: String(formData.get(`canonicalName-${id}`) ?? ""),
      countryCode: String(formData.get(`countryCode-${id}`) ?? ""),
    };

    try {
      const response = await fetch("/api/v1/admin/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al actualizar.", success: null });
        return;
      }
      await refreshMessage("Piloto actualizado.", json.dryRun);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function toggleDriver(id: string, isActive: boolean) {
    setState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/v1/admin/drivers/${id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error en la acción.", success: null });
        return;
      }
      await refreshMessage("Estado del piloto actualizado.", json.dryRun);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function loadAliases(driverId: string) {
    setAliasesLoading(true);

    try {
      const response = await fetch(`/api/v1/admin/drivers/${driverId}/aliases`);
      const json = (await response.json()) as { ok?: boolean; error?: string; aliases?: AdminDriverAlias[] };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "No se pudieron cargar aliases.", success: null });
        setAliases([]);
        return;
      }
      setAliases(json.aliases ?? []);
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
      setAliases([]);
    } finally {
      setAliasesLoading(false);
    }
  }

  async function toggleAliasEditor(driverId: string) {
    if (aliasEditorDriverId === driverId) {
      setAliasEditorDriverId(null);
      setAliases([]);
      return;
    }

    setAliasEditorDriverId(driverId);
    await loadAliases(driverId);
  }

  async function addAlias(formData: FormData) {
    if (!aliasEditorDriverId) {
      return;
    }

    setState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/v1/admin/drivers/${aliasEditorDriverId}/aliases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliasOriginal: String(formData.get("aliasOriginal") ?? "") }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al crear alias.", success: null });
        return;
      }
      setState({ loading: false, error: null, success: json.dryRun ? "Vista previa dry-run generada." : "Alias agregado." });
      await loadAliases(aliasEditorDriverId);
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  async function removeAlias(aliasId: string) {
    if (!aliasEditorDriverId) {
      return;
    }

    setState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/v1/admin/aliases/${aliasId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al borrar alias.", success: null });
        return;
      }
      setState({ loading: false, error: null, success: json.dryRun ? "Vista previa dry-run generada." : "Alias eliminado." });
      await loadAliases(aliasEditorDriverId);
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">Nuevo piloto</h3>
        <p className="mt-1 text-xs text-racing-white/60">
          Ingresa nombres, apellidos y país. Slug, orden y rol se generan automáticamente.
        </p>
        <form action={createDriver} className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_auto]">
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Nombres</span>
            <input
              name="firstNames"
              placeholder="Nombres"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Apellidos</span>
            <input
              name="lastNames"
              placeholder="Apellidos"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">País</span>
            <select
              name="countryCode"
              defaultValue="ar"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={state.loading}
            className="h-9 self-end rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
          >
            {state.loading ? "Guardando..." : "Crear piloto"}
          </button>
        </form>
      </section>

      {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-green-300">{state.success}</p> : null}

      <section className="space-y-2 rounded-sm border border-racing-steel/25 bg-racing-carbon/45 p-3">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
          Pilotos cargados
        </h3>

        <div className="overflow-auto">
          <table className="min-w-full table-fixed border-collapse text-xs">
            <colgroup>
              <col />
              <col className="w-[190px]" />
              <col className="w-[140px]" />
              <col className="w-[96px]" />
              <col className="w-[290px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
                <th className="px-2 py-2 text-left">Piloto</th>
                <th className="px-2 py-2 text-left">País</th>
                <th className="px-2 py-2 text-left">Rol</th>
                <th className="px-2 py-2 text-center">Estado</th>
                <th className="px-2 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, index) => {
                const isAliasOpen = aliasEditorDriverId === driver.id;

                return (
                  <Fragment key={driver.id}>
                    <tr
                      className={`border-b border-racing-steel/10 align-middle ${
                        index % 2 === 0 ? "bg-racing-carbon/70" : "bg-racing-black/75"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <form action={(formData) => updateDriver(driver.id, formData)} id={`update-driver-${driver.id}`} className="space-y-1">
                          <input
                            name={`canonicalName-${driver.id}`}
                            defaultValue={driver.canonicalName}
                            className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                          />
                          <p className="text-[11px] text-racing-white/45">slug: {driver.slug}</p>
                        </form>
                      </td>

                      <td className="px-2 py-2">
                        <select
                          form={`update-driver-${driver.id}`}
                          name={`countryCode-${driver.id}`}
                          defaultValue={driver.countryCode}
                          className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                        >
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-2 text-racing-white/75">
                        {driver.roleEs} / {driver.roleEn}
                      </td>

                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex rounded-sm border border-racing-steel/30 px-2 py-1 text-[11px] uppercase text-racing-white/80">
                          {driver.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="submit"
                            form={`update-driver-${driver.id}`}
                            className="h-8 rounded-sm border border-racing-yellow/40 px-3 text-xs font-semibold text-racing-yellow uppercase"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleDriver(driver.id, !driver.isActive)}
                            className="h-8 rounded-sm border border-racing-white/30 px-3 text-xs font-semibold text-racing-white uppercase"
                          >
                            {driver.isActive ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleAliasEditor(driver.id)}
                            className="h-8 rounded-sm border border-racing-yellow/30 px-3 text-xs font-semibold text-racing-yellow uppercase"
                          >
                            {isAliasOpen ? "Ocultar aliases" : "Editar aliases"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isAliasOpen ? (
                      <tr className="border-b border-racing-steel/15 bg-racing-black/50">
                        <td colSpan={5} className="px-3 py-3">
                          <h4 className="font-mono text-xs font-semibold tracking-wider text-racing-yellow uppercase">
                            Aliases de {driver.canonicalName}
                          </h4>

                          <form action={addAlias} className="mt-2 flex flex-wrap items-end gap-2">
                            <label className="text-xs text-racing-white/65">
                              <span className="mb-1 block uppercase tracking-wider">Nuevo alias</span>
                              <input
                                name="aliasOriginal"
                                placeholder="Alias"
                                className="h-9 min-w-[240px] rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={state.loading}
                              className="h-9 rounded-sm bg-racing-yellow px-3 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
                            >
                              Agregar alias
                            </button>
                          </form>

                          {aliasesLoading ? <p className="mt-2 text-xs text-racing-white/60">Cargando aliases...</p> : null}

                          {!aliasesLoading ? (
                            <ul className="mt-3 space-y-1 text-xs">
                              {aliases.map((alias) => (
                                <li key={alias.id} className="flex items-center justify-between rounded-sm border border-racing-steel/20 bg-racing-black/35 px-3 py-2">
                                  <span>
                                    {alias.aliasOriginal} <span className="text-racing-white/45">({alias.aliasNormalized})</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void removeAlias(alias.id)}
                                    className="rounded-sm border border-racing-white/30 px-2 py-1 font-semibold text-racing-white uppercase"
                                  >
                                    Borrar
                                  </button>
                                </li>
                              ))}
                              {aliases.length === 0 ? (
                                <li className="rounded-sm border border-racing-steel/20 bg-racing-black/35 px-3 py-2 text-racing-white/60">
                                  Sin aliases cargados.
                                </li>
                              ) : null}
                            </ul>
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
