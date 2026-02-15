"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

type SubmitState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/v1/admin/auth/logout", {
        method: "POST",
      });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="rounded-sm border border-racing-white/30 px-3 py-1.5 font-semibold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow disabled:opacity-60"
    >
      {loading ? "Saliendo..." : "Salir"}
    </button>
  );
}

export function ChangePasswordForm(props: { compact?: boolean }) {
  const router = useRouter();
  const compact = props.compact === true;

  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [state, setState] = useState<SubmitState>({
    loading: false,
    error: null,
    success: null,
  });

  const disabled = useMemo(
    () => state.loading || !currentPassword || !nextPassword,
    [currentPassword, nextPassword, state.loading],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }

    setState({ loading: true, error: null, success: null });
    try {
      const response = await fetch("/api/v1/admin/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          nextPassword,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setState({ loading: false, error: payload.error ?? "La solicitud falló.", success: null });
        return;
      }

      setCurrentPassword("");
      setNextPassword("");
      setState({ loading: false, error: null, success: "Contraseña actualizada." });
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red.", success: null });
    }
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-3 ${compact ? "" : "rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4"}`}>
      {!compact ? (
        <h3 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">Cambiar contraseña</h3>
      ) : null}

      <label className="block text-xs text-racing-white/70">
        <span className="mb-1 block uppercase tracking-wider">Contraseña actual</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
        />
      </label>

      <label className="block text-xs text-racing-white/70">
        <span className="mb-1 block uppercase tracking-wider">Nueva contraseña</span>
        <input
          type="password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
      >
        {state.loading ? "Guardando..." : "Actualizar contraseña"}
      </button>

      {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-green-300">{state.success}</p> : null}
    </form>
  );
}


