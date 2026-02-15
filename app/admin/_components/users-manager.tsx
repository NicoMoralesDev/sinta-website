"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { AdminUser } from "@/lib/server/admin/types";

type Props = {
  users: AdminUser[];
  actorUserId: string;
};

type FormState = {
  loading: boolean;
  error: string | null;
  success: string | null;
  temporaryPassword: string | null;
};

type UserDraft = {
  role: "owner" | "editor";
  isActive: boolean;
};

export function UsersManager({ users, actorUserId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({
    loading: false,
    error: null,
    success: null,
    temporaryPassword: null,
  });
  const [drafts, setDrafts] = useState<Record<string, Partial<UserDraft>>>({});
  const baseDrafts = useMemo(() => {
    const next: Record<string, UserDraft> = {};
    for (const user of users) {
      next[user.id] = {
        role: user.role,
        isActive: user.isActive,
      };
    }
    return next;
  }, [users]);

  function updateDraft(id: string, patch: Partial<UserDraft>) {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        role: previous[id]?.role ?? baseDrafts[id]?.role ?? "editor",
        isActive: previous[id]?.isActive ?? baseDrafts[id]?.isActive ?? true,
        ...patch,
      },
    }));
  }

  async function createUser(formData: FormData) {
    setState({ loading: true, error: null, success: null, temporaryPassword: null });
    const payload = {
      username: String(formData.get("username") ?? ""),
      role: String(formData.get("role") ?? "editor"),
    };

    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        dryRun?: boolean;
        data?: { temporaryPassword?: string };
      };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al crear.", success: null, temporaryPassword: null });
        return;
      }
      setState({
        loading: false,
        error: null,
        success: json.dryRun ? "Vista previa dry-run generada." : "Usuario creado.",
        temporaryPassword: json.data?.temporaryPassword ?? null,
      });
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null, temporaryPassword: null });
    }
  }

  async function updateUser(id: string) {
    const draft = {
      ...(baseDrafts[id] ?? { role: "editor" as const, isActive: true }),
      ...(drafts[id] ?? {}),
    };
    if (!draft) {
      return;
    }

    setState({ loading: true, error: null, success: null, temporaryPassword: null });
    const payload = {
      role: draft.role,
      isActive: draft.isActive,
    };

    try {
      const response = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; dryRun?: boolean };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al actualizar.", success: null, temporaryPassword: null });
        return;
      }
      setState({
        loading: false,
        error: null,
        success: json.dryRun ? "Vista previa dry-run generada." : "Usuario actualizado.",
        temporaryPassword: null,
      });
      setDrafts({});
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null, temporaryPassword: null });
    }
  }

  async function resetPassword(id: string) {
    setState({ loading: true, error: null, success: null, temporaryPassword: null });

    try {
      const response = await fetch(`/api/v1/admin/users/${id}/reset-password`, {
        method: "POST",
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        dryRun?: boolean;
        data?: { temporaryPassword?: string };
      };
      if (!response.ok || !json.ok) {
        setState({ loading: false, error: json.error ?? "Error al resetear.", success: null, temporaryPassword: null });
        return;
      }
      setState({
        loading: false,
        error: null,
        success: json.dryRun ? "Vista previa dry-run generada." : "Contraseña reseteada.",
        temporaryPassword: json.data?.temporaryPassword ?? null,
      });
      setDrafts({});
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null, temporaryPassword: null });
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
          Nuevo usuario del panel
        </h3>
        <p className="mt-1 text-xs text-racing-white/60">
          Se crea por nombre de usuario (no email). La contraseña temporal se muestra una sola vez.
        </p>
        <form action={createUser} className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Usuario</span>
            <input
              name="username"
              placeholder="Nombre de usuario"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-racing-white/65">
            <span className="mb-1 block uppercase tracking-wider">Rol</span>
            <select
              name="role"
              defaultValue="editor"
              className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm"
            >
              <option value="owner">Owner</option>
              <option value="editor">Editor</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={state.loading}
            className="h-9 self-end rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
          >
            {state.loading ? "Guardando..." : "Crear usuario"}
          </button>
        </form>
      </section>

      {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-green-300">{state.success}</p> : null}
      {state.temporaryPassword ? (
        <p className="rounded-sm border border-racing-yellow/30 bg-racing-yellow/10 px-3 py-2 text-xs text-racing-yellow">
          Contraseña temporal: <span className="font-mono">{state.temporaryPassword}</span>
        </p>
      ) : null}

      <section className="space-y-2 rounded-sm border border-racing-steel/25 bg-racing-carbon/45 p-3">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
          Usuarios existentes
        </h3>

        <div className="overflow-auto">
          <table className="min-w-full table-fixed border-collapse text-xs">
            <colgroup>
              <col />
              <col className="w-[120px]" />
              <col className="w-[96px]" />
              <col className="w-[190px]" />
              <col className="w-[220px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
                <th className="px-2 py-2 text-left">Usuario</th>
                <th className="px-2 py-2 text-left">Rol</th>
                <th className="px-2 py-2 text-center">Activo</th>
                <th className="px-2 py-2 text-left">Contraseña</th>
                <th className="px-2 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const draft = {
                  ...(baseDrafts[user.id] ?? { role: user.role, isActive: user.isActive }),
                  ...(drafts[user.id] ?? {}),
                };
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-racing-steel/10 align-middle ${
                      index % 2 === 0 ? "bg-racing-carbon/70" : "bg-racing-black/75"
                    }`}
                  >
                    <td className="px-2 py-2">
                      <p className="text-racing-white">{user.username}</p>
                      <p className="text-racing-white/45">
                        último acceso: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "nunca"}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={draft.role}
                        onChange={(eventInput) => updateDraft(user.id, { role: eventInput.target.value as "owner" | "editor" })}
                        className="h-9 w-full rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs"
                      >
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <label className="inline-flex items-center gap-2 rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(eventInput) => updateDraft(user.id, { isActive: eventInput.target.checked })}
                        />
                        Activo
                      </label>
                    </td>
                    <td className="px-2 py-2 text-racing-white/70">
                      {user.mustChangePassword ? "debe cambiar contraseña" : "contraseña ok"}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void updateUser(user.id)}
                          className="h-8 rounded-sm border border-racing-yellow/40 px-3 text-xs font-semibold text-racing-yellow uppercase"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          disabled={user.id === actorUserId}
                          onClick={() => void resetPassword(user.id)}
                          className="h-8 rounded-sm border border-racing-yellow/40 bg-racing-yellow/10 px-3 text-xs font-semibold text-racing-yellow uppercase disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {user.id === actorUserId ? "No disponible" : "Resetear contraseña"}
                        </button>
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
