import type { Metadata } from "next";
import { Header } from "@/components/header/Header";
import { RecordsAuth } from "@/components/records-auth/RecordsAuth";
import { SiteFooter } from "@/components/site-footer/SiteFooter";

export const metadata: Metadata = {
  title: "Registros de trazabilidad",
  description: "Gestiona lotes, eventos y evidencias de trazabilidad.",
};

export default function RecordsPage() {
  return (
    <div className="flex min-h-svh flex-col bg-paper bg-[linear-gradient(135deg,rgba(227,241,235,0.35),transparent_44%)]">
      <Header />
      <main
        id="contenido"
        className="records-route-enter mx-auto w-[min(100%-2.5rem,70rem)] flex-1 py-8 sm:w-[min(100%-3rem,70rem)] sm:py-12"
      >
        <RecordsAuth />
      </main>
      <SiteFooter />
    </div>
  );
}
