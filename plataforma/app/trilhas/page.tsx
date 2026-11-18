"use client";
import { Fragment } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { CalendarDays, Check, Clock, FolderGit2, Lock, Send, Trophy } from "lucide-react";
import { useEstado } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import type { TicketResumo } from "@/lib/tipos";

export default function Trilhas() {
  const { data } = useEstado();
  if (!data) return <div className="p-10 text-sm text-muted-foreground">Carregando trilhas…</div>;
  const atualId = data.trilhas.flatMap((t) => t.tickets).find((t) => t.status !== "done" && t.status !== "bloqueado")?.id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold tracking-tight">Mapa de trilhas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Do Python básico a Arquiteto(a) de IA. Cada trilha concluída é uma promoção, e cada fase termina num projeto de portfólio.
      </p>

      <div className="relative mt-10">
        <div className="absolute top-0 bottom-0 left-[27px] w-0.5 bg-gradient-to-b from-violet-500/60 via-border to-border" />
        <div className="space-y-8">
          {data.trilhas.map((trilha, i) => {
            const feitos = trilha.tickets.filter((t) => t.status === "done").length;
            const ativa = trilha.tickets.some((t) => t.id === atualId);
            return (
              <Fragment key={trilha.id}>
                <motion.section
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4) }}
                  className="relative flex gap-5"
                >
                  <div
                    className={cn(
                      "relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border-2 bg-card font-mono text-lg font-bold shadow-sm",
                      trilha.concluida && "border-emerald-500 text-emerald-500",
                      ativa && "border-violet-500 text-violet-500 shadow-lg shadow-violet-500/30",
                      trilha.emBreve && "border-dashed text-muted-foreground",
                    )}
                    style={ativa ? { boxShadow: `0 0 0 6px color-mix(in oklch, ${trilha.cor} 20%, transparent)` } : undefined}
                  >
                    {trilha.concluida ? <Check className="size-6" /> : trilha.ordem}
                  </div>

                  <div className={cn("min-w-0 flex-1 rounded-2xl border bg-card p-5", trilha.emBreve && "bg-card/50")}>
                    {(trilha.fase || trilha.periodo) && (
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground">
                        {trilha.fase && <span className="tracking-wide uppercase">{trilha.fase}</span>}
                        {trilha.periodo && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3" /> {trilha.periodo}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className={cn("text-lg font-semibold tracking-tight", trilha.emBreve && "text-foreground/80")}>{trilha.titulo}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">{trilha.descricao}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                          trilha.concluida ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "text-muted-foreground",
                        )}
                      >
                        <Trophy className="size-3.5" /> {trilha.cargoAoConcluir}
                      </span>
                    </div>

                    {trilha.topicos && trilha.topicos.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {trilha.topicos.map((t) => (
                          <span key={t} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-foreground/80">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {trilha.projeto && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-violet-500/25 bg-violet-500/[0.07] p-3 text-sm">
                        <FolderGit2 className="mt-0.5 size-4 shrink-0 text-violet-500" />
                        <span>{trilha.projeto}</span>
                      </div>
                    )}

                    {trilha.emBreve ? (
                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" /> Tickets em breve
                      </div>
                    ) : (
                      <>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          {trilha.tickets.map((t, j) => (
                            <NoTicket key={t.id} ticket={t} atual={t.id === atualId} indice={j} />
                          ))}
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          {feitos}/{trilha.tickets.length} tickets concluídos
                        </div>
                      </>
                    )}
                  </div>
                </motion.section>

                {trilha.marco && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.05 + 0.1, 0.5) }}
                    className="relative flex items-center gap-5"
                  >
                    <div className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
                      <Send className="size-5" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-transparent px-5 py-3.5">
                      <div className="text-[11px] font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">Marco</div>
                      <div className="font-semibold">{trilha.marco}</div>
                    </div>
                  </motion.div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NoTicket({ ticket, atual, indice }: { ticket: TicketResumo; atual: boolean; indice: number }) {
  const bloqueado = ticket.status === "bloqueado";
  const feito = ticket.status === "done";
  const conteudo = (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.15 + indice * 0.03, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={bloqueado ? undefined : { scale: 1.12, y: -2 }}
      title={`${ticket.id} · ${ticket.titulo}`}
      className={cn(
        "relative grid size-11 place-items-center rounded-xl border font-mono text-[11px] font-semibold transition-colors",
        feito && "border-emerald-500/40 bg-emerald-500/15 text-emerald-500",
        atual && "border-violet-500 bg-violet-500/15 text-violet-500",
        bloqueado && "text-muted-foreground/50",
        ticket.tipo === "desafio" && !feito && "border-amber-500/50 text-amber-500",
      )}
    >
      {atual && <span className="absolute inset-0 animate-ping rounded-xl border border-violet-500/60" />}
      {feito ? <Check className="size-4" /> : bloqueado ? ticket.tipo === "desafio" ? <Trophy className="size-4" /> : <Lock className="size-3.5" /> : ticket.id.replace("T0", "")}
    </motion.div>
  );
  return bloqueado ? conteudo : <Link href={`/ticket/${ticket.id}`}>{conteudo}</Link>;
}
