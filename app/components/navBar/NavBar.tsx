const navItems = [
  { href: "#quienes-somos", label: "Quienes somos" },
  { href: "#miembros", label: "Miembros" },
  { href: "#resultados", label: "Resultados" },
  { href: "#calendario", label: "Calendario" },
  { href: "#contacto", label: "Contacto" },
] as const;

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-10 h-[70px] w-full bg-yellow-400 text-black md:h-[140px]">
      <div className="flex h-full items-center justify-between p-4 md:p-8 lg:px-16">
        <a href="#inicio" className="mr-8 text-5xl lg:mr-0">
          SINTA
        </a>

        <ul className="hidden h-full items-center gap-x-3 uppercase md:flex md:justify-evenly lg:gap-x-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
