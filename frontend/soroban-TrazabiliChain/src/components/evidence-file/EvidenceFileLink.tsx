"use client";

import { useEffect, useState } from "react";
import { getEvidenceFile } from "@/lib/lots/evidence-storage";

export function EvidenceFileLink({
  evidenceId,
  fileName,
}: {
  evidenceId: string;
  fileName: string;
}) {
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    let currentUrl = "";
    let active = true;

    void getEvidenceFile(evidenceId)
      .then((file) => {
        if (file && active) {
          currentUrl = URL.createObjectURL(file);
          setFileUrl(currentUrl);
        }
      })
      .catch(() => setFileUrl(""));

    return () => {
      active = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [evidenceId]);

  if (!fileUrl) {
    return <span className="text-xs text-muted">Archivo local no disponible</span>;
  }

  return (
    <a
      href={fileUrl}
      download={fileName}
      className="text-xs font-semibold text-accent underline underline-offset-2"
    >
      Abrir evidencia: {fileName}
    </a>
  );
}
