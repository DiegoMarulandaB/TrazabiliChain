"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

const splashDuration = 4;

type SplashScreenProps = {
  children: ReactNode;
};

export function SplashScreen({ children }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const splashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startTime = performance.now();
    let animationFrame = 0;

    function updateProgress(currentTime: number) {
      const elapsed = currentTime - startTime;
      const nextProgress = Math.min(Math.floor((elapsed / (splashDuration * 1000)) * 100), 100);
      setProgress(nextProgress);

      if (nextProgress === 100) {
        setIsVisible(false);
        return;
      }

      animationFrame = window.requestAnimationFrame(updateProgress);
    }

    animationFrame = window.requestAnimationFrame(updateProgress);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.fromTo(
        "[data-splash-content]",
        { autoAlpha: 0, y: prefersReducedMotion ? 0 : 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: prefersReducedMotion ? 0 : 0.65,
          ease: "power2.out",
        },
      );
    },
    { scope: splashRef },
  );

  return (
    <>
      <div inert={isVisible} aria-hidden={isVisible}>
        {children}
      </div>

      {isVisible && (
        <div
          ref={splashRef}
          className="fixed inset-0 z-100 grid min-h-svh place-items-center overflow-y-auto bg-paper px-6 py-10"
        >
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Cargando TrazabiliChain
          </p>
          <section className="w-full max-w-lg text-center" aria-labelledby="splash-title">
            <div data-splash-content>
              <span
                className="mx-auto mb-7 grid size-14 place-items-center rounded-lg bg-accent font-display text-3xl font-semibold text-white shadow-sm"
                aria-hidden="true"
              >
                T
              </span>
              <p className="mb-3 text-[11px] font-bold text-accent">
                TRAZABILIDAD PARA CADENAS RESPONSABLES
              </p>
              <h1
                id="splash-title"
                className="mb-4 font-display text-4xl font-medium text-ink sm:text-5xl"
              >
                TrazabiliChain
              </h1>
              <p className="mx-auto mb-10 max-w-md text-sm leading-6 text-muted sm:text-base">
                Conectamos el origen de cada producto con un historial verificable de su recorrido y
                sus evidencias.
              </p>

              <div className="mx-auto flex max-w-xs items-center gap-4">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft"
                  role="progressbar"
                  aria-label="Progreso de carga"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-sm tabular-nums text-ink">
                  {progress}%
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
