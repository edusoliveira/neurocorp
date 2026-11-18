"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Flame, FolderOpen, Hash, Sparkles, Target, Zap } from "lucide-react";
import { tempoRelativo, useEstado } from "@/lib/cliente";
import { AvatarPersona, BarraXp, PrioridadeIcone, StatusBadge, TipoBadge, XpChip } from "@/components/app/pecas";
import { Heatmap } from "@/components/app/heatmap";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const aparecer = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, type: "spring" as const, stiffness: 200, damping: 24 },
});

export default function Inicio() {
  const { data } = useEstado();
  if (!data) return <Esqueleto />;
  const { perfil, trilhas, personas, feed, atividade, workspace } = data;
  const tickets = trilhas.flatMap((t) => t.tickets);
  const atual =
    tickets.find((t) => t.status === "review") ??
    tickets.find((t) => t.status === "doing") ??
    tickets.find((t) => t.status === "todo");
  const trilhaAtual = trilhas.find((t) => t.tickets.some((x) => x.id === atual?.id));
  const feitosNaTrilha = trilhaAtual?.tickets.filter((t) => t.status === "done").length ?? 0;

  const stats = [
    { rotulo: "XP total", valor: perfil.xp, Icone: Zap, cor: "text-violet-500" },
    { rotulo: "Tickets concluídos", valor: `${perfil.ticketsConcluidos}/${perfil.ticketsTotal}`, Icone: CheckCircle2, cor: "text-emerald-500" },
    { rotulo: "Dias seguidos", valor: perfil.sequenciaDias, Icone: Flame, cor: "text-orange-500" },
    { rotulo: "Nível", valor: perfil.nivel, Icone: Target, cor: "text-sky-500" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 lg:px-10">
      <motion.header {...aparecer(0)} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{saudacao()} 👋</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Bem-vindo(a) à <span className="texto-gradiente">NeuroCorp</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você é <span className="font-medium text-foreground">{perfil.cargo}</span>
            {perfil.proximoCargo && (
              <>
                {" "}· próxima promoção: <span className="font-medium text-foreground">{perfil.proximoCargo}</span>
              </>
            )}
          </p>
        </div>
        <div className="w-full max-w-xs rounded-xl border bg-card/70 p-4 backdrop-blur">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Nível {perfil.nivel}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {perfil.xpNoNivel}/{perfil.xpProximoNivel} XP
            </span>
          </div>
          <BarraXp atual={perfil.xpNoNivel} total={perfil.xpProximoNivel} className="mt-2.5" />
        </div>
      </motion.header>

      {!workspace.existe && (
        <motion.div {...aparecer(1)} className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <FolderOpen className="mt-0.5 size-4 text-amber-500" />
          <div>
            <div className="font-medium">Sua pasta de trabalho ainda não existe</div>
            <div className="text-muted-foreground">
              Rode <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">npm run setup</code> dentro de <code className="font-mono text-xs">plataforma/</code> para criar {workspace.caminho}.
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.rotulo} {...aparecer(i + 1)} className="rounded-xl border bg-card/70 p-4 backdrop-blur">
            <s.Icone className={cn("size-4", s.cor)} />
            <div className="mt-3 font-mono text-2xl font-bold tracking-tight">{s.valor}</div>
            <div className="text-xs text-muted-foreground">{s.rotulo}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {atual ? (
            <motion.section {...aparecer(5)} className="group relative overflow-hidden rounded-2xl border bg-card p-6">
              <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-violet-500/15 blur-3xl transition-opacity group-hover:opacity-80" />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Seu ticket atual</span>
                <StatusBadge status={atual.status} />
              </div>
              <div className="relative mt-4 flex items-start gap-3">
                <AvatarPersona persona={personas[atual.solicitante]} tamanho={40} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{atual.id}</span>
                    <TipoBadge tipo={atual.tipo} />
                    <PrioridadeIcone prioridade={atual.prioridade} comRotulo />
                  </div>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{atual.titulo}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pedido por {personas[atual.solicitante]?.nome} · {atual.estimativa} · {atual.conceitos?.join(", ")}
                  </p>
                </div>
              </div>
              <div className="relative mt-5 flex items-center justify-between gap-3">
                <XpChip xp={atual.xp} className="text-xs" />
                <Link href={`/ticket/${atual.id}`} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                  {atual.status === "todo" ? "Começar" : atual.status === "review" ? "Ver correções" : "Continuar"}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              {trilhaAtual && (
                <div className="relative mt-5 border-t pt-4">
                  <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                    <span>Trilha {trilhaAtual.titulo}</span>
                    <span>
                      {feitosNaTrilha}/{trilhaAtual.tickets.length}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {trilhaAtual.tickets.map((t) => (
                      <div
                        key={t.id}
                        title={`${t.id} · ${t.titulo}`}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          t.status === "done" ? "bg-emerald-500" : t.id === atual.id ? "animate-pulse bg-violet-500" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          ) : (
            <motion.section {...aparecer(5)} className="rounded-2xl border bg-card p-8 text-center">
              <Sparkles className="mx-auto size-8 text-violet-500" />
              <h2 className="mt-3 text-lg font-semibold">Todos os tickets disponíveis foram concluídos!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Novas trilhas chegam em breve. Confira o mapa de trilhas.</p>
            </motion.section>
          )}

          <motion.section {...aparecer(6)} className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Atividade</h3>
              <span className="text-xs text-muted-foreground">submissões por dia</span>
            </div>
            <Heatmap atividade={atividade} />
          </motion.section>
        </div>

        <motion.section {...aparecer(7)} className="flex flex-col rounded-2xl border bg-card lg:col-span-2">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <Hash className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">time-suporte-inteligente</h3>
          </div>
          <div className="flex max-h-[520px] flex-col gap-5 overflow-y-auto p-5">
            {feed.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
            {feed.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex gap-3">
                <AvatarPersona persona={personas[m.autor]} tamanho={34} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{personas[m.autor]?.nome}</span>
                    <span className="text-[11px] text-muted-foreground">{tempoRelativo(m.data)}</span>
                  </div>
                  <p className={cn("mt-0.5 text-sm leading-relaxed", m.tipo === "promocao" && "font-medium text-amber-500")}>{m.texto}</p>
                  {m.ticketId && m.tipo === "abertura" && (
                    <Link href={`/ticket/${m.ticketId}`} className="mt-1.5 inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground">
                      {m.ticketId} <ArrowRight className="size-3" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 lg:px-10">
      <div className="h-16 w-80 animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
