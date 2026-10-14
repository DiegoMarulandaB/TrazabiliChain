"use client";

import BorderBeam from "border-beam";
import { useEffect, useState, type ReactNode } from "react";

export function BorderBeamFrame({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setActive(!motionPreference.matches);
    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    return () => motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  return (
    <BorderBeam
      active={active}
      size="line"
      colorVariant="forest"
      theme="light"
      duration={4}
      strength={0.55}
    >
      {children}
    </BorderBeam>
  );
}
