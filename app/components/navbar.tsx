"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Language, NavLink } from "../content/site-content";

type NavbarProps = {
  lang: Language;
  links: NavLink[];
  ctaLabel: string;
  languageLabel: string;
  languageAria: string;
};

const languageOptions: Array<{ code: Language; label: string; href: string }> = [
  { code: "es", label: "ES", href: "/" },
  { code: "en", label: "EN", href: "/?lang=en" },
];

export function Navbar({
  lang,
  links,
  ctaLabel,
  languageLabel,
  languageAria,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuLabels =
    lang === "es"
      ? { open: "Abrir menu", close: "Cerrar menu" }
      : { open: "Open menu", close: "Close menu" };

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-racing-steel/30 bg-racing-black/95 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a
          href="#hero"
          className="flex items-center gap-2 font-mono text-xl font-bold tracking-widest text-racing-yellow uppercase"
        >
          <span className="inline-block h-6 w-1 bg-racing-yellow" />
          SINTA
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-sans text-sm font-semibold tracking-wider text-racing-white/70 uppercase transition-colors hover:text-racing-yellow"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1" aria-label={languageAria} role="group">
            <span className="mr-1 text-[10px] font-semibold tracking-[0.2em] text-racing-white/40 uppercase">
              {languageLabel}
            </span>
            {languageOptions.map((option) => (
              <a
                key={option.code}
                href={option.href}
                aria-current={lang === option.code ? "page" : undefined}
                className={`rounded-sm px-2 py-1 text-xs font-bold tracking-wider transition-colors ${
                  lang === option.code
                    ? "bg-racing-yellow text-racing-black"
                    : "text-racing-white/60 hover:text-racing-yellow"
                }`}
              >
                {option.label}
              </a>
            ))}
          </div>

          <a
            href="#contact"
            className="rounded-sm bg-racing-yellow px-5 py-2 font-sans text-sm font-bold tracking-wider text-racing-black uppercase transition-colors hover:bg-racing-yellow/90"
          >
            {ctaLabel}
          </a>
        </div>

        <button
          type="button"
          className="text-racing-white md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? menuLabels.close : menuLabels.open}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-racing-steel/20 bg-racing-black/98 backdrop-blur-md md:hidden">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 font-sans text-base font-semibold tracking-wider text-racing-white/80 uppercase transition-colors hover:text-racing-yellow"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-racing-steel/20 px-6 py-4">
            <div className="flex items-center gap-2" aria-label={languageAria} role="group">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-racing-white/40 uppercase">
                {languageLabel}
              </span>
              {languageOptions.map((option) => (
                <a
                  key={option.code}
                  href={option.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={lang === option.code ? "page" : undefined}
                  className={`rounded-sm px-2 py-1 text-xs font-bold tracking-wider ${
                    lang === option.code
                      ? "bg-racing-yellow text-racing-black"
                      : "text-racing-white/60"
                  }`}
                >
                  {option.label}
                </a>
              ))}
            </div>

            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="inline-block rounded-sm bg-racing-yellow px-5 py-2 font-sans text-sm font-bold tracking-wider text-racing-black uppercase"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
