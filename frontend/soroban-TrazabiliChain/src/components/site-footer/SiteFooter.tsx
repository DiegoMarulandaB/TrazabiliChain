import { InstagramLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";

const socialLinks = [
  {
    href: "https://www.linkedin.com/company/trazabilichain-demo/",
    label: "LinkedIn",
    Icon: LinkedinLogo,
  },
  {
    href: "https://x.com/trazabilichain_demo",
    label: "X",
    Icon: XLogo,
  },
  {
    href: "https://www.instagram.com/trazabilichain_demo/",
    label: "Instagram",
    Icon: InstagramLogo,
  },
];

export function SiteFooter() {
  return (
    <footer id="contacto" aria-labelledby="contact-title" className="scroll-mt-8 bg-ink text-white">
      <div className="mx-auto grid w-[min(100%-2.5rem,70rem)] gap-10 py-10 sm:w-[min(100%-3rem,70rem)] sm:grid-cols-[1fr_auto] sm:items-end sm:py-12">
        <div>
          <p className="mb-2 text-[11px] font-bold text-[#9fd0bc]">SIGAMOS LA CONVERSACIÓN</p>
          <h2 id="contact-title" className="mb-3 font-display text-2xl font-medium">
            Contacto
          </h2>
          <p className="mb-0 max-w-lg text-sm leading-6 text-white/75">
            Conoce las novedades del proyecto y acompaña el desarrollo de una trazabilidad más clara
            para las cadenas de suministro.
          </p>
        </div>

        <div>
          <nav aria-label="Redes sociales">
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
              {socialLinks.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (abre en una pestaña nueva)`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/25 px-3 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-white"
                  >
                    <Icon size={18} weight="regular" aria-hidden="true" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-3 mb-0 text-xs text-white/55">
            Enlaces de demostración; los perfiles oficiales están pendientes.
          </p>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-[min(100%-2.5rem,70rem)] flex-wrap justify-between gap-2 py-4 text-xs text-white/60 sm:w-[min(100%-3rem,70rem)]">
          <span>TrazabiliChain</span>
          <span>Una huella verifica integridad, no la veracidad inicial del dato.</span>
        </div>
      </div>
    </footer>
  );
}
