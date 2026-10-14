// import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Conoce el origen",
    description:
      "Consulta el producto, el lugar donde se registró y la organización responsable del lote.",
  },
  {
    number: "02",
    title: "Sigue cada etapa",
    description:
      "Productores y operadores pueden añadir fechas y detalles de recepción, transporte, transformación o entrega.",
  },
  {
    number: "03",
    title: "Revisa la evidencia",
    description:
      "Los documentos se asocian al lote y se guardan fuera de la cadena; su emisor debe validarse por separado.",
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
          <p className="mb-3 text-[11px] font-bold text-accent">
            INFORMACIÓN CLARA PARA CADA ETAPA
          </p>
          <h2
            id="about-title"
            className="mb-5 max-w-xl font-display text-3xl font-medium leading-tight text-ink sm:text-4xl"
          >
            Sigue el recorrido de un producto, del origen a la entrega.
          </h2>
          <p className="mb-4 max-w-prose text-base leading-7 text-gray-700 sm:text-base">
            TrazabiliChain reúne en una ficha los datos de origen, los cambios de custodia y las
            evidencias que comparten productores, transportistas, certificadores y marcas. Cada
            registro muestra quién aportó la información y cuándo se añadió.
          </p>
          <p className="mb-7 max-w-prose text-base leading-7 text-gray-700 sm:text-base">
            El consumidor puede abrir la información pública con un código QR. Los equipos de
            abastecimiento y auditoría pueden revisar el historial disponible antes de tomar una
            decisión.
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
          Qué demuestra el registro
        </h3>
        <p className="mb-0 max-w-3xl text-sm leading-6 text-ink">
          Una huella digital permite comparar la información con la que se registró en Stellar y
          detectar cambios posteriores. No prueba que el dato original sea verdadero ni que un
          certificado sea legítimo: eso requiere validar al emisor y la evidencia.
        </p>
      </aside>
    </section>
  );
}
