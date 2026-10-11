// import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Un origen identificable",
    description:
      "Cada lote comienza con sus datos esenciales: producto, ubicación y organización responsable.",
  },
  {
    number: "02",
    title: "Un recorrido con contexto",
    description:
      "Los actores autorizados pueden registrar hitos como recepción, despacho, transformación o entrega.",
  },
  {
    number: "03",
    title: "Evidencia vinculada al lote",
    description:
      "Certificados y documentos pueden asociarse al registro, manteniendo los archivos fuera de la cadena.",
  },
];

export function AboutSection() {
  return (
    <section
      id="sobre"
      aria-labelledby="about-title"
      className="scroll-mt-8 border-t border-line py-12 sm:py-16"
    >
      <div className="grid gap-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] lg:gap-16">
        <div>
          <p className="mb-3 text-[11px] font-bold text-accent">TRAZABILIDAD CON CONTEXTO</p>
          <h2
            id="about-title"
            className="mb-5 max-w-xl font-display text-3xl font-medium leading-tight text-ink sm:text-4xl"
          >
            Del origen al destino, cada lote tiene una historia. Hazla visible.
          </h2>
          <p className="mb-4 max-w-prose text-base leading-7 text-gray-700 sm:text-base">
            TrazabiliChain conecta el origen de un producto, a las personas que participan en su
            recorrido y las evidencias asociadas. Así, productores, marcas y compradores pueden
            consultar qué se registró y cuándo, sin reconstruir la historia a partir de documentos
            dispersos.
          </p>
          <p className="mb-7 max-w-prose text-base leading-7 text-gray-700 sm:text-base">
            Desde un código QR, un consumidor puede conocer el recorrido que se decidió compartir;
            los equipos de abastecimiento y auditoría pueden revisar los registros disponibles para
            tomar decisiones con más contexto.
          </p>
          {/* <Link
            href="/#registro"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-[#125746] focus-visible:outline-offset-2"
          >
            Explorar los registros
          </Link> */}
        </div>

        <div className="grid content-start divide-y divide-line border-y border-line">
          {capabilities.map((capability) => (
            <article key={capability.number} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5">
              <span className="pt-1 font-mono text-xs text-accent">{capability.number}</span>
              <div>
                <h3 className="mb-2 font-display text-xl font-medium text-ink">
                  {capability.title}
                </h3>
                <p className="mb-0 max-w-prose text-base leading-6 text-gray-700 ">
                  {capability.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside
        aria-labelledby="integrity-title"
        className="mt-10 grid gap-3 border-l-2 border-accent bg-accent-soft/60 px-5 py-5 sm:grid-cols-[12rem_1fr] sm:gap-8 sm:px-7"
      >
        <h3 id="integrity-title" className="mb-0 font-display text-lg font-medium text-ink">
          Integridad, con transparencia
        </h3>
        <p className="mb-0 max-w-3xl text-sm leading-6 text-ink">
          Una huella en Stellar puede ayudar a detectar cambios posteriores al registro; no
          demuestra por sí sola que el dato inicial sea verdadero ni que un certificado sea
          legítimo. Por eso, la trazabilidad también depende de actores identificados y procesos
          adecuados para validar la evidencia.
        </p>
      </aside>
    </section>
  );
}
