import type { Metadata } from "next";
import { SplashScreen } from "@/components/splash-screen/SplashScreen";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteTitle = "TrazabiliChain | Trazabilidad del origen al destino";
const siteDescription =
  "Conoce el propósito de TrazabiliChain: conectar lotes, actores y evidencias en un historial de trazabilidad claro y verificable.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | TrazabiliChain",
  },
  description: siteDescription,
  applicationName: "TrazabiliChain",
  category: "Supply chain traceability",
  keywords: [
    "TrazabiliChain",
    "trazabilidad",
    "cadena de suministro",
    "Stellar",
    "Soroban",
    "origen de productos",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    siteName: "TrazabiliChain",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TrazabiliChain: trazabilidad del origen al destino",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <SplashScreen>{children}</SplashScreen>
      </body>
    </html>
  );
}
