import Image from "next/image";
import { Inter } from "@next/font/google";
import Inicio from "./pages/Inicio";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex justify-center align-center flex-col">
      <Inicio />
      <section id="quienes-somos" className="section color-yellow">
        <h2>¿Quiénes somos?</h2>
        <Image src="/sinta-toyotagt86.webp" width="1000" height="500" />
        <div>https://www.instagram.com/sinta.esport/</div>
      </section>
      <section id="miembros" className="section color-zinc">
        <h2>Miembros</h2>
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.
        </p>
        <ul>
          <li>Kevin Fontana</li>
          <li>Humberto Marín</li>
          <li>Nicolás Morales</li>
          <li>Juan Manuel Pertica</li>
          <li>Marcelo Villafuerte</li>
          <li>Facundo Zanuttini</li>
        </ul>
      </section>
      <section id="resultados" className="section color-yellow">
        <h2>Últimos Resultados</h2>
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.
        </p>
      </section>
      <section id="calendario" className="section color-zinc">
        <h2>Calendario</h2>
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.
        </p>
      </section>
      <section id="contacto" className="section color-yellow">
        <h2>Contacto</h2>
        <div className="w-12 h-12 cursor-pointer">
          <Link href="https://www.instagram.com/sinta.esport/" legacyBehavior>
            <a target="_blank" rel="noopener noreferrer">
              <Image
                src="/instagram.png"
                alt="Instagram Logo"
                width={50}
                height={50}
                layout="responsive"
              />
            </a>
          </Link>
        </div>
      </section>
    </main>
  );
}
