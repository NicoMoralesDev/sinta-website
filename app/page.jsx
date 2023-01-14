import Image from "next/image";
import { Inter } from "@next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex justify-center align-center flex-col">
      <section className="flex flex-col items-center h-screen bg-black text-white p-10">
        <h1 className="text-xl">SINTA eSports</h1>
        <p>En construcción...</p>
      </section>
      <section id="quienes-somos">
        <h2>¿Quiénes somos?</h2>
      </section>
      <section>
        <h2>Miembros</h2>
      </section>
      <section>
        <h2>Últimos Resultados</h2>
      </section>
      <section>
        <h2>Calendario</h2>
      </section>
      <section>
        <h2>Contacto</h2>
      </section>
    </main>
  );
}
