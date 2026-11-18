"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, FileSearch, FlaskConical, FolderSync, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, recarregarTudo } from "@/lib/cliente";
import type { Submissao } from "@/lib/tipos";
import { useCelebrar } from "./celebracao";

const FASES = [
  { rotulo: "Copiando seus arquivos", Icone: FolderSync },
  { rotulo: "Verificando sintaxe e regras do ticket", Icone: FileSearch },
  { rotulo: "Rodando os testes ocultos", Icone: FlaskConical },
  { rotulo: "Tech Lead Bot revisando o código", Icone: Sparkles },
];

type Submeter = (ticketId: string, titulo: string, arquivos?: File[]) => Promise<void>;
const Ctx = createContext<{ submeter: Submeter; ocupado: boolean }>({ submeter: async () => {}, ocupado: false });
export const useSubmeter = () => useContext(Ctx);

export function SubmissaoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const celebrar = useCelebrar();
  const [ativo, setAtivo] = useState<{ ticketId: string } | null>(null);
  const [fase, setFase] = useState(0);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    if (!ativo || concluido) return;
    const timer = setInterval(() => setFase((f) => Math.min(f + 1, FASES.length - 1)), 700);
    return () => clearInterval(timer);
  }, [ativo, concluido]);

  const submeter = useCallback<Submeter>(
    async (ticketId, titulo, arquivos) => {
      setAtivo({ ticketId });
      setFase(0);
      setConcluido(false);
      const inicio = Date.now();
      try {
        let init: RequestInit = { method: "POST" };
        if (arquivos?.length) {
          const form = new FormData();
          arquivos.forEach((a) => form.append("arquivos", a, a.name));
          init = { method: "POST", body: form };
        }
        const { submissao, ignorados } = await api<{ submissao: Submissao; ignorados: string[] }>(`/api/tickets/${ticketId}/submeter`, init);
        // Deixa a animação respirar um pouco, mesmo quando a correção é instantânea.
        await new Promise((r) => setTimeout(r, Math.max(0, 2200 - (Date.now() - inicio))));
        setFase(FASES.length);
        setConcluido(true);
        await new Promise((r) => setTimeout(r, 450));
        if (ignorados.length) toast.warning(`Arquivos ignorados (não fazem parte do ticket): ${ignorados.join(", ")}`);
        await recarregarTudo();
        router.push(`/review/${submissao.id}`);
        if (submissao.erroInterno) {
          toast.error("O corretor encontrou um problema interno.");
        } else if (submissao.recompensa) {
          celebrar(submissao.recompensa, titulo);
        } else if (submissao.aprovado) {
          toast.success("Aprovado de novo! (o XP deste ticket já tinha sido contado)");
        } else {
          toast("Mudanças solicitadas", { description: "O Tech Lead Bot deixou comentários no seu código." });
        }
      } catch (erro) {
        toast.error(erro instanceof Error ? erro.message : "Falha ao submeter.");
      } finally {
        setAtivo(null);
      }
    },
    [celebrar, router],
  );

  return (
    <Ctx.Provider value={{ submeter, ocupado: !!ativo }}>
      {children}
      <AnimatePresence>
        {ativo && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
            >
              <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Pipeline de revisão</div>
              <div className="mt-1 font-mono text-sm">{ativo.ticketId}</div>
              <ol className="mt-5 space-y-3">
                {FASES.map(({ rotulo, Icone }, i) => {
                  const feito = i < fase;
                  const atual = i === fase;
                  return (
                    <motion.li key={rotulo} initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= fase ? 1 : 0.4, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 text-sm">
                      <span
                        className={`grid size-7 place-items-center rounded-full border transition-colors ${
                          feito ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500" : atual ? "border-violet-500/40 bg-violet-500/15 text-violet-500" : "text-muted-foreground"
                        }`}
                      >
                        {feito ? <Check className="size-3.5" /> : atual ? <Loader2 className="size-3.5 animate-spin" /> : <Icone className="size-3.5" />}
                      </span>
                      {rotulo}
                    </motion.li>
                  );
                })}
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
