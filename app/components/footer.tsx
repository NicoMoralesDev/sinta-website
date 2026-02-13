import type { FooterCopy } from "../content/site-content";

type FooterProps = {
  copy: FooterCopy;
};

export function Footer({ copy }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-racing-steel/20 bg-racing-black py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-racing-yellow uppercase">
          <span className="inline-block h-4 w-0.5 bg-racing-yellow" />
          SINTA eSports
        </div>

        <nav aria-label={copy.navLabel}>
          <ul className="flex flex-wrap justify-center gap-6">
            {copy.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-xs font-medium tracking-wider text-racing-white/40 uppercase transition-colors hover:text-racing-yellow"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-racing-white/30">
          {currentYear} SINTA eSports. {copy.rights}
        </p>
      </div>
    </footer>
  );
}
