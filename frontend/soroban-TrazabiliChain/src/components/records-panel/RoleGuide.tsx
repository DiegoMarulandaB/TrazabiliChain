"use client";

import { useState } from "react";
import { roleLabels } from "@/components/organization-members/OrganizationMembers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { DemoRole } from "@/lib/lots/lot-storage";

const roleDescriptions: Record<DemoRole, string> = {
  producer:
    "Producto: café, cacao o algodón orgánico.\nVariedad, cosecha y calidad: opciones según el producto.\nValor, divisa y unidad: precio declarado por kg, tonelada o libra.\nOtros datos: información adicional escrita por ti.\nFinca, ciudad, región y país: lugar de origen.\nFecha del lote y organización responsable: identifica cuándo y quién registra.\nImagen: fotografía opcional del producto, privada para la cuenta.",
  supplyActor:
    "Lote: registro al que se añadirá el evento.\nTipo de evento: recepción, despacho, transformación, entrega, inspección u otro.\nFecha y hora: momento en que ocurrió.\nResponsable: actor y organización del perfil activo.\nDetalle: descripción del hito.\nEvidencia: archivo opcional PDF o imagen.",
  certifier:
    "Lote asociado: registro que respalda el documento.\nNombre y entidad emisora: datos declarados del certificado.\nCódigo o número: identificador del documento.\nArchivo: evidencia PDF o imagen obligatoria.\nFecha de emisión y vigencia: la fecha final es opcional.",
  organizationAdmin:
    "Nombre del miembro: persona agregada al directorio local.\nOrganización: entidad a la que pertenece.\nRol asignado: perfil de demostración.\nWallet Stellar del actor: dirección que se autoriza o revoca en el contrato; requiere firma de la wallet administradora.",
  b2bBuyer:
    "Lote asociado: producto de la compra.\nMonto y contrato del activo: valor USDC y activo de Testnet.\nAdministrador, aprobador y proveedor: wallets participantes.\nPlataforma, resolvedor de disputas y receptor: wallets de los demás roles.\nPreparar y simular: revisa la simulación antes de solicitar la firma.",
  auditor:
    "Búsqueda: reduce los resultados por lote o texto.\nLote: consulta producto, origen y responsable.\nEventos: revisa tipo, fecha, actor y detalle.\nCertificados: inspecciona emisor, vigencia y huella del archivo.",
  consumer:
    "Cámara: al aceptar el aviso, el navegador solicitará permiso para escanear.\nIdentificador o URL del QR: alternativa manual para encontrar la ficha pública.\nConsultar: abre los datos compartidos del lote.",
};

const formDescriptions: Record<DemoRole, string> = {
  producer:
    "Elige el producto, completa sus datos de cosecha y origen, y crea el registro del lote.",
  supplyActor: "Selecciona el lote, indica el evento, su fecha y hora, y describe qué ocurrió.",
  certifier:
    "Elige un lote y completa los datos del certificado junto con su archivo de evidencia.",
  organizationAdmin:
    "Agrega miembros y asigna un rol de demostración; puedes gestionar acceso Stellar aparte.",
  b2bBuyer:
    "Consulta los lotes y completa los roles y montos antes de simular un escrow en Testnet.",
  auditor: "Filtra y revisa las declaraciones de lotes, los eventos y sus certificados asociados.",
  consumer: "Escribe el identificador o permite el acceso a la cámara para escanear el QR.",
};

export function RoleGuide({ role }: { role: DemoRole }) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);

  return (
    <ConfirmDialog
      open={open}
      title={step === 0 ? `Paso 1 · ${roleLabels[role]}` : `Paso 2 · ${roleLabels[role]}`}
      description={step === 0 ? roleDescriptions[role] : formDescriptions[role]}
      confirmLabel={step === 0 ? "Siguiente" : "Listo"}
      backLabel={step === 1 ? "Atrás" : undefined}
      onCancel={() => setOpen(false)}
      onBack={() => setStep(0)}
      onConfirm={() => {
        if (step === 0) {
          setStep(1);
        } else {
          setOpen(false);
        }
      }}
    />
  );
}
