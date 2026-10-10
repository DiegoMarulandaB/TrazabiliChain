"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const navigation = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contacto", label: "Contacto" },
  { href: "/#registro", label: "Registro" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && isMenuOpen) {
      closeMenu();
      menuButtonRef.current?.focus();
    }
  }

  return (
    <header
      className="relative z-10 border-b border-line bg-white/90"
      onKeyDown={handleMenuKeyDown}
    >
      <a
        href="#contenido"
        className="sr-only z-20 rounded bg-accent px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex min-h-16 max-w-[1120px] items-center justify-between gap-4 px-5 sm:min-h-[72px] sm:px-8">
        <Link
          className="inline-flex shrink-0 items-center gap-2.5 font-display text-[19px] font-semibold text-ink sm:text-xl"
          href="/"
          aria-label="TrazabiliChain, inicio"
          onClick={closeMenu}
        >
          <span
            className="grid size-[30px] place-items-center rounded-md bg-accent font-sans text-base text-white"
            aria-hidden="true"
          >
            T
          </span>
          <span>TrazabiliChain</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <nav
            id="primary-navigation"
            aria-label="Navegación principal"
            className={`${isMenuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col border-b border-line bg-white px-5 py-3 shadow-lg md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none`}
          >
            {navigation.map(({ href, label }) => (
              <Link
                key={href}
                className="rounded px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent-soft hover:text-accent md:py-2"
                href={href}
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}
          </nav>

          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] text-muted sm:text-xs">
            <span
              className="size-2 rounded-full bg-emerald-700 ring-[3px] ring-accent-soft"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Stellar · Testnet</span>
          </span>

          <button
            ref={menuButtonRef}
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-md text-ink hover:bg-accent-soft md:hidden"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="sr-only">Menú de navegación</span>
            <span className="flex w-[18px] flex-col gap-[5px]" aria-hidden="true">
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
