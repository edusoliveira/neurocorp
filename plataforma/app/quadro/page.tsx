"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CheckCircle2, CircleDashed, Eye, Lock, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { postJson, recarregarTudo, useEstado } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import type { Persona, StatusTicket, TicketResumo } from "@/lib/tipos";
import { AvatarPersona, PrioridadeIcone, TipoBadge, XpChip } from "@/components/app/pecas";
import { useSubmeter } from "@/components/app/submeter";

const COLUNAS: { id: StatusTicket; titulo: string; Icone: typeof Lock; cor: string; dica: string }[] = [
  { id: "bloqueado", titulo: "Backlog", Icone: Lock, cor: "text-muted-foreground", dica: "Liberados quando você termina o anterior" },
  { id: "todo", titulo: "A fazer", Icone: CircleDashed, cor: "text-muted-foreground", dica: "Arraste para Fazendo para começar" },
  { id: "doing", titulo: "Fazendo", Icone: Play, cor: "text-sky-500", dica: "Arraste para Revisão para submeter" },
  { id: "review", titulo: "Revisão", Icone: Eye, cor: "text-amber-500", dica: "Solte aqui para o Tech Lead Bot corrigir" },
  { id: "done", titulo: "Concluído", Icone: CheckCircle2, cor: "text-emerald-500", dica: "Aprovados no code review" },
];

export default function Quadro() {
  const { data, mutate } = useEstado();
  const router = useRouter();
  const { submeter } = useSubmeter();
  const [trilhaId, setTrilhaId] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<TicketResumo | null>(null);
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const trilhasComTickets = useMemo(() => data?.trilhas.filter((t) => t.tickets.length) ?? [], [data]);
  const trilhaPadrao = trilhasComTickets.find((t) => !t.concluida) ?? trilhasComTickets.at(-1);
  const trilha = trilhasComTickets.find((t) => t.id === trilhaId) ?? trilhaPadrao;

  if (!data || !trilha) return <div className="p-10 text-sm text-muted-foreground">Carregando quadro…</div>;

  const porColuna = (c: StatusTicket) => trilha.tickets.filter((t) => t.status === c);

  const aoComecar = (e: DragStartEvent) => setArrastando(trilha.tickets.find((t) => t.id === e.active.id) ?? null);

  const aoSoltar = async (e: DragEndEvent) => {
    setArrastando(null);
    const ticket = trilha.tickets.find((t) => t.id === e.active.id);
    const destino = e.over?.id as StatusTicket | undefined;
    if (!ticket || !destino || destino === ticket.status) return;
    try {
      if (destino === "review") {
        await submeter(ticket.id, ticket.titulo);
      } else if (destino === "doing" || destino === "todo") {
        if (ticket.status === "review" && destino === "doing") return;
        await postJson(`/api/tickets/${ticket.id}/mover`, { coluna: destino });
        await mutate();
        if (destino === "doing") toast.success(`${ticket.id} em andamento`, { description: "Os arquivos iniciais foram criados na sua pasta. Abra o VS Code!" });
      } else if (destino === "done") {
        toast("Só o code review move para Concluído 😉", { description: "Solte o card em Revisão para submeter." });
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível mover.");
      recarregarTudo();
    }
  };

  return (
    <div className="flex h-full flex-col px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quadro da sprint</h1>
          <p className="mt-1 text-sm text-muted-foreground">Arraste os cards entre as colunas, ou clique para abrir o ticket.</p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-card/70 p-1">
          {trilhasComTickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setTrilhaId(t.id)}
              className={cn(
                "relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                t.id === trilha.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.id === trilha.id && <motion.span layoutId="trilha-ativa" className="absolute inset-0 rounded-md bg-muted" />}
              <span className="relative inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: t.cor }} />
                {t.titulo}
              </span>
            </button>
          ))}
        </div>
      </header>

      <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragStart={aoComecar} onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
        <div className="mt-6 grid min-h-0 flex-1 auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
          {COLUNAS.map((col) => (
            <Coluna key={col.id} coluna={col} tickets={porColuna(col.id)} personas={data.personas} arrastando={arrastando} onAbrir={(id) => router.push(`/ticket/${id}`)} />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 200 }}>
          {arrastando && <Card ticket={arrastando} persona={data.personas[arrastando.solicitante]} flutuando />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Coluna({
  coluna,
  tickets,
  personas,
  arrastando,
  onAbrir,
}: {
  coluna: (typeof COLUNAS)[number];
  tickets: TicketResumo[];
  personas: Record<string, Persona>;
  arrastando: TicketResumo | null;
  onAbrir: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id, disabled: coluna.id === "bloqueado" });
  const alvoValido =
    !!arrastando &&
    ((coluna.id === "review" && arrastando.status !== "review") ||
      (coluna.id === "doing" && arrastando.status === "todo") ||
      (coluna.id === "todo" && arrastando.status === "doing"));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] flex-col rounded-2xl border bg-card/40 p-2.5 backdrop-blur transition-all",
        alvoValido && "border-dashed border-violet-500/50 bg-violet-500/5",
        isOver && alvoValido && "scale-[1.01] border-violet-500 bg-violet-500/10",
      )}
    >
      <div className="flex items-center gap-2 px-2 pt-1.5 pb-3">
        <coluna.Icone className={cn("size-4", coluna.cor)} />
        <span className="text-sm font-semibold">{coluna.titulo}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{tickets.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {tickets.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <CardArrastavel ticket={t} persona={personas[t.solicitante]} onAbrir={onAbrir} />
            </motion.div>
          ))}
        </AnimatePresence>
        {tickets.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground/70">{coluna.dica}</div>
        )}
      </div>
    </div>
  );
}

function CardArrastavel({ ticket, persona, onAbrir }: { ticket: TicketResumo; persona?: Persona; onAbrir: (id: string) => void }) {
  const travado = ticket.status === "bloqueado" || ticket.status === "done";
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: ticket.id, disabled: travado });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => ticket.status !== "bloqueado" && onAbrir(ticket.id)} className={cn(isDragging && "opacity-30")}>
      <Card ticket={ticket} persona={persona} />
    </div>
  );
}

function Card({ ticket, persona, flutuando }: { ticket: TicketResumo; persona?: Persona; flutuando?: boolean }) {
  const bloqueado = ticket.status === "bloqueado";
  return (
    <div
      className={cn(
        "group rounded-xl border bg-card p-3.5 shadow-sm transition-all",
        bloqueado ? "cursor-not-allowed opacity-50" : "cursor-grab hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-md active:cursor-grabbing",
        ticket.tipo === "desafio" && !bloqueado && "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent",
        flutuando && "rotate-2 cursor-grabbing border-violet-500/60 shadow-2xl shadow-violet-500/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{ticket.id}</span>
        {bloqueado ? <Lock className="size-3.5 text-muted-foreground" /> : <PrioridadeIcone prioridade={ticket.prioridade} />}
      </div>
      <div className="mt-1.5 text-sm leading-snug font-medium">{ticket.titulo}</div>
      <div className="mt-3 flex items-center gap-2">
        <TipoBadge tipo={ticket.tipo} />
        {ticket.tentativas > 0 && ticket.status !== "done" && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground" title="Tentativas">
            <RotateCcw className="size-3" />
            {ticket.tentativas}
          </span>
        )}
        <XpChip xp={ticket.xp} className="ml-auto" />
        <AvatarPersona persona={persona} tamanho={22} />
      </div>
    </div>
  );
}
