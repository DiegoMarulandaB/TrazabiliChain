import { ImageResponse } from "next/og";

export const alt = "TrazabiliChain: trazabilidad del origen al destino";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 82px",
        backgroundColor: "#f6f8f5",
        color: "#193332",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 62,
            height: 62,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: "#176b59",
            color: "white",
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          T
        </div>
        <span style={{ fontSize: 30, fontWeight: 600 }}>TrazabiliChain</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 960 }}>
        <p
          style={{
            margin: 0,
            color: "#176b59",
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          TRAZABILIDAD CON CONTEXTO
        </p>
        <h1 style={{ margin: 0, fontSize: 62, lineHeight: 1.08, fontWeight: 600 }}>
          Del origen al destino, cada lote tiene una historia.
        </h1>
        <p style={{ margin: 0, color: "#526b65", fontSize: 25, lineHeight: 1.45 }}>
          Un historial para conectar lotes, recorridos y evidencias.
        </p>
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 12, color: "#526b65", fontSize: 18 }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: "#378b62" }} />
        Stellar · Trazabilidad verificable
      </div>
    </div>,
    { ...size },
  );
}
