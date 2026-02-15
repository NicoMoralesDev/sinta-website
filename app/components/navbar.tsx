"use client";

import { Instagram, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Language, NavLink } from "../content/site-content";

type NavbarProps = {
  lang: Language;
  links: NavLink[];
  homeSectionsLabel: string;
  homeSections: NavLink[];
  languageLabel: string;
  languageAria: string;
  instagramHref: string;
  instagramAriaLabel: string;
  languageHrefs?: {
    es: string;
    en: string;
  };
};

export function Navbar({
  lang,
  links,
  homeSectionsLabel,
  homeSections,
  languageLabel,
  languageAria,
  instagramHref,
  instagramAriaLabel,
  languageHrefs,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const showAdminLink = process.env.NODE_ENV === "development";
  const homeHref = lang === "en" ? "/?lang=en#hero" : "/#hero";
  const menuLabels =
    lang === "es"
      ? { open: "Abrir menu", close: "Cerrar menu" }
      : { open: "Open menu", close: "Close menu" };
  const languageOptions: Array<{ code: Language; label: string; href: string }> = [
    { code: "es", label: "ES", href: languageHrefs?.es ?? "/" },
    { code: "en", label: "EN", href: languageHrefs?.en ?? "/?lang=en" },
  ];
  const navItems = [...links, ...(showAdminLink ? [{ href: "/admin", label: "Admin" }] : [])];

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
        <div className="flex items-center gap-3">
          <a
            href={homeHref}
            className="flex items-center gap-2 font-mono text-xl font-bold tracking-widest text-racing-yellow uppercase"
          >
            <span className="inline-block h-6 w-1 bg-racing-yellow" />
            SINTA
          </a>

          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={instagramAriaLabel}
            className="inline-flex items-center justify-center rounded-sm bg-racing-yellow p-2 text-racing-black transition-colors hover:bg-racing-yellow/90"
          >
            <Instagram size={16} />
          </a>
        </div>

        <ul className="hidden items-center gap-8 md:flex">
          {navItems.map((link, index) => {
            if (index === 0 && homeSections.length > 0) {
              return (
                <li key={link.href} className="relative">
                  <details className="group relative" aria-label={homeSectionsLabel}>
                    <summary className="cursor-pointer list-none font-sans text-sm font-semibold tracking-wider text-racing-white/70 uppercase transition-colors hover:text-racing-yellow">
                      {link.label}
                    </summary>
                    <ul className="absolute left-0 mt-2 min-w-[220px] rounded-sm border border-racing-steel/30 bg-racing-black/95 p-2 shadow-xl">
                      <li>
                        <a
                          href={link.href}
                          className="block rounded-sm px-3 py-2 text-xs font-semibold tracking-wider text-racing-white/75 uppercase transition-colors hover:bg-racing-carbon hover:text-racing-yellow"
                        >
                          {link.label}
                        </a>
                      </li>
                      {homeSections.map((section) => (
                        <li key={section.href}>
                          <a
                            href={section.href}
                            className="block rounded-sm px-3 py-2 text-xs font-semibold tracking-wider text-racing-white/75 uppercase transition-colors hover:bg-racing-carbon hover:text-racing-yellow"
                          >
                            {section.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            }

            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-sans text-sm font-semibold tracking-wider text-racing-white/70 uppercase transition-colors hover:text-racing-yellow"
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-racing-white md:hidden"
            onClick={() =>
              setMobileOpen((value) => {
                const next = !value;
                if (!next) {
                  setHomeMenuOpen(false);
                }
                return next;
              })
            }
            aria-label={mobileOpen ? menuLabels.close : menuLabels.open}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-1" aria-label={languageAria} role="group">
            <span className="mr-1 hidden text-[10px] font-semibold tracking-[0.2em] text-racing-white/40 uppercase md:inline">
              {languageLabel}
            </span>
            {languageOptions.map((option) => (
              <a
                key={option.code}
                href={option.href}
                aria-current={lang === option.code ? "page" : undefined}
                className={`rounded-sm px-2 py-1 text-[11px] font-bold tracking-wider transition-colors ${
                  lang === option.code
                    ? "bg-racing-yellow text-racing-black"
                    : "text-racing-white/60 hover:text-racing-yellow"
                }`}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-racing-steel/20 bg-racing-black/98 backdrop-blur-md md:hidden">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {navItems.map((link, index) => {
              if (index === 0 && homeSections.length > 0) {
                return (
                  <li key={link.href} className="border-b border-racing-steel/15 pb-2">
                    <button
                      type="button"
                      onClick={() => setHomeMenuOpen((value) => !value)}
                      className="flex w-full items-center justify-between py-3 font-sans text-base font-semibold tracking-wider text-racing-white/80 uppercase transition-colors hover:text-racing-yellow"
                      aria-expanded={homeMenuOpen}
                      aria-label={homeSectionsLabel}
                    >
                      <span>{link.label}</span>
                      <span className="text-racing-white/45">{homeMenuOpen ? "-" : "+"}</span>
                    </button>
                    {homeMenuOpen ? (
                      <ul className="pl-2">
                        <li>
                          <a
                            href={link.href}
                            onClick={() => {
                              setHomeMenuOpen(false);
                              setMobileOpen(false);
                            }}
                            className="block py-2 font-sans text-sm font-semibold tracking-wider text-racing-white/70 uppercase transition-colors hover:text-racing-yellow"
                          >
                            {link.label}
                          </a>
                        </li>
                        {homeSections.map((section) => (
                          <li key={section.href}>
                            <a
                              href={section.href}
                              onClick={() => {
                                setHomeMenuOpen(false);
                                setMobileOpen(false);
                              }}
                              className="block py-2 font-sans text-sm font-semibold tracking-wider text-racing-white/70 uppercase transition-colors hover:text-racing-yellow"
                            >
                              {section.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              }

              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => {
                      setHomeMenuOpen(false);
                      setMobileOpen(false);
                    }}
                    className="block py-3 font-sans text-base font-semibold tracking-wider text-racing-white/80 uppercase transition-colors hover:text-racing-yellow"
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
