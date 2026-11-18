"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Award, Briefcase, CheckCircle2, Flame, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";
import { postJson, recarregarTudo, useEstado } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarraXp, XpChip } from "@/components/app/pecas";
import { Heatmap } from "@/components/app/heatmap";

export default function Carreira() {
  const { data } = useEstado();
  const [confirmando, setConfirmando] = useState(false);
  if (!data) return <div className="p-10 text-sm text-muted-foreground">Carregando carreira…</div>;
  const { perfil, trilhas, atividade } = data;

  // Escada de cargos: inicial + um por trilha
  const degraus = [
    { cargo: trilhas[0]?.cargoInicial ?? "Estagiário(a) de IA", conquistado: true, data: undefined as string | undefined, trilha: "Contratação" },
    ...trilhas.map((t) => ({
      cargo: t.cargoAoConcluir,
      conquistado: t.concluida,
      data: perfil.promocoes.find((p) => p.trilhaId === t.id)?.data,
      trilha: t.titulo,
    })),
  ];
  const concluidos = trilhas.flatMap((t) => t.tickets).filter((t) => t.status === "done");

  const resetar = async () => {
    await postJson("/api/reset");
    setConfirmando(false);
    await recarregarTudo();
    toast.success("Progresso reiniciado. Seus arquivos em suporte-inteligente não foram apagados.");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold tracking-tight">Carreira</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sua trajetória na NeuroCorp.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
              <Briefcase className="size-6" />
            </div>
            <div>
              <div className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Cargo atual</div>
              <div className="text-xl font-bold tracking-tight">{perfil.cargo}</div>
            </div>
          </div>
          <div className="mt-6 flex items-baseline justify-between text-sm">
            <span className="font-semibold">Nível {perfil.nivel}</span>
            <span className="font-mono text-xs text-muted-foreground">
              faltam {perfil.xpProximoNivel - perfil.xpNoNivel} XP para o nível {perfil.nivel + 1}
            </span>
          </div>
          <BarraXp atual={perfil.xpNoNivel} total={perfil.xpProximoNivel} className="mt-2 h-3" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <Mini Icone={Zap} cor="text-violet-500" valor={perfil.xp} rotulo="XP total" />
          <Mini Icone={Flame} cor="text-orange-500" valor={perfil.sequenciaDias} rotulo="dias seguidos" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Plano de carreira</h2>
          <ol className="relative mt-5 space-y-5 border-l-2 border-dashed pl-6">
            {degraus.map((d, i) => (
              <motion.li key={d.cargo + i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                <span
                  className={cn(
                    "absolute top-0.5 -left-[33px] grid size-5 place-items-center rounded-full border-2 bg-card",
                    d.conquistado ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30",
                  )}
                >
                  {d.conquistado && <CheckCircle2 className="size-3" />}
                </span>
                <div className={cn("text-sm font-semibold", !d.conquistado && "text-muted-foreground")}>{d.cargo}</div>
                <div className="text-xs text-muted-foreground">
                  {d.trilha}
                  {d.data && ` · ${new Date(d.data).toLocaleDateString("pt-BR")}`}
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Atividade</h2>
            <div className="mt-4">
              <Heatmap atividade={atividade} semanas={22} />
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Award className="size-4 text-amber-500" /> Entregas
            </h2>
            {concluidos.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum ticket concluído ainda. O primeiro está te esperando no quadro!</p>
            ) : (
              <ul className="mt-3 divide-y">
                {concluidos.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    <span className="truncate">{t.titulo}</span>
                    <XpChip xp={t.xpGanho ?? t.xp} className="ml-auto" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-5">
        <div>
          <h2 className="text-sm font-semibold">Recomeçar do zero</h2>
          <p className="text-xs text-muted-foreground">Zera XP, tickets e histórico. Seus arquivos em suporte-inteligente continuam lá.</p>
        </div>
        <Button variant="destructive" onClick={() => setConfirmando(true)} className="gap-2">
          <RotateCcw className="size-4" /> Reiniciar progresso
        </Button>
      </section>

      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reiniciar todo o progresso?</DialogTitle>
            <DialogDescription>Você perde {perfil.xp} XP, o cargo atual e o histórico de revisões. Isso não pode ser desfeito.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={resetar}>
              Sim, reiniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Mini({ Icone, cor, valor, rotulo }: { Icone: typeof Zap; cor: string; valor: number; rotulo: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <Icone className={cn("size-4", cor)} />
      <div className="mt-2 font-mono text-2xl font-bold">{valor}</div>
      <div className="text-xs text-muted-foreground">{rotulo}</div>
    </div>
  );
}
