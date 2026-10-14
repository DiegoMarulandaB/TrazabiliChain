import React from "react";
import Link from "next/link";

export interface ProductHeroProps {
  badgeText?: string;
  title?: string;
  highlightedTitle?: string;
  description?: string;
  primaryActionText?: string;
  secondaryActionText?: string;
}

export const ProductHero: React.FC<ProductHeroProps> = ({
  badgeText = "Del origen a la tienda, con información clara",
  title = "Descubre de dónde viene cada lote",
  highlightedTitle = "y qué pasó en su recorrido.",
  description = "Productores, transportistas y marcas reúnen los datos y documentos de cada etapa. Escanea el código QR para consultar la historia que la organización comparte.",
  primaryActionText = "Consultar lotes",
  secondaryActionText = "Cómo funciona",
}) => {
  return (
    <section className="relative overflow-hidden bg-paper py-20 lg:py-32 text-ink">
      {/* Elementos decorativos de fondo (Estética limpia / profundidad sutil) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-accent-soft/40 to-transparent pointer-events-none blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Columna de Texto e Información Principal */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-soft text-accent text-xs sm:text-sm font-medium mb-6 border border-line shadow-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {badgeText}
            </div>

            {/* Título Principal */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink font-normal leading-[1.1] mb-6">
              {title}{" "}
              <span className="text-accent block sm:inline font-semibold mt-1">
                {highlightedTitle}
              </span>
            </h1>

            {/* Descripción */}
            <p className="font-sans text-gray-700  text-lg sm:text-xl leading-relaxed max-w-2xl mb-8">
              {description}
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                href="/registros"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-md bg-accent text-white font-medium shadow-md hover:opacity-95 transition-all duration-200 cursor-pointer  focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-4"
              >
                {primaryActionText}
              </Link>
              <Link
                href="#sobre"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-md bg-surface text-ink border border-line font-medium shadow-sm hover:bg-paper transition-all duration-200 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-4"
              >
                {secondaryActionText}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-line w-full max-w-xl">
              <div>
                <p className="font-display text-xl sm:text-base font-bold text-ink">Origen</p>
                <p className="text-sm text-gray-700">de cada lote</p>
              </div>
              <div>
                <p className="font-display text-xl sm:text-base font-bold text-ink">Recorrido</p>
                <p className="text-sm text-gray-700">por etapas</p>
              </div>
              <div>
                <p className="font-display text-xl sm:text-base font-bold text-ink">Evidencia</p>
                <p className="text-sm text-gray-700">asociada al lote</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <div className="relative p-6 sm:p-8 rounded-md bg-surface border border-line shadow-xl shadow-ink/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 ">
                  Ejemplo de recorrido
                </span>
                <span className="px-2.5 py-1 rounded-md bg-accent-soft text-accent text-xs font-medium">
                  Lote de café
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-2xl bg-paper border border-line/60">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Origen del producto</p>
                    <p className="text-sm text-gray-700">
                      Finca, municipio y organización responsable
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-2xl bg-paper border border-line/60">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Transporte y transformación</p>
                    <p className="text-sm text-gray-700 ">
                      Hitos con fecha, responsable y evidencia disponible
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-2xl bg-paper border border-line/60">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Consulta por QR</p>
                    <p className="text-sm text-gray-700">
                      Revisa la información que la organización decidió compartir
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 text-center">
                <span className="text-xs text-gray-700 italic">
                  Consulta los datos y sus evidencias sin confundir registro con certificación.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
