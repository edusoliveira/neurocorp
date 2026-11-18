"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const ROTAS: Record<string, string> = { i: "/", q: "/quadro", t: "/trilhas", c: "/carreira" };

/** Atalhos estilo Linear: "g" e depois i (início), q (quadro), t (trilhas), c (carreira). */
export function Atalhos() {
  const router = useRouter();
  const esperandoG = useRef(0);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
      const tecla = e.key.toLowerCase();
      if (tecla === "g") {
        esperandoG.current = Date.now();
        return;
      }
      if (Date.now() - esperandoG.current < 1200 && ROTAS[tecla]) {
        esperandoG.current = 0;
        router.push(ROTAS[tecla]);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [router]);

  return null;
}
