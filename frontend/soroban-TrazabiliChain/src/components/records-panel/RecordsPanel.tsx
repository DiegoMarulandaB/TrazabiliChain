"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LotSharing } from "@/components/lot-sharing/LotSharing";
import { LotCharacteristics } from "@/components/lot-characteristics/LotCharacteristics";
import { EventForm } from "@/components/event-form/EventForm";
import { CertificateForm } from "@/components/certificate-form/CertificateForm";
import { TrustlessWorkEscrow } from "@/components/escrow/TrustlessWorkEscrow";
import {
  OrganizationMembers,
  roleLabels,
} from "@/components/organization-members/OrganizationMembers";
import { TraceabilityActorAccess } from "@/components/organization-members/TraceabilityActorAccess";
import { BuyerDashboard } from "@/components/buyer-dashboard/BuyerDashboard";
import { AuditDashboard } from "@/components/audit-dashboard/AuditDashboard";
import { ConsumerScanner } from "@/components/consumer-scanner/ConsumerScanner";
import { EvidenceFileLink } from "@/components/evidence-file/EvidenceFileLink";
import { TraceabilityAnchor } from "@/components/traceability-anchor/TraceabilityAnchor";
import { BorderBeamFrame } from "@/components/ui/motion/BorderBeamFrame";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormFieldError } from "@/components/ui/FormFieldError";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { LotManagement } from "@/components/records-panel/LotManagement";
import { RoleGuide } from "@/components/records-panel/RoleGuide";
import { countryOptions } from "@/lib/lots/country-options";
import {
  loadLotRecords,
  saveLotRecord,
  updateLotRecord,
  useLotRecords,
  type DemoRole,
  type LotRecord,
} from "@/lib/lots/lot-storage";
import { formatLotCharacteristics } from "@/lib/lots/lot-characteristics";

gsap.registerPlugin(useGSAP);

type LotForm = Omit<
  LotRecord,
  "id" | "createdAt" | "events" | "certificates" | "createdBy" | "createdByRole"
>;

const initialForm: LotForm = {
  product: "",
  characteristics: "",
  origin: "",
  originDate: "",
  organization: "",
  isPublic: false,
};

const cropVarieties: Record<string, string[]> = {
  "Café orgánico": ["Arábica", "Bourbon", "Castillo", "Caturra", "Colombia", "Geisha", "Typica"],
  "Cacao orgánico": ["CCN-51", "Criollo", "Forastero", "Nacional", "Trinitario"],
  "Algodón orgánico": ["Gossypium barbadense", "Gossypium hirsutum", "Pima", "Tangüis"],
};

const qualityGrades = ["Especialidad", "Premium", "Primera", "Estándar", "Por clasificar"];
const productPresentations = ["Grano entero", "Molido"];
const currencies = ["COP", "USD", "EUR", "MXN", "PEN", "BRL", "GBP", "JPY", "CAD", "AUD"];

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecordsPanel({
  initialRole = "producer",
  initialProduct = "",
  selectedLotId,
}: {
  initialRole?: DemoRole;
  initialProduct?: string;
  selectedLotId?: string;
}) {
  const storedRecords = useLotRecords();
  const records = selectedLotId
    ? storedRecords.filter((record) => record.id === selectedLotId)
    : storedRecords;
  const [form, setForm] = useState<LotForm>(() => ({ ...initialForm, product: initialProduct }));
  const [variety, setVariety] = useState("");
  const [presentation, setPresentation] = useState("");
  const [harvest, setHarvest] = useState("");
  const [quality, setQuality] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [unit, setUnit] = useState("kg");
  const [otherProductDetails, setOtherProductDetails] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originDepartment, setOriginDepartment] = useState("");
  const [originCountry, setOriginCountry] = useState("CO");
  const [originRegionCode, setOriginRegionCode] = useState("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [isManualCity, setIsManualCity] = useState(false);
  const [isManualDepartment, setIsManualDepartment] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [isCreateConfirmationOpen, setIsCreateConfirmationOpen] = useState(false);
  const role = initialRole;
  const [actorName, setActorName] = useState("");
  const [activeOrganization, setActiveOrganization] = useState("");
  const [newRecordId, setNewRecordId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [storageError, setStorageError] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const recordElements = useRef<Record<string, HTMLLIElement | null>>({});
  const createFormRef = useRef<HTMLFormElement>(null);
  const createConfirmed = useRef(false);
  const eventCount = records.reduce((total, record) => total + record.events.length, 0);
  const certificateCount = records.reduce((total, record) => total + record.certificates.length, 0);
  const activeRecords = records.filter((record) => !record.isDeleted);
  const retiredRecords = records.filter((record) => record.isDeleted);

  useEffect(() => {
    let isMounted = true;
    void import("country-state-city").then(({ State }) => {
      if (!isMounted) return;
      setRegionOptions(
        State.getStatesOfCountry(originCountry).map(({ isoCode, name }) => ({
          code: isoCode,
          name,
        })),
      );
    });
    return () => {
      isMounted = false;
    };
  }, [originCountry]);

  useEffect(() => {
    let isMounted = true;
    void loadLotRecords().then((result) => {
      if (!isMounted) {
        return;
      }
      setIsLoadingRecords(false);
      setStorageError(!result.success);
      setStorageMessage(result.success ? "" : result.message);
      if (!result.success) {
        toast.error(result.message);
      } else if (result.migratedCount) {
        toast.success(`${result.migratedCount} registros anteriores migrados a Supabase.`);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-enter]",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" },
        );
      });
      return () => media.revert();
    },
    { scope: panelRef },
  );

  useGSAP(
    () => {
      if (!newRecordId) {
        return;
      }

      const recordElement = recordElements.current[newRecordId];
      if (!recordElement) {
        return;
      }

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          recordElement,
          { autoAlpha: 0, y: 16, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" },
        );
      });
      return () => media.revert();
    },
    { dependencies: [newRecordId], scope: panelRef, revertOnUpdate: true },
  );

  function updateField(field: keyof LotForm, value: string) {
    setFormError("");
    clearFieldError(field);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearFieldError(field: string) {
    setFormError("");
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateCreateForm() {
    const errors: Record<string, string> = {};
    if (!form.product.trim() || (initialProduct && form.product !== initialProduct)) {
      errors.product = "El producto debe coincidir con la selección del perfil de trabajo.";
    }
    if (!variety) errors["crop-variety"] = "Selecciona una variedad.";
    if (!presentation) errors["crop-presentation"] = "Selecciona la presentación del producto.";
    if (!harvest) errors["crop-harvest"] = "Selecciona el año de cosecha.";
    if (!quality) errors["crop-quality"] = "Selecciona la calidad del lote.";
    if (price && (!Number.isFinite(Number(price)) || Number(price) <= 0)) {
      errors["crop-price"] = "Ingresa un valor mayor que cero o deja el campo vacío.";
    }
    if (!form.origin.trim()) errors.origin = "Escribe el nombre de la finca.";
    if (!originCity.trim()) errors["origin-city"] = "Selecciona o escribe la ciudad.";
    if (!originDepartment.trim()) errors["origin-department"] = "Selecciona o escribe la región.";
    if (!originCountry) errors["origin-country"] = "Selecciona un país.";
    if (!form.originDate) errors["origin-date"] = "Selecciona la fecha del lote.";
    if (!form.organization.trim()) errors.organization = "Escribe la organización responsable.";
    if (!actorName.trim()) errors["demo-actor"] = "Escribe el nombre de quien registra.";
    if (!activeOrganization.trim()) {
      errors["demo-organization"] = "Escribe la organización del perfil.";
    }

    setFieldErrors((current) => ({
      ...Object.fromEntries(Object.entries(current).filter(([field]) => field === "product-photo")),
      ...errors,
    }));
    if (Object.keys(errors).length > 0) {
      setFormError("Completa los campos marcados antes de continuar.");
      document.getElementById(Object.keys(errors)[0])?.focus();
      return false;
    }
    setFormError("");
    return true;
  }

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "producer") {
      const message = "El perfil seleccionado no puede crear lotes en este flujo de demo.";
      setAnnouncement(message);
      toast.error(message);
      return;
    }
    if (!validateCreateForm()) {
      toast.error("Revisa los campos marcados del formulario.");
      return;
    }
    if (!createConfirmed.current) {
      setIsCreateConfirmationOpen(true);
      return;
    }
    createConfirmed.current = false;

    setIsSavingRecord(true);
    try {
      const countryName = countryOptions.find((country) => country.code === originCountry)?.name;
      const characteristics = formatLotCharacteristics({
        variety,
        presentation,
        harvest,
        quality,
        price,
        currency,
        unit,
        otherDetails: otherProductDetails,
      });
      const record: LotRecord = {
        ...form,
        product: form.product.trim(),
        characteristics,
        origin: [
          form.origin.trim(),
          originCity.trim(),
          originDepartment.trim(),
          `${countryName} (${originCountry})`,
        ].join(", "),
        organization: form.organization.trim(),
        createdBy: actorName.trim(),
        createdByRole: role,
        isPublic: form.isPublic,
        ...(photoDataUrl ? { photoDataUrl } : {}),
        id: window.crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        events: [],
        certificates: [],
      };
      if (!(await saveLotRecord(record))) {
        setStorageError(true);
        const message = "No se pudo guardar el lote en Supabase.";
        setStorageMessage(message);
        setAnnouncement(message);
        toast.error(message);
        return;
      }

      setStorageError(false);
      setStorageMessage("");
      setNewRecordId(record.id);
      setAnnouncement(`Registro de ${record.product} creado: ${formatCreatedAt(record.createdAt)}`);
      toast.success(`Lote ${record.product} registrado correctamente.`);
      setForm(initialForm);
      setVariety("");
      setPresentation("");
      setHarvest("");
      setQuality("");
      setPrice("");
      setOtherProductDetails("");
      setOriginCity("");
      setOriginDepartment("");
      setOriginCountry("CO");
      setOriginRegionCode("");
      setCityOptions([]);
      setIsManualCity(false);
      setIsManualDepartment(false);
      setPhotoDataUrl("");
      setPhotoFile(null);
      setFieldErrors({});
    } catch {
      const message = "No se pudo guardar el lote. Comprueba la conexión e inténtalo de nuevo.";
      setStorageError(true);
      setStorageMessage(message);
      setAnnouncement(message);
      toast.error(message);
    } finally {
      setIsSavingRecord(false);
    }
  }

  return (
    <section ref={panelRef} id="registro" aria-labelledby="page-title" className="scroll-mt-8">
      <div
        data-enter
        className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5"
      >
        <div>
          <p className="mb-2.5 text-[11px] font-bold text-accent">OPERACIÓN DE LOTES</p>
          <h1
            id="page-title"
            className="font-display text-[30px] font-medium text-ink sm:text-[34px]"
          >
            Panel de trazabilidad
          </h1>
        </div>
        <span className="pb-1 text-xs text-gray-700" aria-live="polite">
          {activeRecords.length} {activeRecords.length === 1 ? "lote activo" : "lotes activos"}
        </span>
      </div>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <p className="mb-0 text-sm text-gray-700">Red para pruebas: Stellar Testnet</p>
        <WalletConnect />
      </div>

      <BorderBeamFrame>
        <dl className="my-6 grid grid-cols-2 divide-x divide-y divide-line border-y border-line bg-white sm:grid-cols-4 sm:divide-y-0">
          <div className="px-3 py-4 sm:px-5 sm:py-5">
            <dd className="mb-1 font-display text-2xl font-medium text-ink sm:text-3xl">
              {activeRecords.length}
            </dd>
            <dt className="text-xs leading-4 text-gray-700 sm:text-sm">Lotes activos</dt>
          </div>
          <div className="px-3 py-4 sm:px-5 sm:py-5">
            <dd className="mb-1 font-display text-2xl font-medium text-ink sm:text-3xl">
              {eventCount}
            </dd>
            <dt className="text-xs leading-4 text-gray-700 sm:text-sm">Eventos asociados</dt>
          </div>
          <div className="px-3 py-4 sm:px-5 sm:py-5">
            <dd className="mb-1 font-display text-2xl font-medium text-ink sm:text-3xl">
              {certificateCount}
            </dd>
            <dt className="text-xs leading-4 text-gray-700 sm:text-sm">Certificados asociados</dt>
          </div>
          <div className="px-3 py-4 sm:px-5 sm:py-5">
            <dd className="mb-1 font-display text-2xl font-medium text-ink sm:text-3xl">
              {retiredRecords.length}
            </dd>
            <dt className="text-xs leading-4 text-gray-700 sm:text-sm">Lotes retirados</dt>
          </div>
        </dl>
      </BorderBeamFrame>

      <section
        aria-labelledby="demo-profile-title"
        className="my-6 grid gap-4 border border-line bg-white px-4 py-4 sm:grid-cols-2 sm:items-end sm:px-5"
      >
        <div className="sm:col-span-2">
          <h2 id="demo-profile-title" className="mb-1 text-sm font-semibold text-ink">
            Perfil de trabajo
          </h2>
          <p className="mb-0 text-xs leading-5 text-gray-700">
            El rol cambia las vistas disponibles en esta demostración; no representa permisos de
            organización.
          </p>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Perfil seleccionado</span>
          <p className="mb-0 min-h-10 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink">
            {roleLabels[role]}
          </p>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Producto seleccionado</span>
          <p className="mb-0 min-h-10 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink">
            {initialProduct || "Sin producto seleccionado"}
          </p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="demo-actor" className="text-xs font-semibold text-ink">
            Actor declarado
          </label>
          <input
            id="demo-actor"
            required
            maxLength={100}
            value={actorName}
            aria-invalid={Boolean(fieldErrors["demo-actor"])}
            aria-describedby={fieldErrors["demo-actor"] ? "demo-actor-error" : undefined}
            onChange={(event) => {
              setActorName(event.target.value);
              clearFieldError("demo-actor");
            }}
            className="min-h-10 rounded-md border border-line bg-white px-3 text-base text-ink placeholder:text-gray-700 focus:placeholder:text-transparent sm:text-sm"
            placeholder="Nombre de quien registra"
          />
          <FormFieldError id="demo-actor-error" message={fieldErrors["demo-actor"]} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="demo-organization" className="text-xs font-semibold text-ink">
            Organización declarada
          </label>
          <input
            id="demo-organization"
            required
            maxLength={120}
            value={activeOrganization}
            aria-invalid={Boolean(fieldErrors["demo-organization"])}
            aria-describedby={
              fieldErrors["demo-organization"] ? "demo-organization-error" : undefined
            }
            onChange={(event) => {
              setActiveOrganization(event.target.value);
              clearFieldError("demo-organization");
            }}
            className="min-h-10 rounded-md border border-line bg-white px-3 text-base text-ink placeholder:text-gray-700 focus:placeholder:text-transparent sm:text-sm"
            placeholder="Nombre de la organización"
          />
          <FormFieldError id="demo-organization-error" message={fieldErrors["demo-organization"]} />
        </div>
      </section>

      <RoleGuide key={role} role={role} />

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:py-10">
        {role === "producer" && (
          <section data-enter aria-labelledby="create-record-title">
            <div className="mb-5">
              <h2
                id="create-record-title"
                className="mb-2 font-display text-2xl font-medium text-ink"
              >
                Registrar un lote
              </h2>
              <p className="mb-0 text-sm leading-6 text-gray-700">
                Añade los datos de origen y la organización responsable.
              </p>
            </div>

            <form
              ref={createFormRef}
              id="create-record-form"
              className="grid min-w-0 gap-4"
              noValidate
              onSubmit={createRecord}
            >
              <div className="grid gap-1.5">
                <span className="text-sm font-semibold text-ink">Producto o lote</span>
                <p
                  id="product"
                  tabIndex={-1}
                  aria-invalid={Boolean(fieldErrors.product)}
                  aria-describedby={fieldErrors.product ? "product-error" : undefined}
                  className="mb-0 flex min-h-11 items-center rounded-md border border-line bg-paper px-3 text-base text-ink sm:text-sm"
                >
                  {form.product || "No hay un producto seleccionado"}
                </p>
                <FormFieldError id="product-error" message={fieldErrors.product} />
              </div>

              <fieldset className="grid min-w-0 gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <legend className="px-1 text-sm font-semibold text-ink">
                  Características del lote
                </legend>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="crop-variety" className="text-xs font-semibold text-ink">
                    Variedad
                  </label>
                  <select
                    id="crop-variety"
                    required
                    disabled={!form.product}
                    aria-invalid={Boolean(fieldErrors["crop-variety"])}
                    aria-describedby={
                      fieldErrors["crop-variety"] ? "crop-variety-error" : undefined
                    }
                    value={variety}
                    onChange={(event) => {
                      setVariety(event.target.value);
                      clearFieldError("crop-variety");
                    }}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                  >
                    <option value="">Selecciona una variedad</option>
                    {(cropVarieties[form.product] ?? []).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <FormFieldError id="crop-variety-error" message={fieldErrors["crop-variety"]} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="crop-presentation" className="text-xs font-semibold text-ink">
                    Presentación
                  </label>
                  <select
                    id="crop-presentation"
                    required
                    aria-invalid={Boolean(fieldErrors["crop-presentation"])}
                    aria-describedby={
                      fieldErrors["crop-presentation"] ? "crop-presentation-error" : undefined
                    }
                    value={presentation}
                    onChange={(event) => {
                      setPresentation(event.target.value);
                      clearFieldError("crop-presentation");
                    }}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                  >
                    <option value="">Selecciona una presentación</option>
                    {productPresentations.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <FormFieldError
                    id="crop-presentation-error"
                    message={fieldErrors["crop-presentation"]}
                  />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="crop-harvest" className="text-xs font-semibold text-ink">
                    Cosecha
                  </label>
                  <select
                    id="crop-harvest"
                    required
                    aria-invalid={Boolean(fieldErrors["crop-harvest"])}
                    aria-describedby={
                      fieldErrors["crop-harvest"] ? "crop-harvest-error" : undefined
                    }
                    value={harvest}
                    onChange={(event) => {
                      setHarvest(event.target.value);
                      clearFieldError("crop-harvest");
                    }}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                  >
                    <option value="">Selecciona el año</option>
                    {Array.from({ length: 8 }, (_, index) =>
                      String(new Date().getFullYear() - index),
                    ).map((year) => (
                      <option key={year}>{year}</option>
                    ))}
                  </select>
                  <FormFieldError id="crop-harvest-error" message={fieldErrors["crop-harvest"]} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="crop-quality" className="text-xs font-semibold text-ink">
                    Calidad declarada
                  </label>
                  <select
                    id="crop-quality"
                    required
                    aria-invalid={Boolean(fieldErrors["crop-quality"])}
                    aria-describedby={
                      fieldErrors["crop-quality"] ? "crop-quality-error" : undefined
                    }
                    value={quality}
                    onChange={(event) => {
                      setQuality(event.target.value);
                      clearFieldError("crop-quality");
                    }}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                  >
                    <option value="">Selecciona una calidad</option>
                    {qualityGrades.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <FormFieldError id="crop-quality-error" message={fieldErrors["crop-quality"]} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="crop-price" className="text-xs font-semibold text-ink">
                    Valor del producto (opcional)
                  </label>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] gap-2">
                    <input
                      id="crop-price"
                      type="number"
                      min="0.01"
                      step="any"
                      aria-invalid={Boolean(fieldErrors["crop-price"])}
                      aria-describedby={fieldErrors["crop-price"] ? "crop-price-error" : undefined}
                      value={price}
                      onChange={(event) => {
                        setPrice(event.target.value);
                        clearFieldError("crop-price");
                      }}
                      className="min-h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                      placeholder="Valor"
                    />
                    <select
                      aria-label="Divisa"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="min-h-11 min-w-0 rounded-md border border-line bg-white px-2 text-sm text-ink"
                    >
                      {currencies.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <FormFieldError id="crop-price-error" message={fieldErrors["crop-price"]} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="crop-unit" className="text-xs font-semibold text-ink">
                    Unidad de venta
                  </label>
                  <select
                    id="crop-unit"
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                  >
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="t">Tonelada (t)</option>
                    <option value="lb">Libra (lb)</option>
                  </select>
                </div>
                <div className="grid min-w-0 gap-1.5 sm:col-span-2">
                  <label htmlFor="other-product-details" className="text-xs font-semibold text-ink">
                    Otros datos del producto
                  </label>
                  <textarea
                    id="other-product-details"
                    rows={3}
                    maxLength={700}
                    value={otherProductDetails}
                    onChange={(event) => setOtherProductDetails(event.target.value)}
                    className="min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                    placeholder="Añade información adicional de forma manual"
                  />
                </div>
              </fieldset>

              <div className="grid gap-1.5">
                <FileUploadField
                  id="product-photo"
                  label="Imagen del producto (opcional, máximo 2 MB)"
                  accept="image/jpeg,image/png,image/webp"
                  file={photoFile}
                  error={fieldErrors["product-photo"]}
                  onFileChange={(file) => {
                    setPhotoFile(file);
                    setPhotoDataUrl("");
                    if (!file) {
                      clearFieldError("product-photo");
                      return;
                    }
                    if (
                      !new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) ||
                      file.size > 2 * 1024 * 1024
                    ) {
                      setFieldErrors((current) => ({
                        ...current,
                        "product-photo": "Elige una imagen JPEG, PNG o WebP de hasta 2 MB.",
                      }));
                      toast.error("El archivo no cumple el formato o tamaño permitido.");
                      return;
                    }
                    clearFieldError("product-photo");
                    const reader = new FileReader();
                    reader.onload = () =>
                      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : "");
                    reader.onerror = () => {
                      setFieldErrors((current) => ({
                        ...current,
                        "product-photo": "No se pudo leer la imagen seleccionada.",
                      }));
                      toast.error("No se pudo leer la imagen seleccionada.");
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {photoDataUrl && (
                  <div className="relative mt-2 w-full max-w-sm">
                    <Image
                      src={photoDataUrl}
                      alt="Vista previa del producto seleccionado"
                      width={800}
                      height={600}
                      unoptimized
                      className="aspect-4/3 w-full rounded-md border border-line object-cover"
                    />
                  </div>
                )}
              </div>

              <fieldset className="grid min-w-0 gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <legend className="px-1 text-sm font-semibold text-ink">Ubicación de origen</legend>
                <div className="grid min-w-0 gap-1.5 sm:col-span-2">
                  <label htmlFor="origin" className="text-xs font-semibold text-ink">
                    Finca o lugar de origen
                  </label>
                  <input
                    id="origin"
                    name="origin"
                    required
                    maxLength={100}
                    value={form.origin}
                    aria-invalid={Boolean(fieldErrors.origin)}
                    aria-describedby={fieldErrors.origin ? "origin-error" : undefined}
                    onChange={(event) => updateField("origin", event.target.value)}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-base text-ink sm:text-sm"
                    placeholder="Nombre de la finca"
                  />
                  <FormFieldError id="origin-error" message={fieldErrors.origin} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="origin-city" className="text-xs font-semibold text-ink">
                    Ciudad o municipio
                  </label>
                  {cityOptions.length > 0 && !isManualCity ? (
                    <select
                      id="origin-city"
                      required
                      aria-invalid={Boolean(fieldErrors["origin-city"])}
                      aria-describedby={
                        fieldErrors["origin-city"] ? "origin-city-error" : undefined
                      }
                      value={originCity}
                      onChange={(event) => {
                        if (event.target.value === "__manual__") {
                          setIsManualCity(true);
                          setOriginCity("");
                          clearFieldError("origin-city");
                        } else {
                          setOriginCity(event.target.value);
                          clearFieldError("origin-city");
                        }
                      }}
                      className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {cityOptions.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                      <option value="__manual__">Ingresar otra ciudad</option>
                    </select>
                  ) : (
                    <input
                      id="origin-city"
                      required
                      maxLength={100}
                      aria-invalid={Boolean(fieldErrors["origin-city"])}
                      aria-describedby={
                        fieldErrors["origin-city"] ? "origin-city-error" : undefined
                      }
                      value={originCity}
                      onChange={(event) => {
                        setOriginCity(event.target.value);
                        clearFieldError("origin-city");
                      }}
                      className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                      placeholder="Ingresa cualquier ciudad"
                    />
                  )}
                  <FormFieldError id="origin-city-error" message={fieldErrors["origin-city"]} />
                  {isLoadingCities && (
                    <p className="mb-0 text-xs text-gray-700" role="status">
                      Cargando ciudades…
                    </p>
                  )}
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="origin-department" className="text-xs font-semibold text-ink">
                    Departamento, estado o región
                  </label>
                  {regionOptions.length > 0 && !isManualDepartment ? (
                    <select
                      id="origin-department"
                      required
                      aria-invalid={Boolean(fieldErrors["origin-department"])}
                      aria-describedby={
                        fieldErrors["origin-department"] ? "origin-department-error" : undefined
                      }
                      value={originRegionCode}
                      onChange={(event) => {
                        const region = regionOptions.find(
                          (item) => item.code === event.target.value,
                        );
                        if (event.target.value === "__manual__") {
                          setIsManualDepartment(true);
                          setOriginDepartment("");
                          setOriginRegionCode("");
                          setCityOptions([]);
                          setOriginCity("");
                          clearFieldError("origin-department");
                          return;
                        }
                        setOriginRegionCode(event.target.value);
                        setOriginDepartment(region?.name ?? "");
                        setCityOptions([]);
                        setOriginCity("");
                        setIsManualCity(false);
                        setIsLoadingCities(true);
                        void import("country-state-city").then(({ City }) => {
                          setCityOptions(
                            City.getCitiesOfState(originCountry, event.target.value).map(
                              ({ name }) => name,
                            ),
                          );
                          setIsLoadingCities(false);
                        });
                      }}
                      className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                    >
                      <option value="">Selecciona una región</option>
                      {regionOptions.map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.code} · {region.name}
                        </option>
                      ))}
                      <option value="__manual__">Ingresar otra región</option>
                    </select>
                  ) : (
                    <input
                      id="origin-department"
                      required
                      maxLength={100}
                      aria-invalid={Boolean(fieldErrors["origin-department"])}
                      aria-describedby={
                        fieldErrors["origin-department"] ? "origin-department-error" : undefined
                      }
                      value={originDepartment}
                      onChange={(event) => {
                        setOriginDepartment(event.target.value);
                        clearFieldError("origin-department");
                      }}
                      className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                      placeholder="Ingresa cualquier región"
                    />
                  )}
                  <FormFieldError
                    id="origin-department-error"
                    message={fieldErrors["origin-department"]}
                  />
                </div>
                <div className="grid min-w-0 gap-1.5 sm:col-span-2">
                  <label htmlFor="origin-country" className="text-xs font-semibold text-ink">
                    País o territorio
                  </label>
                  <select
                    id="origin-country"
                    required
                    aria-invalid={Boolean(fieldErrors["origin-country"])}
                    aria-describedby={
                      fieldErrors["origin-country"] ? "origin-country-error" : undefined
                    }
                    value={originCountry}
                    onChange={(event) => {
                      setOriginCountry(event.target.value);
                      clearFieldError("origin-country");
                      setOriginRegionCode("");
                      setOriginDepartment("");
                      setOriginCity("");
                      setCityOptions([]);
                      setIsManualCity(false);
                      setIsManualDepartment(false);
                    }}
                    className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
                  >
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.code} · {country.name}
                      </option>
                    ))}
                  </select>
                  <FormFieldError
                    id="origin-country-error"
                    message={fieldErrors["origin-country"]}
                  />
                </div>
              </fieldset>

              <div className="grid min-w-0 gap-1.5">
                <label htmlFor="origin-date" className="text-sm font-semibold text-ink">
                  Fecha del lote
                </label>
                <div className="relative flex min-w-0 items-center">
                  <input
                    id="origin-date"
                    name="originDate"
                    type="date"
                    required
                    value={form.originDate}
                    aria-invalid={Boolean(fieldErrors["origin-date"])}
                    aria-describedby={
                      fieldErrors["origin-date"]
                        ? "origin-date-format origin-date-error"
                        : "origin-date-format"
                    }
                    onChange={(event) => updateField("originDate", event.target.value)}
                    className="date-input min-h-11 w-full min-w-0 cursor-pointer rounded-md border border-line bg-white px-3 text-base text-ink focus-visible:border-accent focus-visible:outline-accent sm:text-sm [&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
                <p id="origin-date-format" className="mb-0 text-xs text-gray-700">
                  Formato de fecha: dd/mm/aaaa
                </p>
                <FormFieldError id="origin-date-error" message={fieldErrors["origin-date"]} />
              </div>

              <div className="grid min-w-0 gap-1.5">
                <label htmlFor="organization" className="text-sm font-semibold text-ink">
                  Organización responsable
                </label>
                <input
                  id="organization"
                  name="organization"
                  autoComplete="organization"
                  required
                  maxLength={100}
                  value={form.organization}
                  aria-invalid={Boolean(fieldErrors.organization)}
                  aria-describedby={fieldErrors.organization ? "organization-error" : undefined}
                  onChange={(event) => updateField("organization", event.target.value)}
                  className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-base text-ink placeholder:text-gray-700 focus:placeholder:text-transparent focus-visible:border-accent focus-visible:outline-accent sm:text-sm"
                  placeholder="Nombre de la organización"
                />
                <FormFieldError id="organization-error" message={fieldErrors.organization} />
              </div>

              <div className="grid gap-1.5">
                <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isPublic: event.target.checked }))
                    }
                    className="size-4 accent-accent"
                  />
                  Publicar la ficha de consulta del QR
                </label>
                <p className="mb-0 text-xs leading-5 text-gray-700">
                  La ficha pública mostrará producto, origen, organización, actor declarado,
                  eventos, certificados y sus huellas. No incluyas datos personales ni sensibles.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingRecord || isLoadingRecords}
                className="mt-1 min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-[#125746] focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isSavingRecord ? "Guardando…" : "Crear registro"}
              </button>
            </form>
            <ConfirmDialog
              open={isCreateConfirmationOpen}
              title="Revisa los datos del lote"
              description="Comprueba producto, características, ubicación y organización antes de guardar el registro."
              isBusy={isSavingRecord}
              onCancel={() => {
                createConfirmed.current = false;
                setIsCreateConfirmationOpen(false);
              }}
              onConfirm={() => {
                createConfirmed.current = true;
                setIsCreateConfirmationOpen(false);
                createFormRef.current?.requestSubmit();
              }}
            />

            {formError && (
              <p className="mt-3 mb-0 text-sm text-red-800" role="alert">
                {formError}
              </p>
            )}

            <p className="mt-4 mb-0 text-xs leading-5 text-gray-700">
              Los lotes se guardan en Supabase y quedan vinculados a este navegador. Si borras sus
              datos, perderás acceso para editarlos; los archivos de evidencia siguen locales.
              Publica el QR solo si aceptas que sus campos permitidos sean públicos.
            </p>
            {storageError && (
              <p className="mt-2 mb-0 text-sm text-red-800" role="alert">
                {storageMessage || "No se pudo completar la operación de almacenamiento."}
              </p>
            )}
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement}
            </p>
          </section>
        )}

        {role === "supplyActor" && (
          <section data-enter className="lg:col-span-2">
            <EventForm
              records={records}
              actorName={actorName}
              actorRole={role}
              organization={activeOrganization}
            />
          </section>
        )}
        {role === "certifier" && (
          <section data-enter className="lg:col-span-2">
            <CertificateForm
              records={records}
              actorName={actorName}
              actorRole={role}
              organization={activeOrganization}
            />
          </section>
        )}
        {role === "organizationAdmin" && (
          <section data-enter className="lg:col-span-2">
            <OrganizationMembers organization={activeOrganization} />
            <TraceabilityActorAccess />
          </section>
        )}
        {role === "b2bBuyer" && (
          <section data-enter className="lg:col-span-2">
            <BuyerDashboard records={records} />
            <TrustlessWorkEscrow records={records} />
          </section>
        )}
        {role === "auditor" && (
          <section data-enter className="lg:col-span-2">
            <AuditDashboard
              records={records}
              actorName={actorName}
              organization={activeOrganization}
            />
          </section>
        )}
        {role === "consumer" && (
          <section data-enter className="lg:col-span-2">
            <ConsumerScanner />
          </section>
        )}

        {role !== "consumer" && role !== "b2bBuyer" && role !== "auditor" && (
          <section data-enter aria-labelledby="records-list-title">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="mb-1 text-[11px] font-bold text-accent">HISTORIAL</p>
                <h2
                  id="records-list-title"
                  className="mb-0 font-display text-2xl font-medium text-ink"
                >
                  Lotes registrados
                </h2>
              </div>
            </div>

            {activeRecords.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                <span
                  className="mb-3 grid size-10 place-items-center rounded-full border border-[#bdd7cc] bg-accent-soft text-lg text-accent"
                  aria-hidden="true"
                >
                  —
                </span>
                <p className="mb-1 font-medium text-ink">
                  {isLoadingRecords
                    ? "Cargando lotes…"
                    : retiredRecords.length > 0
                      ? "No hay lotes activos"
                      : "Aún no hay lotes"}
                </p>
                <p className="mb-0 text-sm text-gray-700">
                  {retiredRecords.length > 0
                    ? "Los lotes retirados están en su propia sección."
                    : "El primer registro aparecerá en este historial."}
                </p>
              </div>
            ) : (
              <ol className="grid gap-3" aria-label="Historial de lotes registrados">
                {activeRecords.map((record) => (
                  <li
                    key={record.id}
                    ref={(element) => {
                      recordElements.current[record.id] = element;
                    }}
                    data-record-id={record.id}
                    className="rounded-md border border-line bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {record.characteristics && (
                          <LotCharacteristics value={record.characteristics} />
                        )}
                        <h3 className="mb-1 font-semibold text-ink">{record.product}</h3>
                        {record.isDeleted && (
                          <p className="mb-1 text-xs font-semibold text-red-800">
                            Retirado del listado activo
                          </p>
                        )}
                        <p className="mb-0 text-sm text-gray-700">{record.origin}</p>
                      </div>
                      <span className="rounded bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
                        Lote
                      </span>
                    </div>
                    {record.photoDataUrl && (
                      <Image
                        src={record.photoDataUrl}
                        alt={`Producto del lote ${record.product}`}
                        width={800}
                        height={600}
                        unoptimized
                        className="mt-4 aspect-4/3 w-full max-w-sm rounded-md border border-line object-cover"
                      />
                    )}
                    <dl className="mt-4 grid gap-x-4 gap-y-3 border-t border-line pt-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-gray-700">Fecha del lote</dt>
                        <dd className="mt-1 mb-0 text-ink">
                          <time dateTime={record.originDate}>
                            {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
                              new Date(`${record.originDate}T12:00:00`),
                            )}
                          </time>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-700">Organización responsable</dt>
                        <dd className="mt-1 mb-0 text-ink">{record.organization}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-gray-700">Creado</dt>
                        <dd className="mt-1 mb-0 text-ink">
                          <time dateTime={record.createdAt}>
                            {formatCreatedAt(record.createdAt)}
                          </time>
                        </dd>
                      </div>
                    </dl>
                    {record.events.length > 0 && (
                      <section
                        className="mt-4 border-t border-line pt-4"
                        aria-label="Eventos del lote"
                      >
                        <h4 className="mb-3 text-sm font-semibold text-ink">
                          Historial de eventos
                        </h4>
                        <ol className="grid gap-3 border-l border-line pl-4">
                          {record.events.map((lotEvent) => (
                            <li key={lotEvent.id} className="relative">
                              <span
                                className="absolute left-[-1.32rem] top-1.5 size-2 rounded-full bg-accent"
                                aria-hidden="true"
                              />
                              <p className="mb-1 text-sm font-medium text-ink">{lotEvent.type}</p>
                              <p className="mb-1 text-xs text-gray-700">
                                {new Intl.DateTimeFormat("es-CO", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(lotEvent.occurredAt))}
                                {" · "}
                                {lotEvent.actorName} · {lotEvent.organization}
                              </p>
                              <p className="mb-0 text-sm leading-5 text-ink">{lotEvent.details}</p>
                              {lotEvent.evidenceFileName && (
                                <div className="mt-2">
                                  <EvidenceFileLink
                                    evidenceId={lotEvent.evidenceId ?? lotEvent.id}
                                    fileName={lotEvent.evidenceFileName}
                                  />
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </section>
                    )}
                    {record.certificates.length > 0 && (
                      <section
                        className="mt-4 border-t border-line pt-4"
                        aria-label="Certificados asociados"
                      >
                        <h4 className="mb-2 text-sm font-semibold text-ink">
                          Certificados asociados
                        </h4>
                        <ul className="grid gap-3">
                          {record.certificates.map((certificate) => (
                            <li key={certificate.id} className="text-sm">
                              <p className="mb-1 font-medium text-ink">{certificate.name}</p>
                              <p className="mb-1 text-xs text-gray-700">
                                Emisor declarado: {certificate.issuer} ·{" "}
                                {certificate.certificateNumber}
                              </p>
                              <p className="mb-1 break-all font-mono text-[11px] text-gray-700">
                                SHA-256: {certificate.evidenceSha256}
                              </p>
                              <p className="mb-2 text-xs text-gray-700">
                                Asociado por {certificate.recordedBy} ·{" "}
                                {certificate.recordedByRole
                                  ? roleLabels[certificate.recordedByRole]
                                  : "rol no registrado"}
                              </p>
                              {certificate.evidenceFileName && (
                                <EvidenceFileLink
                                  evidenceId={certificate.evidenceId ?? certificate.id}
                                  fileName={certificate.evidenceFileName}
                                />
                              )}
                              <p className="mb-0 text-xs text-gray-700">
                                Asociado como evidencia; no implica que el emisor o certificado haya
                                sido validado.
                              </p>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {!record.isDeleted && <LotSharing record={record} />}
                    {!record.isDeleted && (
                      <label className="mt-4 flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                        <input
                          type="checkbox"
                          checked={record.isPublic}
                          onChange={(event) => {
                            const isPublic = event.target.checked;
                            void updateLotRecord(record.id, (current) => ({
                              ...current,
                              isPublic,
                            })).then((saved) => {
                              if (saved) {
                                toast.success(
                                  isPublic ? "Ficha pública activada." : "Ficha pública retirada.",
                                );
                              } else {
                                toast.error("No se pudo cambiar la publicación del lote.");
                              }
                            });
                          }}
                          className="size-4 accent-accent"
                        />
                        Publicar ficha de consulta del QR
                      </label>
                    )}
                    {!record.isDeleted && <TraceabilityAnchor record={record} />}
                    {role === "producer" && (
                      <LotManagement
                        record={record}
                        actorName={actorName.trim() || "Responsable de la cuenta"}
                        actorRole={role}
                      />
                    )}
                  </li>
                ))}
              </ol>
            )}
            {role === "producer" && retiredRecords.length > 0 && (
              <details className="mt-6 border-t border-line pt-4">
                <summary className="w-fit cursor-pointer text-sm font-semibold text-accent underline underline-offset-4">
                  Lotes retirados ({retiredRecords.length})
                </summary>
                <ol className="mt-3 grid gap-3" aria-label="Lotes retirados">
                  {retiredRecords.map((record) => (
                    <li
                      key={record.id}
                      ref={(element) => {
                        recordElements.current[record.id] = element;
                      }}
                      data-record-id={record.id}
                      className="rounded-md border border-line bg-white p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="mb-1 font-semibold text-ink">{record.product}</h3>
                          <p className="mb-1 text-xs font-semibold text-gray-700">
                            Retirado del listado activo
                          </p>
                          <p className="mb-0 wrap-break-word text-sm text-gray-700">
                            {record.origin}
                          </p>
                        </div>
                        <span className="rounded bg-paper px-2 py-1 text-xs font-medium text-gray-700">
                          Retirado
                        </span>
                      </div>
                      {record.auditHistory && record.auditHistory.length > 0 && (
                        <p className="mt-3 mb-0 text-xs text-gray-700">
                          Último cambio: {record.auditHistory.at(-1)?.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
