"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useWorkDraft } from "@/hooks/useWorkDraft";
import {
  addOrganizationMember,
  demoRoles,
  removeOrganizationMember,
  updateOrganizationMember,
  useOrganizationMembers,
  type DemoRole,
} from "@/lib/lots/lot-storage";

export const roleLabels: Record<DemoRole, string> = {
  producer: "Productor",
  supplyActor: "Actor de cadena",
  certifier: "Certificador",
  organizationAdmin: "Administrador de organización",
  b2bBuyer: "Comprador B2B",
  auditor: "Auditor",
  consumer: "Consumidor",
};

function normalizeOrganization(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

function organizationDraftKey(value: string) {
  let hash = 2166136261;
  for (const character of normalizeOrganization(value)) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return `organization-member-${(hash >>> 0).toString(36)}`;
}

export function OrganizationMembers({
  organization: activeOrganization,
  draftUserId,
  product,
}: {
  organization: string;
  draftUserId: string | null;
  product: string;
}) {
  const allMembers = useOrganizationMembers();
  const members = allMembers.filter(
    (member) =>
      normalizeOrganization(member.organization) === normalizeOrganization(activeOrganization),
  );
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState(activeOrganization);
  const [role, setRole] = useState<DemoRole>("producer");
  const [message, setMessage] = useState("");
  const memberDraft = useWorkDraft({
    userId: draftUserId,
    role: "organizationAdmin",
    product,
    draftKey: organizationDraftKey(activeOrganization),
    payload: { name, organization, role },
    onRestore: (draft) => {
      if (draft.name !== undefined) setName(draft.name);
      if (draft.organization !== undefined) setOrganization(draft.organization);
      if (draft.role !== undefined && demoRoles.includes(draft.role)) setRole(draft.role);
    },
  });

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const member = {
      id: editingMemberId ?? window.crypto.randomUUID(),
      name: name.trim(),
      organization: organization.trim(),
      role,
    };
    const saved = editingMemberId
      ? updateOrganizationMember(member)
      : addOrganizationMember(member);

    if (!saved) {
      setMessage("No se pudo guardar el miembro en este navegador.");
      toast.error("No se pudo guardar el miembro en este navegador.");
      return;
    }

    const successMessage = editingMemberId
      ? `${name.trim()} actualizado con perfil ${roleLabels[role]}.`
      : `${name.trim()} agregado con perfil ${roleLabels[role]}.`;
    setMessage(successMessage);
    toast.success(successMessage);
    setName("");
    setEditingMemberId(null);
    void memberDraft.clearDraft();
  }

  function deleteMember(id: string, memberName: string) {
    if (removeOrganizationMember(id)) {
      const message = `Se quitó ${memberName} del directorio local.`;
      setMessage(message);
      toast.success(message);
    } else {
      const message = "No se pudo actualizar el directorio local.";
      setMessage(message);
      toast.error(message);
    }
  }

  return (
    <section aria-labelledby="members-title" className="w-full min-w-0 max-w-3xl">
      <h2 id="members-title" className="font-display text-2xl font-medium text-ink">
        Miembros y roles de demostración
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-700">
        El directorio permite ensayar la asignación de responsabilidades. No verifica identidades ni
        controla permisos fuera de esta interfaz local. Se muestran solo los miembros de la
        organización indicada en el perfil actual.
      </p>

      <form
        className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"
        onSubmit={addMember}
        inert={!memberDraft.isReady}
      >
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="member-name" className="text-sm font-semibold text-ink">
            Nombre del miembro
          </label>
          <input
            id="member-name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="member-organization" className="text-sm font-semibold text-ink">
            Organización
          </label>
          <input
            id="member-organization"
            required
            maxLength={120}
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            aria-describedby="member-organization-help"
            className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
          <p id="member-organization-help" className="mb-0 text-xs leading-5 text-gray-700">
            Se completa con la organización declarada en el perfil. La tabla muestra sus miembros.
          </p>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="member-role" className="text-sm font-semibold text-ink">
            Rol asignado
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(event) => setRole(event.target.value as DemoRole)}
            className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            {demoRoles.map((demoRole) => (
              <option key={demoRole} value={demoRole}>
                {roleLabels[demoRole]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-11 cursor-pointer self-end rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-[#125746] sm:w-fit"
        >
          {editingMemberId ? "Guardar cambios" : "Agregar miembro"}
        </button>
        {editingMemberId && (
          <button
            type="button"
            onClick={() => {
              setEditingMemberId(null);
              setName("");
              setOrganization("");
              setRole("producer");
            }}
            className="min-h-11 rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-paper sm:col-span-2 sm:justify-self-start"
          >
            Cancelar edición
          </button>
        )}
      </form>
      {!memberDraft.isReady && (
        <p className="mt-2 mb-0 text-sm text-gray-700" role="status" aria-live="polite">
          Restaurando el formulario de miembros…
        </p>
      )}
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>

      <ul className="mt-5 grid gap-3 p-0 sm:hidden" aria-label="Miembros de la organización">
        {members.map((member) => (
          <li key={member.id} className="list-none border border-line bg-white p-4">
            <dl className="grid min-w-0 gap-3 text-sm">
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-gray-700">Miembro</dt>
                <dd className="mb-0 wrap-break-word text-ink">{member.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-gray-700">Organización</dt>
                <dd className="mb-0 wrap-break-word text-ink">{member.organization}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-700">Perfil asignado</dt>
                <dd className="mb-0 text-ink">{roleLabels[member.role]}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => {
                  setEditingMemberId(member.id);
                  setName(member.name);
                  setOrganization(member.organization);
                  setRole(member.role);
                }}
                className="min-h-10 font-semibold text-accent underline underline-offset-2"
              >
                Editar {member.name}
              </button>
              <button
                type="button"
                onClick={() => deleteMember(member.id, member.name)}
                className="min-h-10 font-semibold text-red-800 underline underline-offset-2"
              >
                Quitar {member.name}
              </button>
            </div>
          </li>
        ))}
        {members.length === 0 && (
          <li className="list-none border border-line bg-white px-4 py-6 text-center text-sm text-gray-700">
            {activeOrganization.trim()
              ? "Todavía no hay miembros para esta organización."
              : "Indica la organización del perfil de trabajo para gestionar sus miembros."}
          </li>
        )}
      </ul>

      <div className="mt-5 hidden overflow-x-auto rounded-md border border-line bg-white sm:block">
        <table className="w-full min-w-xl text-left text-sm">
          <caption className="sr-only">Miembros locales y roles asignados</caption>
          <thead className="border-b border-line bg-paper text-xs text-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Miembro
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Organización
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Perfil de trabajo
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Editar
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 text-ink">{member.name}</td>
                <td className="px-4 py-3 text-ink">{member.organization}</td>
                <td className="px-4 py-3 text-ink">{roleLabels[member.role]}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberId(member.id);
                      setName(member.name);
                      setOrganization(member.organization);
                      setRole(member.role);
                    }}
                    className="cursor-pointer text-xs font-semibold text-accent underline underline-offset-2"
                  >
                    Editar
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => deleteMember(member.id, member.name)}
                    className="cursor-pointer text-xs font-semibold text-red-800 underline underline-offset-2"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-700">
                  {activeOrganization.trim()
                    ? `Todavía no hay miembros guardados para ${activeOrganization.trim()}. Completa el formulario y pulsa Agregar miembro.`
                    : "Indica la organización del perfil de trabajo para gestionar sus miembros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
