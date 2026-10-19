"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductNotificationsBell } from "@/components/notifications/ProductNotificationsBell";
import { ProducerAnchorNotifications } from "@/components/notifications/ProducerAnchorNotifications";
import type { DemoRole } from "@/lib/lots/lot-storage";
import { stellarNetwork } from "@/lib/stellar/network";

const navigation = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/registros", label: "Registro" },
  { href: "/#contacto", label: "Contacto" },
];
const workflowRoleEventName = "trazabilichain:workflow-role-change";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<DemoRole | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && isMenuOpen) {
      closeMenu();
      menuButtonRef.current?.focus();
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handleWorkflowRoleChange(event: Event) {
      const detail = (event as CustomEvent<{ role: DemoRole | null }>).detail;
      setActiveRole(detail.role);
    }

    window.addEventListener(workflowRoleEventName, handleWorkflowRoleChange);
    return () => window.removeEventListener(workflowRoleEventName, handleWorkflowRoleChange);
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-md"
      onKeyDown={handleMenuKeyDown}
    >
      <a
        href="#contenido"
        className="sr-only z-20 rounded bg-accent px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex min-h-16 max-w-280 items-center justify-between gap-4 px-5 sm:min-h-18 sm:px-8">
        <Link
          className="inline-flex shrink-0 items-center gap-2.5 font-display text-[19px] font-semibold text-ink sm:text-xl"
          href="/"
          aria-label="TrazabiliChain, inicio"
          onClick={closeMenu}
        >
          <span
            className="grid size-7.5 place-items-center rounded-md bg-accent font-sans text-base text-white"
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

          {activeRole === "producer" && <ProducerAnchorNotifications />}
          {activeRole && activeRole !== "producer" && <ProductNotificationsBell />}

          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] text-muted sm:text-xs">
            <span
              className="size-2 rounded-full bg-emerald-700 ring-[3px] ring-accent-soft"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Stellar · {stellarNetwork.label}</span>
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
            <span className="flex w-4.5 flex-col gap-1.25" aria-hidden="true">
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
