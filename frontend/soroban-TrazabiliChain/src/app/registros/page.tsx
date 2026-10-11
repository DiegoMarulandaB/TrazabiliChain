import type { Metadata } from "next";
import { Header } from "@/components/header/Header";
import { RecordsPanel } from "@/components/records-panel/RecordsPanel";
import { SiteFooter } from "@/components/site-footer/SiteFooter";

export const metadata: Metadata = {
  title: "Registros de trazabilidad",
  description: "Gestiona lotes, eventos y evidencias de trazabilidad.",
};

export default function RecordsPage() {
  return (
    <div className="min-h-screen bg-paper bg-[linear-gradient(135deg,rgba(227,241,235,0.35),transparent_44%)]">
      <Header />
      <main
        id="contenido"
        className="records-route-enter mx-auto w-[min(100%-2.5rem,70rem)] py-8 sm:w-[min(100%-3rem,70rem)] sm:py-12"
      >
        {/* Acceso Supabase pausado hasta disponer de llaves; conservar para activarlo después. */}
        {/* <RecordsAuth /> */}
        <RecordsPanel />
      </main>
      <SiteFooter />
    </div>
  );
}
