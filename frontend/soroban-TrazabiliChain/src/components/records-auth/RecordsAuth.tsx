"use client";

import { ArrowLeft, ArrowRight, EnvelopeSimple, LockKey, SpinnerGap } from "@phosphor-icons/react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { RecordsPanel } from "@/components/records-panel/RecordsPanel";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type AccessStage = "checking" | "credentials" | "verification" | "dashboard";
type AuthMode = "signIn" | "signUp";
type VerificationPurpose = "signup" | "email";

export function RecordsAuth() {
  const [stage, setStage] = useState<AccessStage>(supabase ? "checking" : "credentials");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState<VerificationPurpose>("signup");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const suppressSessionAccess = useRef(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setStage(data.session ? "dashboard" : "credentials");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!suppressSessionAccess.current) {
        setStage(session ? "dashboard" : "credentials");
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("Configura Supabase para habilitar el acceso al dashboard.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signUp") {
        suppressSessionAccess.current = true;
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage("No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.");
        } else if (data.session) {
          await supabase.auth.signOut();
          setMessage(
            "Activa la confirmación de correo en Supabase para exigir el código antes del acceso.",
          );
        } else {
          setVerificationPurpose("signup");
          setStage("verification");
          setMessage(`Enviamos un código de 6 dígitos a ${email}.`);
        }
        suppressSessionAccess.current = false;
      } else {
        suppressSessionAccess.current = true;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(
            "No se pudo iniciar sesión. Revisa tu correo, contraseña y confirmación de email.",
          );
        } else {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            setMessage("No se pudo preparar la verificación. Inténtalo de nuevo.");
          } else {
            const { error: codeError } = await supabase.auth.signInWithOtp({
              email,
              options: { shouldCreateUser: false },
            });
            if (codeError) {
              setMessage("No se pudo enviar el código. Inténtalo de nuevo más tarde.");
            } else {
              setVerificationPurpose("email");
              setStage("verification");
              setMessage(`Enviamos un código de acceso a ${email}.`);
            }
          }
        }
        suppressSessionAccess.current = false;
      }
    } catch {
      suppressSessionAccess.current = false;
      setMessage("No se pudo conectar con el servicio de acceso. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase || !/^\d{6}$/.test(verificationCode)) {
      setMessage("Ingresa el código de 6 números enviado a tu correo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: verificationPurpose,
      });
      if (error) {
        setMessage("El código no es válido o ya venció. Revisa el correo e inténtalo de nuevo.");
      } else {
        setStage("dashboard");
      }
    } catch {
      setMessage("No se pudo verificar el código. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    if (!supabase) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response =
        verificationPurpose === "signup"
          ? await supabase.auth.resend({ type: "signup", email })
          : await supabase.auth.signInWithOtp({
              email,
              options: { shouldCreateUser: false },
            });
      setMessage(
        response.error
          ? "No se pudo reenviar el código. Inténtalo de nuevo."
          : `Enviamos otro código a ${email}.`,
      );
    } catch {
      setMessage("No se pudo reenviar el código. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setStage("credentials");
    setPassword("");
  }

  if (stage === "checking") {
    return (
      <div
        className="grid min-h-72 place-items-center"
        role="status"
        aria-label="Comprobando sesión"
      >
        <SpinnerGap
          size={24}
          className="animate-spin text-accent motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (stage === "dashboard") {
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="mb-1 text-[11px] font-bold text-accent">ÁREA DE TRABAJO</p>
            <p className="mb-0 text-sm text-gray-700">Sesión verificada con Supabase</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="min-h-10 rounded-md border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-offset-2"
          >
            Cerrar sesión
          </button>
        </div>
        <RecordsPanel />
      </>
    );
  }

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden border border-line bg-white shadow-[0_24px_80px_-48px_rgba(25,51,50,0.5)] lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex min-h-64 flex-col justify-between bg-ink p-6 text-white sm:p-9 lg:min-h-136">
        <div className="grid size-10 place-items-center rounded-md bg-accent-soft font-display text-xl font-semibold text-ink">
          T
        </div>
        <div className="mt-10">
          <p className="mb-3 text-xs font-semibold uppercase text-[#a9d7c5]">
            Trazabilidad de lotes
          </p>
          <h1 className="mb-4 max-w-sm font-display text-3xl font-medium leading-tight sm:text-4xl">
            Cada registro, con su origen y recorrido.
          </h1>
          <p className="mb-0 max-w-sm text-sm leading-6 text-white/75">
            Accede a los lotes, sus eventos y evidencias desde un solo espacio de trabajo.
          </p>
        </div>
        <p className="mb-0 mt-10 text-xs text-white/60">TrazabiliChain · Stellar Testnet</p>
      </div>

      <div className="flex items-center p-6 sm:p-10">
        <div className="mx-auto w-full max-w-sm">
          {stage === "verification" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setStage("credentials");
                  setMessage("");
                  setVerificationCode("");
                }}
                className="mb-7 inline-flex min-h-9 items-center gap-2 text-sm font-medium text-gray-700 hover:text-ink"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Volver
              </button>
              <EnvelopeSimple size={24} className="mb-4 text-accent" aria-hidden="true" />
              <h2 className="mb-2 font-display text-2xl font-medium text-ink">
                {verificationPurpose === "signup" ? "Confirma tu correo" : "Verifica tu acceso"}
              </h2>
              <p className="mb-6 text-sm leading-6 text-gray-700">
                Ingresa el código de seis dígitos que enviamos a{" "}
                <strong className="break-all text-ink">{email}</strong>.
              </p>
              <form className="grid gap-4" onSubmit={verifyCode}>
                <div className="grid gap-1.5">
                  <label htmlFor="verification-code" className="text-sm font-semibold text-ink">
                    Código de verificación
                  </label>
                  <input
                    id="verification-code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                    className="min-h-12 rounded-md border border-line bg-paper px-3 text-center font-mono text-xl tracking-[0.3em] text-ink focus-visible:bg-white"
                  />
                </div>
                {message && (
                  <p className="mb-0 text-sm text-gray-700" role="status">
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:opacity-60"
                >
                  {isSubmitting ? "Verificando…" : "Verificar y entrar"}
                  {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
                </button>
              </form>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={resendCode}
                className="mt-4 min-h-10 text-sm font-semibold text-accent underline-offset-4 hover:underline disabled:opacity-60"
              >
                Reenviar código
              </button>
            </>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-bold text-accent">ACCESO A REGISTROS</p>
              <h2 className="mb-2 font-display text-2xl font-medium text-ink">
                {mode === "signUp" ? "Crear cuenta" : "Iniciar sesión"}
              </h2>
              <p className="mb-6 text-sm leading-6 text-gray-700">
                {mode === "signUp"
                  ? "Registra tus datos. Te enviaremos un código para confirmar el correo."
                  : "Ingresa tu correo y contraseña. Después confirmaremos el acceso con un código enviado a tu correo."}
              </p>
              <form className="grid gap-4" onSubmit={submitCredentials}>
                <div className="grid gap-1.5">
                  <label htmlFor="account-email" className="text-sm font-semibold text-ink">
                    Correo electrónico
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
                    placeholder="nombre@organizacion.com"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="account-password" className="text-sm font-semibold text-ink">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockKey
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
                      aria-hidden="true"
                    />
                    <input
                      id="account-password"
                      type="password"
                      autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                      minLength={8}
                      maxLength={72}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="min-h-11 w-full rounded-md border border-line bg-white py-2 pl-10 pr-3 text-sm text-ink"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>
                {!supabase && (
                  <p
                    className="mb-0 border-l-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                    role="alert"
                  >
                    Falta configurar <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                    <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                  </p>
                )}
                {message && (
                  <p className="mb-0 text-sm text-red-800" role="alert">
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !supabase}
                  className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Un momento…"
                    : mode === "signUp"
                      ? "Crear cuenta"
                      : "Entrar al dashboard"}
                  {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
                </button>
              </form>
              <p className="mb-0 mt-6 text-sm text-gray-700">
                {mode === "signUp" ? "¿Ya tienes cuenta?" : "¿Primera vez aquí?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signUp" ? "signIn" : "signUp");
                    setMessage("");
                  }}
                  className="font-semibold text-accent underline-offset-4 hover:underline"
                >
                  {mode === "signUp" ? "Inicia sesión" : "Crear cuenta"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
