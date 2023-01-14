const NavBar = () => {
  return (
    <nav className="top-0 sticky h-[140px] w-full bg-yellow-400 text-black px-16">
      <div className="flex justify-between items-center h-full px-16">
        <div className="text-5xl">
          <a href="#inicio">SINTA</a>
        </div>
        <ul className="flex justify-evenly items-center h-full gap-x-5 uppercase ">
          <li>
            <a href="#quienes-somos">Quienes Somos</a>
          </li>
          <li>
            <a href="#miembros">Miebmros</a>
          </li>
          <li>
            <a href="#resultados">Resultados</a>
          </li>
          <li>
            <a href="#calendario">Calendario</a>
          </li>
          <li>
            <a href="#contacto">Contacto</a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
