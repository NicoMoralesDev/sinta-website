const NavBar = () => {
  return (
    <nav className="top-0 sticky h-[70px] md:h-[140px] w-full bg-yellow-400 text-black">
      <div className="flex justify-between items-center h-full p-4 md:p-8 lg:px-16">
        <div className="text-5xl mr-8 lg:mr-0">
          <a href="#inicio">SINTA</a>
        </div>
        <ul className="hidden md:flex md:justify-evenly md:items-center h-full md:gap-x-3 lg:gap-x-6 uppercase">
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
