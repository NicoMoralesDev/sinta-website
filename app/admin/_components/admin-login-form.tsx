"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

type SubmitState = {
  loading: boolean;
  error: string | null;
};

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<SubmitState>({ loading: false, error: null });

  const disabled = useMemo(() => state.loading || !username || !password, [username, password, state.loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }

    setState({ loading: true, error: null });

    try {
      const response = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setState({ loading: false, error: payload.error ?? "Error de acceso." });
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setState({ loading: false, error: "Error de red." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-racing-steel/25 bg-racing-carbon/60 p-6">
      <label className="block text-xs text-racing-white/70">
        <span className="mb-1 block tracking-wider uppercase">Usuario</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
          autoComplete="username"
        />
      </label>

      <label className="block text-xs text-racing-white/70">
        <span className="mb-1 block tracking-wider uppercase">Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
          autoComplete="current-password"
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase disabled:opacity-60"
      >
        {state.loading ? "Ingresando..." : "Ingresar"}
      </button>

      {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
    </form>
  );
}



