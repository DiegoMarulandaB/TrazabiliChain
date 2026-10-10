"use client";

import { useState, type FormEvent } from "react";
import {
  addOrganizationMember,
  demoRoles,
  removeOrganizationMember,
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

export function OrganizationMembers() {
  const members = useOrganizationMembers();
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<DemoRole>("producer");
  const [message, setMessage] = useState("");

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = addOrganizationMember({
      id: window.crypto.randomUUID(),
      name: name.trim(),
      organization: organization.trim(),
      role,
    });

    if (!saved) {
      setMessage("No se pudo guardar el miembro en este navegador.");
      return;
    }

    setMessage(`${name.trim()} agregado con perfil ${roleLabels[role]}.`);
    setName("");
  }

  function deleteMember(id: string, memberName: string) {
    setMessage(
      removeOrganizationMember(id)
        ? `Se quitó ${memberName} del directorio local.`
        : "No se pudo actualizar el directorio local.",
    );
  }

  return (
    <section aria-labelledby="members-title" className="max-w-3xl">
      <h2 id="members-title" className="font-display text-2xl font-medium text-ink">
        Miembros y roles de demostración
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        El directorio permite ensayar la asignación de responsabilidades. No verifica identidades ni
        controla permisos fuera de esta interfaz local.
      </p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={addMember}>
        <div className="grid gap-1.5">
          <label htmlFor="member-name" className="text-sm font-semibold text-ink">
            Nombre del miembro
          </label>
          <input
            id="member-name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="member-organization" className="text-sm font-semibold text-ink">
            Organización
          </label>
          <input
            id="member-organization"
            required
            maxLength={120}
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="member-role" className="text-sm font-semibold text-ink">
            Rol asignado
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(event) => setRole(event.target.value as DemoRole)}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
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
          Agregar miembro
        </button>
      </form>
      <p className="mt-3 min-h-5 text-sm text-accent" role="status" aria-live="polite">
        {message}
      </p>

      <div className="mt-5 overflow-x-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Miembros locales y roles asignados</caption>
          <thead className="border-b border-line bg-paper text-xs text-muted">
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
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">
                  Todavía no hay miembros en el directorio local.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
