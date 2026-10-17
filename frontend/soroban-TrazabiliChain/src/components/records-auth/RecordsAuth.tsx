"use client";

import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { driver } from "driver.js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { StellarWalletProvider } from "@/components/providers/StellarWalletProvider";
import { RecordsPanel } from "@/components/records-panel/RecordsPanel";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import {
  demoRoles,
  findOwnedLotRecordsByPrefix,
  findPublicLotRecordsByPrefix,
  type DemoRole,
  type LotRecord,
} from "@/lib/lots/lot-storage";
import { saveProductNotificationPreference } from "@/lib/lots/product-notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type AccessStage =
  "credentials" | "workflowPreferences" | "lotLookup" | "dashboard" | "resetPassword";
type AuthMode = "signIn" | "signUp";
const productOptions = ["Café orgánico", "Cacao orgánico", "Algodón orgánico"];
const workflowRoleEventName = "trazabilichain:workflow-role-change";
const rolesWithDashboardLotList: DemoRole[] = ["producer", "b2bBuyer"];
const rolesWithLotPrefixLookup: DemoRole[] = [
  "supplyActor",
  "certifier",
  "organizationAdmin",
  "auditor",
  "consumer",
];
const roleDescriptions: Record<DemoRole, string> = {
  producer: "Registra lotes y su origen; después puede publicar un QR y anclar una huella.",
  supplyActor: "Añade al historial los traslados y otras etapas de la cadena.",
  certifier: "Asocia certificados y sus archivos de evidencia a un lote.",
  organizationAdmin:
    "Gestiona el directorio local y, con la wallet administradora, autoriza actores en Soroban.",
  b2bBuyer: "Consulta lotes y puede preparar un escrow opcional de prueba en Stellar Testnet.",
  auditor: "Revisa eventos, certificados y datos declarados sin modificar la evidencia fuente.",
  consumer: "Consulta la información que una organización decidió publicar mediante QR.",
};

export function RecordsAuth() {
  const router = useRouter();
  const [stage, setStage] = useState<AccessStage>("credentials");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [workflowRole, setWorkflowRole] = useState<DemoRole>("producer");
  const [selectedProduct, setSelectedProduct] = useState(productOptions[0]);
  const [lotPrefix, setLotPrefix] = useState("");
  const [candidates, setCandidates] = useState<LotRecord[]>([]);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [isSearchingLots, setIsSearchingLots] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginTourRef = useRef<ReturnType<typeof driver> | null>(null);
  const workspacePreferencesDraft = useWorkDraft({
    userId: authUserId,
    role: "producer",
    product: productOptions[0],
    draftKey: "workspace-preferences",
    payload: { workflowRole, selectedProduct },
    enabled: Boolean(authUserId),
    onRestore: (draft) => {
      if (draft.workflowRole && demoRoles.includes(draft.workflowRole)) {
        setWorkflowRole(draft.workflowRole);
      }
      if (draft.selectedProduct && productOptions.includes(draft.selectedProduct)) {
        setSelectedProduct(draft.selectedProduct);
      }
    },
  });
  const lotLookupDraft = useWorkDraft({
    userId: authUserId,
    role: workflowRole,
    product: selectedProduct,
    draftKey: "lot-lookup",
    payload: { lotPrefix },
    enabled: stage === "lotLookup",
    onRestore: (draft) => {
      if (draft.lotPrefix !== undefined) setLotPrefix(draft.lotPrefix);
    },
  });

  useEffect(() => () => loginTourRef.current?.destroy(), []);

  function startLoginGuide() {
    loginTourRef.current?.destroy();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    loginTourRef.current = driver({
      animate: !reducedMotion,
      allowClose: true,
      allowKeyboardControl: true,
      overlayClickBehavior: "close",
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Finalizar",
      closeBtnLabel: "Cerrar guía",
      popoverClass: "trazabili-tour",
      steps: [
        {
          element: "[data-tour-login-profile]",
          popover: {
            title: "Paso 1 · Perfil de trabajo",
            description: `${roleDescriptions[workflowRole]} El perfil organiza la interfaz; no concede permisos de cuenta.`,
            side: "bottom",
          },
        },
        {
          element: "[data-tour-login-product]",
          popover: {
            title: "Paso 2 · Producto o lote",
            description:
              "Elige el producto para filtrar o relacionar la información de trabajo. Esta selección no crea una compra ni mueve dinero.",
            side: "bottom",
          },
        },
        {
          element: "[data-tour-login-credentials]",
          popover: {
            title: "Paso 3 · Correo y contraseña",
            description:
              "Ingresa las credenciales de tu cuenta de Supabase. La wallet Stellar es independiente: nunca escribas aquí una frase semilla ni una clave privada.",
            side: "top",
          },
        },
      ],
    });
    loginTourRef.current.drive();
  }

  function notify(message: string, type: "success" | "error" | "info" = "error") {
    setMessage(message);
    setMessageType(type);
    toast[type](message);
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      let session = data.session;
      if (session?.user.is_anonymous) {
        await supabase.auth.signOut();
        session = null;
      }
      if (isMounted) {
        setAuthUserId(session && !session.user.is_anonymous ? session.user.id : null);
        setStage(session ? "workflowPreferences" : "credentials");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthUserId(session && !session.user.is_anonymous ? session.user.id : null);
        setStage("resetPassword");
        return;
      }
      if (event === "INITIAL_SESSION") {
        const accountSession = session && !session.user.is_anonymous;
        setAuthUserId(accountSession ? session.user.id : null);
        setStage(accountSession ? "workflowPreferences" : "credentials");
        return;
      }
      const accountSession = session && !session.user.is_anonymous;
      setAuthUserId(accountSession ? session.user.id : null);
      setStage(
        accountSession
          ? rolesWithDashboardLotList.includes(workflowRole)
            ? "dashboard"
            : rolesWithLotPrefixLookup.includes(workflowRole)
              ? "lotLookup"
              : "dashboard"
          : "credentials",
      );
      if (event === "SIGNED_IN" && accountSession) {
        toast.success("Acceso confirmado.");
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [workflowRole]);

  function continueAfterAuthentication() {
    void saveProductNotificationPreference(selectedProduct);
    setStage(
      rolesWithDashboardLotList.includes(workflowRole) ||
        !rolesWithLotPrefixLookup.includes(workflowRole)
        ? "dashboard"
        : "lotLookup",
    );
  }

  function selectWorkflowRole(value: string) {
    const selectedRole = value as DemoRole;
    setWorkflowRole(selectedRole);
    window.dispatchEvent(
      new CustomEvent(workflowRoleEventName, { detail: { role: selectedRole } }),
    );
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("Configura Supabase para habilitar el acceso al dashboard.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signUp") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          notify("No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.");
        } else if (data.session) {
          setAuthUserId(data.session.user.id);
          continueAfterAuthentication();
          toast.success("Cuenta creada. Ya puedes usar el dashboard.");
        } else {
          notify(
            "Supabase no inició sesión. Desactiva Confirm Email en Authentication > Sign In / Providers > Email para permitir acceso sin código.",
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          notify("No se pudo iniciar sesión. Revisa el correo y la contraseña.");
        } else {
          setAuthUserId(data.user.id);
          continueAfterAuthentication();
        }
      }
    } catch {
      notify("No se pudo conectar con el servicio de acceso. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendPasswordRecovery() {
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("Configura Supabase para recuperar la contraseña.");
      return;
    }
    if (!email.trim()) {
      notify("Escribe tu correo electrónico para recibir el enlace de recuperación.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/registros`,
      });
      if (error) {
        notify("No se pudo solicitar la recuperación. Revisa el correo e inténtalo de nuevo.");
      } else {
        notify(
          "Si existe una cuenta con ese correo, recibirá un enlace para cambiar la contraseña.",
          "success",
        );
      }
    } catch {
      notify("No se pudo conectar con el servicio de recuperación. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateRecoveredPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      notify("No se pudo conectar con Supabase para cambiar la contraseña.");
      return;
    }
    if (password.length < 15 || password.length > 64) {
      notify("La contraseña debe tener entre 15 y 64 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      notify("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        notify("No se pudo actualizar la contraseña. Solicita un enlace nuevo e inténtalo.");
      } else {
        setPassword("");
        setConfirmPassword("");
        continueAfterAuthentication();
        toast.success("Contraseña actualizada.");
      }
    } catch {
      notify("No se pudo conectar con Supabase. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    try {
      const { error } = (await getSupabaseBrowserClient()?.auth.signOut()) ?? { error: null };
      if (error) {
        notify("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        return;
      }
      setAuthUserId(null);
      setStage("credentials");
      setPassword("");
      setCandidates([]);
      setSelectedLotId("");
      setLotPrefix("");
      toast.success("Sesión cerrada.");
    } catch {
      notify("No se pudo cerrar la sesión. Comprueba tu conexión e inténtalo de nuevo.");
    }
  }

  async function searchLotPrefix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const normalizedPrefix = lotPrefix.trim().toLowerCase();
    if (!/^[0-9a-f]{8}[0-9a-f-]{0,28}$/.test(normalizedPrefix)) {
      notify("Escribe al menos los primeros 8 caracteres hexadecimales del ID del QR.");
      return;
    }

    setIsSearchingLots(true);
    setCandidates([]);
    setSelectedLotId("");
    try {
      const result =
        workflowRole === "consumer"
          ? await findPublicLotRecordsByPrefix(normalizedPrefix, selectedProduct)
          : await findOwnedLotRecordsByPrefix(normalizedPrefix);
      if (!result.success) {
        notify("No se pudo consultar el lote. Verifica la conexión e inténtalo de nuevo.");
        return;
      }

      const productMatches = result.records.filter((record) => record.product === selectedProduct);
      if ("hasMore" in result && result.hasMore) {
        notify(
          "Hay muchas coincidencias. Escribe más caracteres del ID para precisar la búsqueda.",
        );
        return;
      }
      if (productMatches.length === 0) {
        notify(
          "No encontramos un lote de ese producto con ese prefijo y los permisos de esta cuenta.",
        );
        return;
      }

      setCandidates(productMatches);
      setSelectedLotId(productMatches.length === 1 ? productMatches[0].id : "");
      if (productMatches.length > 1) {
        notify(
          "El prefijo coincide con varios lotes. Selecciona el correcto antes de continuar.",
          "info",
        );
      }
    } catch {
      notify("No se pudo consultar el lote. Inténtalo de nuevo.");
    } finally {
      setIsSearchingLots(false);
    }
  }

  function continueToSelectedLot() {
    if (!selectedLotId) {
      notify("Selecciona un lote para continuar.");
      return;
    }
    if (workflowRole === "consumer") {
      router.push(`/lote/${encodeURIComponent(selectedLotId)}`);
      return;
    }
    setMessage("");
    setStage("dashboard");
  }

  if (stage === "dashboard" && authUserId && !workspacePreferencesDraft.isReady) {
    return (
      <p className="mx-auto max-w-xl py-12 text-sm text-gray-700" role="status" aria-live="polite">
        Restaurando el perfil y producto de esta cuenta…
      </p>
    );
  }

  if (stage === "dashboard") {
    return (
      <StellarWalletProvider key={authUserId ?? "authenticated-session"}>
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="mb-1 text-[11px] font-bold text-accent">ÁREA DE TRABAJO</p>
              <p className="mb-0 text-sm text-gray-700">Sesión autenticada con Supabase</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="min-h-10 rounded-md border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-offset-2"
            >
              Cerrar sesión
            </button>
          </div>
          <RecordsPanel
            initialRole={workflowRole}
            initialProduct={selectedProduct}
            draftUserId={authUserId}
            selectedLotId={
              rolesWithDashboardLotList.includes(workflowRole) ? undefined : selectedLotId
            }
          />
        </>
      </StellarWalletProvider>
    );
  }

  if (stage === "workflowPreferences") {
    return (
      <section className="mx-auto max-w-xl border border-line bg-white p-5 shadow-[0_24px_80px_-48px_rgba(25,51,50,0.5)] sm:p-8">
        <p className="mb-2 text-[11px] font-bold text-accent">ÁREA DE TRABAJO</p>
        <h1 className="mb-2 font-display text-2xl font-medium text-ink">
          Elige tu perfil de trabajo
        </h1>
        <p className="mb-5 text-sm leading-6 text-gray-700">
          Esta selección cambia las herramientas disponibles, pero no modifica los permisos de tu
          cuenta.
        </p>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="session-workflow-profile" className="text-sm font-semibold text-ink">
              Perfil de trabajo
            </label>
            <select
              id="session-workflow-profile"
              value={workflowRole}
              onChange={(event) => selectWorkflowRole(event.target.value)}
              className="min-h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-sm text-ink"
            >
              {demoRoles.map((demoRole) => (
                <option key={demoRole} value={demoRole}>
                  {roleLabels[demoRole]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="session-workflow-product" className="text-sm font-semibold text-ink">
              Producto o lote
            </label>
            <select
              id="session-workflow-product"
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="min-h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-sm text-ink"
            >
              {productOptions.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={signOut}
              className="min-h-11 rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-paper"
            >
              Cerrar sesión
            </button>
            <button
              type="button"
              onClick={continueAfterAuthentication}
              className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746]"
            >
              Continuar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (stage === "lotLookup") {
    return (
      <section className="mx-auto max-w-2xl border border-line bg-white p-5 shadow-[0_24px_80px_-48px_rgba(25,51,50,0.5)] sm:p-8">
        <p className="mb-2 text-[11px] font-bold text-accent">SELECCIÓN DE LOTE</p>
        <h1 className="mb-2 font-display text-2xl font-medium text-ink">Identifica el lote</h1>
        <p className="mb-5 text-sm leading-6 text-gray-700">
          Perfil: {roleLabels[workflowRole]} · Producto: {selectedProduct}. El prefijo sirve para
          buscar, no para comprobar identidad ni permisos.
        </p>
        <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={searchLotPrefix}>
          <div className="grid min-w-0 gap-1.5">
            <label htmlFor="lot-qr-prefix" className="text-sm font-semibold text-ink">
              Primeros 8 caracteres del ID del QR
            </label>
            <input
              id="lot-qr-prefix"
              required
              minLength={8}
              maxLength={36}
              pattern="[0-9a-fA-F]{8}[0-9a-fA-F-]{0,28}"
              autoComplete="off"
              spellCheck={false}
              disabled={!lotLookupDraft.isReady}
              value={lotPrefix}
              onChange={(event) => setLotPrefix(event.target.value)}
              className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 font-mono text-sm text-ink disabled:opacity-60"
              aria-describedby="lot-prefix-help"
            />
            <p id="lot-prefix-help" className="mb-0 text-xs leading-5 text-gray-700">
              Usa los primeros 8 caracteres del ID del QR. Puedes añadir más si aparecen varias
              coincidencias.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSearchingLots || !lotLookupDraft.isReady}
            className="min-h-11 self-end rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-wait disabled:opacity-60"
          >
            {!lotLookupDraft.isReady
              ? "Restaurando…"
              : isSearchingLots
                ? "Buscando…"
                : "Buscar lote"}
          </button>
        </form>
        {candidates.length > 0 && (
          <fieldset className="mt-5 grid gap-2">
            <legend className="mb-2 text-sm font-semibold text-ink">Coincidencias</legend>
            {candidates.map((record) => (
              <label
                key={record.id}
                className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border border-line p-3 text-sm hover:bg-paper"
              >
                <input
                  type="radio"
                  name="matched-lot"
                  value={record.id}
                  checked={selectedLotId === record.id}
                  onChange={() => setSelectedLotId(record.id)}
                  className="mt-1 size-4 accent-accent"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">
                    {record.product} · {record.origin}
                  </span>
                  <span className="mt-1 block break-all font-mono text-xs text-gray-700">
                    {record.id}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {message && (
          <p
            className={`mt-4 mb-0 text-sm ${messageType === "info" ? "text-gray-700" : "text-red-800"}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={signOut}
            className="min-h-10 rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-paper"
          >
            Cerrar sesión
          </button>
          <button
            type="button"
            disabled={!selectedLotId || isSearchingLots}
            onClick={continueToSelectedLot}
            className="min-h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {workflowRole === "consumer" ? "Consultar lote" : "Continuar al perfil"}
          </button>
        </div>
      </section>
    );
  }

  if (stage === "resetPassword") {
    return (
      <section className="mx-auto max-w-xl border border-line bg-white p-6 shadow-[0_24px_80px_-48px_rgba(25,51,50,0.5)] sm:p-10">
        <p className="mb-2 text-[11px] font-bold text-accent">RECUPERAR ACCESO</p>
        <h1 className="mb-2 font-display text-2xl font-medium text-ink">Nueva contraseña</h1>
        <p className="mb-6 text-sm leading-6 text-gray-700">
          Elige una contraseña de 15 a 64 caracteres. Puedes usar una frase.
        </p>
        <form className="grid gap-4" onSubmit={updateRecoveredPassword}>
          <div className="grid gap-1.5">
            <label htmlFor="new-password" className="text-sm font-semibold text-ink">
              Contraseña nueva
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={15}
              maxLength={64}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby="password-guidance"
              className="min-h-11 rounded-md border border-line bg-white px-3 text-base text-ink sm:text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="confirm-new-password" className="text-sm font-semibold text-ink">
              Confirmar contraseña nueva
            </label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              minLength={15}
              maxLength={64}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-h-11 rounded-md border border-line bg-white px-3 text-base text-ink sm:text-sm"
            />
          </div>
          <p id="password-guidance" className="mb-0 text-xs leading-5 text-gray-700">
            Usa entre 15 y 64 caracteres; evita reutilizar contraseñas de otros servicios.
          </p>
          {message && (
            <p className="mb-0 text-sm text-red-800" role="alert">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !hasSupabaseConfig}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Actualizando…" : "Guardar nueva contraseña"}
            {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>
      </section>
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
          <>
            <p className="mb-2 text-[11px] font-bold text-accent">ACCESO A REGISTROS</p>
            <h2 className="mb-2 font-display text-2xl font-medium text-ink">
              {mode === "signUp" ? "Crear cuenta" : "Iniciar sesión"}
            </h2>
            <p className="mb-6 text-sm leading-6 text-gray-700">
              {mode === "signUp"
                ? "Crea una cuenta con tu correo y contraseña para guardar y consultar tus lotes."
                : "Ingresa tu correo y contraseña para acceder a tus lotes."}
            </p>
            <button
              type="button"
              onClick={startLoginGuide}
              className="mb-5 min-h-10 rounded-md border border-accent px-3 text-sm font-semibold text-accent underline-offset-2 hover:bg-accent-soft hover:underline"
            >
              Ver guía de acceso paso a paso
            </button>
            <form className="grid gap-4" onSubmit={submitCredentials}>
              <div className="grid gap-1.5" data-tour-login-profile>
                <label htmlFor="workflow-profile" className="text-sm font-semibold text-ink">
                  Paso 1 · Perfil de trabajo
                </label>
                <select
                  id="workflow-profile"
                  required
                  aria-describedby="workflow-profile-help"
                  value={workflowRole}
                  onChange={(event) => selectWorkflowRole(event.target.value)}
                  className="min-h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-sm text-ink"
                >
                  {demoRoles.map((demoRole) => (
                    <option key={demoRole} value={demoRole}>
                      {roleLabels[demoRole]}
                    </option>
                  ))}
                </select>
                <p id="workflow-profile-help" className="mb-0 text-xs leading-5 text-gray-700">
                  {roleDescriptions[workflowRole]} Esta elección cambia las herramientas, no los
                  permisos de tu cuenta.
                </p>
              </div>
              <div className="grid gap-1.5" data-tour-login-product>
                <label htmlFor="workflow-product" className="text-sm font-semibold text-ink">
                  Paso 2 · Producto o lote
                </label>
                <select
                  id="workflow-product"
                  required
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(event.target.value)}
                  className="min-h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-sm text-ink"
                >
                  <option value="">Selecciona un producto</option>
                  {productOptions.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
                <p className="mb-0 text-xs leading-5 text-gray-700">
                  Elige el producto con el que quieres trabajar después de entrar.
                </p>
              </div>
              <div className="grid gap-4" data-tour-login-credentials>
                <p className="mb-0 text-sm font-semibold text-ink">Paso 3 · Correo y contraseña</p>
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
                      minLength={mode === "signUp" ? 15 : undefined}
                      maxLength={64}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="min-h-11 w-full rounded-md border border-line bg-white py-2 pl-10 pr-3 text-sm text-ink"
                      placeholder="Contraseña"
                      aria-describedby={mode === "signUp" ? "password-guidance" : undefined}
                    />
                  </div>
                  {mode === "signUp" && (
                    <p id="password-guidance" className="mb-0 text-xs leading-5 text-gray-700">
                      Usa entre 15 y 64 caracteres; puedes usar una frase.
                    </p>
                  )}
                </div>
              </div>
              {!hasSupabaseConfig && (
                <p
                  className="mb-0 border-l-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                  role="alert"
                >
                  Falta configurar <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                </p>
              )}
              {message && (
                <p
                  className={`mb-0 text-sm ${messageType === "success" ? "text-green-800" : messageType === "info" ? "text-gray-700" : "text-red-800"}`}
                  role={messageType === "error" ? "alert" : "status"}
                >
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !hasSupabaseConfig}
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
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
              <p className="mb-0 text-gray-700">
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
              {mode === "signIn" && (
                <button
                  type="button"
                  disabled={isSubmitting || !hasSupabaseConfig}
                  onClick={() => void sendPasswordRecovery()}
                  className="min-h-10 font-semibold text-accent underline-offset-4 hover:underline disabled:opacity-60"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          </>
        </div>
      </div>
    </section>
  );
}
