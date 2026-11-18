"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import confetti from "canvas-confetti";
import { ArrowUpCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recompensa } from "@/lib/tipos";

const Ctx = createContext<(r: Recompensa, titulo: string) => void>(() => {});
export const useCelebrar = () => useContext(Ctx);

function soltarConfete(promocao: boolean) {
  const cores = ["#8b5cf6", "#d946ef", "#38bdf8", "#22c55e", "#facc15"];
  confetti({ particleCount: promocao ? 180 : 90, spread: 80, origin: { y: 0.55 }, colors: cores, zIndex: 9999 });
  if (promocao) {
    const fim = Date.now() + 1800;
    const loop = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors: cores, zIndex: 9999 });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors: cores, zIndex: 9999 });
      if (Date.now() < fim) requestAnimationFrame(loop);
    };
    loop();
  }
}

function Contador({ ate }: { ate: number }) {
  const valor = useMotionValue(0);
  const arredondado = useTransform(valor, (v) => Math.round(v));
  useEffect(() => {
    const controle = animate(valor, ate, { duration: 1.4, ease: "easeOut", delay: 0.3 });
    return () => controle.stop();
  }, [ate, valor]);
  return <motion.span>{arredondado}</motion.span>;
}

export function CelebracaoProvider({ children }: { children: React.ReactNode }) {
  const [atual, setAtual] = useState<{ r: Recompensa; titulo: string } | null>(null);

  const celebrar = useCallback((r: Recompensa, titulo: string) => {
    setAtual({ r, titulo });
    setTimeout(() => soltarConfete(!!r.promocao), 250);
  }, []);

  return (
    <Ctx.Provider value={celebrar}>
      {children}
      <AnimatePresence>
        {atual && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAtual(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border bg-card p-8 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-24 h-56 bg-gradient-to-b from-violet-500/30 via-fuchsia-500/10 to-transparent blur-2xl" />

              {atual.r.promocao ? (
                <>
                  <motion.div
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.15 }}
                    className="relative mx-auto grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-orange-500/30"
                  >
                    <Trophy className="size-10 text-white" />
                  </motion.div>
                  <div className="relative mt-5 text-xs font-semibold tracking-[0.2em] text-amber-500 uppercase">Promoção!</div>
                  <h2 className="relative mt-1 text-2xl font-bold tracking-tight">Você agora é {atual.r.promocao.cargo}</h2>
                  <p className="relative mt-2 text-sm text-muted-foreground">Trilha “{atual.r.promocao.trilha}” concluída. O CTO já avisou o time todo. 🎉</p>
                </>
              ) : (
                <>
                  <div className="relative text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase">PR aprovado</div>
                  <h2 className="relative mt-1 text-xl font-bold tracking-tight">{atual.titulo}</h2>
                </>
              )}

              <div className="relative mt-6 font-mono text-6xl font-bold tracking-tight">
                <span className="texto-gradiente">
                  +<Contador ate={atual.r.total} />
                </span>
                <span className="ml-2 text-2xl text-muted-foreground">XP</span>
              </div>

              <div className="relative mt-5 space-y-1.5 text-sm">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex justify-between rounded-lg bg-muted/60 px-3 py-2">
                  <span>Ticket concluído</span>
                  <span className="font-mono font-semibold">+{atual.r.xpBase}</span>
                </motion.div>
                {atual.r.bonus.map((b, i) => (
                  <motion.div
                    key={b.motivo}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.18 }}
                    className="flex justify-between rounded-lg bg-primary/10 px-3 py-2 text-primary"
                  >
                    <span>{b.motivo}</span>
                    <span className="font-mono font-semibold">+{b.xp}</span>
                  </motion.div>
                ))}
              </div>

              {atual.r.subiuNivel && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3, type: "spring" }}
                  className="relative mt-4 flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 py-2.5 text-sm font-semibold text-sky-500"
                >
                  <ArrowUpCircle className="size-4" /> Subiu de nível!
                </motion.div>
              )}

              <Button size="lg" className="relative mt-7 w-full" onClick={() => setAtual(null)}>
                Bora pro próximo 🚀
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
