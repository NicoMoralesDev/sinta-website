import Link from "next/link";

const NavBar = () => {
  return (
    <nav className="sticky h-[140px] w-full bg-yellow-400 text-black">
      <div className="flex justify-between items-center h-full px-12">
        <div>
          <Link href="#inicio">Logo Equipo...</Link>
        </div>
        <ul className="flex justify-evenly items-center h-full gap-x-5 uppercase ">
          <li>
            <Link href="#quienes-somos">Quienes Somos</Link>
          </li>
          <li>
            <Link href="#equipo">Miebmros</Link>
          </li>
          <li>
            <Link href="#resultados">Resultados</Link>
          </li>
          <li>
            <Link href="#calendario">Calendario</Link>
          </li>
          <li>
            <Link href="#contacto">Contacto</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
