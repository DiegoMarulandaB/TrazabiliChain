"use client";

import { driver } from "driver.js";
import { useEffect, useRef } from "react";
import type { DemoRole } from "@/lib/lots/lot-storage";
import { stellarNetwork } from "@/lib/stellar/network";

type GuideStep = {
  element: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
};

const walletDescriptions: Record<DemoRole, string> = {
  producer:
    "Pulsa Conectar wallet para identificar la red de tu wallet. La wallet solo se necesita para anclar una huella; crear y guardar el lote en Supabase no requiere firma de blockchain.",
  supplyActor:
    "Pulsa Conectar wallet si vas a anclar un evento. La red se detecta al conectar. Guardar el evento y su evidencia no requiere firma de blockchain.",
  certifier:
    "Pulsa Conectar wallet si vas a anclar una huella. La red se detecta al conectar. Guardar los datos del certificado y su archivo no requiere firma de blockchain.",
  organizationAdmin: `Pulsa Conectar wallet con la cuenta administradora del contrato para autorizar actores o anclar. La red se detecta al conectar y debe coincidir con ${stellarNetwork.label}.`,
  b2bBuyer: `Pulsa Conectar wallet para preparar y firmar el escrow de Testnet. La red se detecta al conectar; revisa que wallet, activo y direcciones correspondan a ${stellarNetwork.label}.`,
  auditor:
    "La wallet no es necesaria para consultar ni escribir observaciones privadas. El perfil Auditor no puede escribir en el contrato.",
  consumer:
    "No necesitas wallet para escanear un QR o consultar un lote. La wallet solo firma operaciones de blockchain.",
};

const roleFieldSteps: Record<DemoRole, GuideStep[]> = {
  producer: [
    {
      element: "#product",
      title: "Producto",
      description:
        "Muestra el producto elegido al entrar al área de trabajo. El lote quedará clasificado con este producto.",
    },
    {
      element: "#crop-variety",
      title: "Variedad",
      description:
        "Elige la variedad del cultivo. Es un dato declarado por quien registra el lote.",
    },
    {
      element: "#crop-presentation",
      title: "Presentación",
      description: "Indica cómo se presenta o procesa el producto registrado.",
    },
    {
      element: "#crop-harvest",
      title: "Cosecha",
      description: "Selecciona el año de cosecha del producto.",
    },
    {
      element: "#crop-quality",
      title: "Calidad declarada",
      description:
        "Registra la calidad reportada. La aplicación no la certifica ni la verifica por sí misma.",
    },
    {
      element: "#crop-price",
      title: "Valor del producto",
      description:
        "El valor es opcional. Usa el formato decimal indicado y selecciona la divisa correspondiente.",
    },
    {
      element: "#crop-currency",
      title: "Divisa",
      description: "Selecciona la moneda usada para expresar el valor opcional del producto.",
    },
    {
      element: "#crop-quantity",
      title: "Cantidad",
      description: "Ingresa el volumen o peso del producto con un valor mayor que cero.",
    },
    {
      element: "#crop-unit",
      title: "Unidad de venta",
      description: "Selecciona la unidad que corresponde a la cantidad registrada.",
    },
    {
      element: "#other-product-details",
      title: "Otros datos",
      description:
        "Añade información complementaria del producto. No incluyas datos personales o secretos.",
    },
    {
      element: 'label[for="product-photo"]',
      title: "Imagen del producto",
      description:
        "La foto es opcional. Se admite JPEG, PNG o WebP de hasta 2 MB; solo será pública si publicas la ficha.",
    },
    {
      element: "#origin",
      title: "Finca o lugar de origen",
      description:
        "Escribe el nombre del lugar donde se origina el lote. Es un dato declarado, no una geolocalización verificada.",
    },
    {
      element: "#origin-country",
      title: "País",
      description:
        "Elige el país o territorio de origen; esta selección filtra las regiones y ciudades disponibles.",
    },
    {
      element: "#origin-department",
      title: "Región",
      description: "Selecciona o escribe el departamento, estado o región de origen.",
    },
    {
      element: "#origin-city",
      title: "Ciudad o municipio",
      description:
        "Selecciona o escribe la ciudad o municipio. Puedes ingresar una localidad que no aparezca en la lista.",
    },
    {
      element: "#origin-date",
      title: "Fecha del lote",
      description:
        "Registra la fecha asociada al lote. La aplicación usa la fecha indicada por quien lo registra.",
    },
    {
      element: "#organization",
      title: "Organización responsable",
      description:
        "Escribe la organización que declara hacerse responsable del registro del lote. No es una afiliación verificada ni concede permisos.",
    },
    {
      element: "#publish-lot",
      title: "Publicar ficha QR",
      description:
        "Al activar esta opción autorizas que los campos públicos permitidos aparezcan en la ficha QR. No publiques información sensible.",
    },
  ].map((step) => ({ ...step, side: "bottom" as const })),
  supplyActor: [
    {
      element: "#event-lot",
      title: "Lote",
      description:
        "Selecciona el lote al que pertenece el evento. Comprueba el ID antes de guardar.",
    },
    {
      element: "#event-type",
      title: "Tipo de evento",
      description: "Clasifica el hito, por ejemplo recepción, despacho, transformación o entrega.",
    },
    {
      element: "#event-time",
      title: "Fecha y hora",
      description: "Indica cuándo ocurrió el evento, no cuándo lo estás registrando.",
    },
    {
      element: "#event-details",
      title: "Detalle",
      description:
        "Describe brevemente qué ocurrió. Evita incluir datos personales o información sensible.",
    },
    {
      element: 'label[for="event-evidence"]',
      title: "Evidencia",
      description:
        "Adjunta opcionalmente un PDF o imagen de hasta 10 MB. El archivo permanece en este navegador; se registra su huella.",
    },
    {
      element: "#event-edit-actor",
      title: "Responsable del evento",
      description:
        "Al editar, puedes corregir el nombre declarado de quien reporta el evento. No se comprueba su identidad.",
    },
    {
      element: "#event-edit-organization",
      title: "Organización del evento",
      description:
        "Al editar, puedes corregir la organización declarada asociada a este evento; no se verifica pertenencia.",
    },
    {
      element: "#event-edit-reason",
      title: "Motivo del cambio",
      description:
        "Explica por qué modificas el evento; el motivo queda en su historial de auditoría.",
    },
    {
      element: "#event-edit-password",
      title: "Confirmar edición",
      description:
        "Ingresa la contraseña de tu cuenta Supabase para confirmar la edición. Nunca ingreses aquí una clave de wallet.",
    },
  ].map((step) => ({ ...step, side: "bottom" as const })),
  certifier: [
    {
      element: "#certificate-lot",
      title: "Lote",
      description: "Selecciona el lote asociado al certificado.",
    },
    {
      element: "#certificate-name",
      title: "Certificado",
      description: "Escribe el nombre del certificado o esquema que se declara.",
    },
    {
      element: "#certificate-issuer",
      title: "Entidad emisora",
      description:
        "Escribe el emisor declarado. La aplicación no verifica su identidad ni la validez del documento.",
    },
    {
      element: "#certificate-number",
      title: "Número",
      description: "Registra el código o número que aparece en el documento.",
    },
    {
      element: 'label[for="certificate-file"]',
      title: "Archivo de evidencia",
      description:
        "Adjunta el PDF o imagen del certificado. El archivo es obligatorio y queda en este navegador; se registra su huella.",
    },
    {
      element: "#certificate-issued",
      title: "Fecha de emisión",
      description: "Selecciona la fecha de emisión indicada en el documento.",
    },
    {
      element: "#certificate-valid-until",
      title: "Vigencia",
      description:
        "Indica la fecha de vencimiento si el documento la especifica. La fecha es declarada, no verificada.",
    },
    {
      element: "#certificate-edit-reason",
      title: "Motivo del cambio",
      description:
        "Explica por qué modificas el certificado; el motivo queda en el historial de auditoría.",
    },
    {
      element: "#certificate-edit-password",
      title: "Confirmar edición",
      description:
        "Ingresa la contraseña de tu cuenta Supabase para confirmar la edición. Nunca ingreses aquí una clave de wallet.",
    },
  ].map((step) => ({ ...step, side: "bottom" as const })),
  organizationAdmin: [
    {
      element: "#member-name",
      title: "Nombre del miembro",
      description:
        "Escribe el nombre que se mostrará en el directorio local de demostración; no verifica la identidad.",
    },
    {
      element: "#member-organization",
      title: "Organización del miembro",
      description:
        "Asocia el miembro a una organización declarada. El directorio no verifica pertenencia ni concede permisos.",
    },
    {
      element: "#member-role",
      title: "Perfil asignado",
      description:
        "Elige el perfil de trabajo que se mostrará en el directorio. Es informativo; no cambia permisos de Supabase ni de Stellar.",
    },
    {
      element: "#traceability-actor-address",
      title: "Wallet del actor",
      description:
        "Ingresa la dirección pública del actor que deseas autorizar o revocar. No ingreses una clave privada; la wallet administradora firma la acción.",
    },
  ].map((step) => ({ ...step, side: "bottom" as const })),
  b2bBuyer: [
    {
      element: "#buyer-search",
      title: "Buscar lotes",
      description: "Filtra los lotes disponibles por ID del QR, producto, origen u organización.",
    },
    {
      element: "#buyer-valid-only",
      title: "Filtrar por vigencia declarada",
      description:
        "Limita los resultados a certificados cuya fecha declarada de vigencia aún no pasó. No valida la autenticidad del certificado.",
    },
    {
      element: "#escrow-lot",
      title: "Lote del escrow",
      description: "Elige el lote relacionado con el acuerdo B2B.",
    },
    {
      element: "#escrow-amount",
      title: "Importe",
      description:
        "Ingresa el importe acordado en USDC. Revisa el valor antes de solicitar una firma.",
    },
    {
      element: "#escrow-asset",
      title: "Contrato del activo",
      description:
        "Ingresa la dirección del contrato SAC USDC de Testnet. Verifica que pertenezca a la red mostrada.",
    },
    {
      element: "#escrow-admin",
      title: "Administrador del escrow",
      description:
        "Dirección que administra la configuración del escrow; debe ser distinta de los demás roles.",
    },
    {
      element: "#escrow-approver",
      title: "Aprobador",
      description: "Wallet del comprador autorizada para aprobar el hito según el acuerdo.",
    },
    {
      element: "#escrow-serviceProvider",
      title: "Proveedor",
      description: "Wallet de la parte que prestará el servicio o entregará el producto.",
    },
    {
      element: "#escrow-platform",
      title: "Plataforma",
      description:
        "Wallet de la plataforma configurada para este escrow. Confirma su dirección con la contraparte.",
    },
    {
      element: "#escrow-disputeResolver",
      title: "Resolvedor de disputas",
      description:
        "Wallet designada para intervenir en una disputa; debe ser distinta de los otros roles.",
    },
    {
      element: "#escrow-receiver",
      title: "Receptor",
      description: "Wallet que recibirá los fondos cuando se cumplan las condiciones del escrow.",
    },
  ].map((step) => ({ ...step, side: "bottom" as const })),
  auditor: [
    {
      element: "[id$='-text']",
      title: "Observación",
      description:
        "Escribe una nota privada de revisión. No modifica los eventos, certificados ni datos fuente del lote.",
    },
  ],
  consumer: [
    {
      element: "#public-lot-id",
      title: "Identificador o URL",
      description:
        "Escribe el ID del lote o la URL del QR para abrir su ficha pública. Solo se aceptan enlaces del sitio configurado.",
    },
  ],
};

export function RoleGuide({ role }: { role: DemoRole }) {
  const tourRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    return () => tourRef.current?.destroy();
  }, []);

  function startGuide() {
    tourRef.current?.destroy();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps: GuideStep[] = [
      {
        element: "[data-tour-wallet]",
        title: "Paso 1 · Conectar wallet",
        description: walletDescriptions[role],
        side: "bottom" as const,
      },
      {
        element: "#demo-actor",
        title: "Actor declarado",
        description:
          "Es el nombre que la persona escribe para atribuir un registro. No comprueba identidad, empleo, firma ni autorización; no es una cuenta verificada.",
        side: "bottom" as const,
      },
      {
        element: "#demo-organization",
        title: "Organización declarada",
        description:
          "Es el nombre de la organización que la persona informa representar. El texto no verifica que pertenezca a ella ni concede acceso a sus datos.",
        side: "bottom" as const,
      },
      ...roleFieldSteps[role],
    ].filter((step) => document.querySelector(step.element));

    tourRef.current = driver({
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
      steps: steps.map(({ element, title, description, side }) => ({
        element,
        popover: { title, description, side: side ?? "bottom" },
      })),
    });
    tourRef.current.drive();
  }

  return (
    <button
      type="button"
      onClick={startGuide}
      className="min-h-11 rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={`Abrir guía paso a paso del perfil ${role}`}
    >
      Ver guía paso a paso
    </button>
  );
}
