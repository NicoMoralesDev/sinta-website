import Image from "next/image";
import { Inter } from "@next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex justify-center align-center flex-col mx-12">
      <section className="flex flex-col items-center h-screen py-[188px] -mt-[140px]">
        <h1 className="text-xl">SINTA eSports</h1>
        <p>En construcción...</p>
      </section>
      <section id="quienes-somos" className="bg-yellow-400 text-black">
        <h2>¿Quiénes somos?</h2>
      </section>
      <section className="bg-gray-900 text-white">
        <h2>Miembros</h2>
      </section>
      <section className="bg-yellow-400 text-black">
        <h2>Últimos Resultados</h2>
      </section>
      <section className="bg-gray-900 text-white">
        <h2>Calendario</h2>
      </section>
      <section className="bg-yellow-400 text-black">
        <h2>Contacto</h2>
      </section>
    </main>
  );
}
