import Image from "next/image";
import Inicio from "./pages/Inicio";

const members = [
  { country: "ar", name: "Kevin Fontana" },
  { country: "cr", name: "Humberto Marin" },
  { country: "co", name: "Kleyber Mestre" },
  { country: "ar", name: "Nicolas Morales" },
  { country: "ar", name: "Juan Manuel Pertica" },
  { country: "ec", name: "Marcelo Villafuerte" },
  { country: "ar", name: "Facundo Zanuttini" },
] as const;

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      <Inicio />

      <section id="quienes-somos" className="section color-yellow">
        <h2>Quienes somos?</h2>
        <Image
          src="/sinta-toyotagt86.webp"
          width={1000}
          height={500}
          alt="Toyota GT86 de SINTA eSports"
          priority
          className="h-auto w-full max-w-5xl"
        />
        <a
          href="https://www.instagram.com/sinta.esport/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-lg underline"
        >
          instagram.com/sinta.esport
        </a>
      </section>

      <section id="miembros" className="section color-zinc">
        <h2>Miembros</h2>
        <p>
          Equipo competitivo de sim racing con pilotos de Latinoamerica y
          enfoque en entrenamiento, consistencia y resultados.
        </p>
        <ul className="mt-6 space-y-2">
          {members.map((member) => (
            <li key={member.name} className="text-lg">
              <span className={`fi fi-${member.country} mr-2`} aria-hidden="true" />
              {member.name}
            </li>
          ))}
        </ul>
      </section>

      <section id="resultados" className="section color-yellow">
        <h2>Ultimos resultados</h2>
        <p>
          Proximamente se publicaran resultados oficiales, resumenes de carreras
          y estadisticas del equipo.
        </p>
      </section>

      <section id="calendario" className="section color-zinc">
        <h2>Calendario</h2>
        <p>
          Proximamente compartiremos fechas de torneos, entrenamientos y eventos
          especiales.
        </p>
      </section>

      <section id="contacto" className="section color-yellow">
        <h2>Contacto</h2>
        <a
          href="https://www.instagram.com/sinta.esport/"
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 w-12"
          aria-label="Abrir Instagram de SINTA eSports"
        >
          <Image
            src="/instagram.png"
            alt="Logo de Instagram"
            width={48}
            height={48}
            className="h-12 w-12"
          />
        </a>
      </section>
    </main>
  );
}
