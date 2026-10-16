"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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

export function OrganizationMembers({
  organization: activeOrganization,
}: {
  organization: string;
}) {
  const allMembers = useOrganizationMembers();
  const members = allMembers.filter((member) => member.organization === activeOrganization.trim());
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<DemoRole>("producer");
  const [message, setMessage] = useState("");

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
    <section aria-labelledby="members-title" className="max-w-3xl">
      <h2 id="members-title" className="font-display text-2xl font-medium text-ink">
        Miembros y roles de demostración
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-700">
        El directorio permite ensayar la asignación de responsabilidades. No verifica identidades ni
        controla permisos fuera de esta interfaz local. Se muestran solo los miembros de la
        organización indicada en el perfil actual.
      </p>

      <form className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2" onSubmit={addMember}>
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
            className="min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
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
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>

      <div className="mt-5 overflow-x-auto rounded-md border border-line bg-white">
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
                Rol
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
                    ? "Todavía no hay miembros para esta organización."
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
