"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RecordsPanel } from "@/components/records-panel/RecordsPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = getSupabaseBrowserClient();

type SessionStage = "loading" | "ready" | "needsConfiguration" | "failed";
type SessionResult = { authenticated: true } | { authenticated: false; message: string };

export function AnonymousRecordsSession() {
  const [stage, setStage] = useState<SessionStage>(supabase ? "loading" : "needsConfiguration");
  const [attempt, setAttempt] = useState(0);
  const [failureMessage, setFailureMessage] = useState("");
  const initialization = useRef<Promise<SessionResult> | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;
    const sessionPromise =
      initialization.current ??
      (initialization.current = (async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            return {
              authenticated: false,
              message: "No se pudo comprobar la sesión. Verifica la conexión de Supabase.",
            };
          }

          if (sessionData.session) {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (!userError && userData.user) {
              return { authenticated: true };
            }
          }

          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            const errorCode =
              "code" in error && typeof error.code === "string" ? `: ${error.code}` : "";
            const message =
              error.status === 429
                  ? "Se alcanzó el límite temporal de sesiones anónimas. Espera unos minutos y vuelve a intentar."
                  : `Supabase rechazó la sesión anónima${error.status ? ` (HTTP ${error.status}${errorCode})` : errorCode}. Verifica el project ref, Anonymous Sign-Ins, CAPTCHA/Turnstile y rate limits.`;
            return {
              authenticated: false,
              message,
            };
          }
          return { authenticated: true };
        } catch {
          return {
            authenticated: false,
            message: "No se pudo conectar con Supabase para preparar el panel.",
          };
        }
      })());

    void sessionPromise.then((result) => {
      if (!isMounted) {
        return;
      }

      setStage(result.authenticated ? "ready" : "failed");
      if (!result.authenticated) {
        setFailureMessage(result.message);
        toast.error(result.message);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  function retry() {
    initialization.current = null;
    setStage("loading");
    setAttempt((current) => current + 1);
  }

  if (stage === "ready") {
    return <RecordsPanel />;
  }

  return (
    <section
      aria-labelledby="anonymous-session-title"
      className="mx-auto grid min-h-80 max-w-2xl content-center gap-4 border-y border-line py-12"
    >
      <p className="mb-0 text-[11px] font-bold text-accent">OPERACIÓN DE LOTES</p>
      <h1
        id="anonymous-session-title"
        className="mb-0 font-display text-3xl font-medium text-ink sm:text-4xl"
      >
        {stage === "loading" ? "Preparando el panel" : "El panel no está disponible"}
      </h1>
      <p className="mb-2 max-w-prose text-sm leading-6 text-gray-700" role={stage === "loading" ? "status" : "alert"}>
        {stage === "loading"
          ? "Estamos preparando una sesión segura para tus registros."
          : stage === "needsConfiguration"
            ? "Configura las variables de Supabase para iniciar el panel."
            : `${failureMessage} Los registros anónimos solo se recuperan en este navegador.`}
      </p>
      {stage !== "loading" && (
        <button
          type="button"
          onClick={retry}
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] focus-visible:outline-offset-2"
        >
          Volver a intentar
        </button>
      )}
    </section>
  );
}