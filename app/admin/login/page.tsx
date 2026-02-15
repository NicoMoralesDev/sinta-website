import { redirectIfAdminAlreadyLogged, getAdminPageContext } from "@/app/admin/_lib";
import { AdminLoginForm } from "@/app/admin/_components/admin-login-form";

export default async function AdminLoginPage() {
  await redirectIfAdminAlreadyLogged();

  const context = await getAdminPageContext();

  if (!context.enabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-racing-black px-6 text-racing-white">
        <section className="w-full max-w-lg rounded-sm border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="font-mono text-xl font-semibold tracking-wider uppercase">Admin deshabilitado</h1>
          <p className="mt-2 text-sm text-red-100/90">{context.errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-racing-black px-6 text-racing-white">
      <section className="w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.25em] text-racing-yellow uppercase">SINTA Admin</p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-wide uppercase">Ingreso</h1>
          <p className="mt-2 text-sm text-racing-white/60">Acceso privado para usuarios internos del panel.</p>
        </div>

        {context.dryRun ? (
          <p className="rounded-sm border border-racing-yellow/30 bg-racing-yellow/10 px-3 py-2 text-center text-xs text-racing-yellow uppercase">
            Modo dry-run de desarrollo activo.
          </p>
        ) : null}

        <AdminLoginForm />
      </section>
    </main>
  );
}
