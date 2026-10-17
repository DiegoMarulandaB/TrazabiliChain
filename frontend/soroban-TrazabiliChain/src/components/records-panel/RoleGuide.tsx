"use client";

import { driver } from "driver.js";
import { useEffect } from "react";
import type { DemoRole } from "@/lib/lots/lot-storage";

const roleSteps: Record<DemoRole, { wallet: string; work: string }> = {
  producer: {
    wallet:
      "Conecta tu wallet Stellar Testnet antes de anclar una huella. Crear y guardar el lote en Supabase no requiere firma de blockchain.",
    work: "Completa características y origen del café orgánico, revisa los datos y confirma el registro. Después puedes publicar el QR y anclar su huella; cada acción explica si requiere firma.",
  },
  supplyActor: {
    wallet:
      "Conecta una wallet Stellar Testnet si vas a anclar el evento. Guardar el evento y su evidencia en el registro no requiere firma on-chain.",
    work: "Selecciona el lote, indica el tipo de hito, cuándo ocurrió y qué pasó. La evidencia es opcional. Revisa y confirma antes de guardar.",
  },
  certifier: {
    wallet:
      "Conecta una wallet Stellar Testnet si vas a anclar la huella. El registro del certificado y su archivo no requieren firma on-chain.",
    work: "Asocia el certificado con un lote, completa emisor, número y vigencia, y adjunta el archivo requerido. Comprueba los datos antes de confirmar.",
  },
  organizationAdmin: {
    wallet:
      "Conecta la wallet administradora del contrato para autorizar actores y anclar lotes. Solo la dirección configurada al desplegar puede aprobar wallets; Freighter solicitará firma en Testnet.",
    work: "Busca el lote con los primeros 8 caracteres de su ID. Puedes consultar su hash y anclar la versión actual. En Acceso de escritura, autoriza la dirección pública del actor, no la dirección administradora. El directorio local solo es una demo.",
  },
  b2bBuyer: {
    wallet:
      "Conecta una wallet Stellar Testnet para preparar, firmar y enviar el escrow de prueba. No uses fondos ni claves de Mainnet.",
    work: "Elige el lote, ingresa el monto USDC de prueba, el contrato del activo y las wallets de cada rol. Simula primero; revisa el contrato y la tarifa estimada. Solo al firmar se envía la operación a Testnet.",
  },
  auditor: {
    wallet:
      "Consultar el historial y el estado del anclaje no requiere wallet. El perfil Auditor no puede escribir en el contrato.",
    work: "Filtra los lotes y contrasta fechas, actores, eventos y certificados. Distingue los datos declarados de las huellas: una huella detecta cambios, pero no verifica por sí sola el origen físico.",
  },
  consumer: {
    wallet:
      "No necesitas conectar una wallet para consultar un lote. La wallet solo sirve para firmar operaciones de blockchain, no para escanear un QR.",
    work: "Escanea el QR con permiso de cámara o escribe su URL/identificador. Revisa la ficha pública y recuerda que muestra información compartida por la organización, no una certificación física automática.",
  },
};

export function RoleGuide({ role }: { role: DemoRole }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tour = driver({
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
          element: "[data-tour-wallet]",
          popover: {
            title: "Paso 1 · Wallet de Stellar",
            description: roleSteps[role].wallet,
            side: "bottom",
          },
        },
        {
          element: "[data-tour-profile]",
          popover: {
            title: "Paso 2 · Revisa tu contexto",
            description:
              "Confirma el perfil y el producto elegidos. El nombre del actor y la organización son datos declarados para el registro; no verifican identidad ni conceden permisos.",
            side: "bottom",
          },
        },
        {
          element: "[data-tour-work]",
          popover: {
            title: `Paso 3 · ${role === "organizationAdmin" ? "Gestiona el acceso" : "Completa tu tarea"}`,
            description: roleSteps[role].work,
            side: "top",
          },
        },
      ],
    });

    tour.drive();
    return () => tour.destroy();
  }, [role]);

  return null;
}
