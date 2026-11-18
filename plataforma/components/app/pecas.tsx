"use client";
// Peças visuais pequenas reutilizadas em várias telas.
import { motion } from "motion/react";
import { Bug, CircleDashed, Flame, Lock, Sparkles, Trophy, Wrench, CheckCircle2, Eye, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Persona, Prioridade, StatusTicket, TipoTicket } from "@/lib/tipos";

export function AvatarPersona({ persona, tamanho = 32, className }: { persona?: Persona; tamanho?: number; className?: string }) {
  const nome = persona?.nome ?? "?";
  const iniciais = nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const cor = persona?.cor ?? "#64748b";
  return (
    <div
      title={persona ? `${persona.nome} · ${persona.cargo}` : undefined}
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white shadow-sm ring-2 ring-background", className)}
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: tamanho * 0.38,
        background: `linear-gradient(135deg, ${cor}, color-mix(in oklch, ${cor} 55%, black))`,
      }}
    >
      {persona?.id === "bot" ? <Sparkles style={{ width: tamanho * 0.5, height: tamanho * 0.5 }} /> : iniciais}
    </div>
  );
}

const PRIORIDADES: Record<Prioridade, { rotulo: string; classe: string; barras: number }> = {
  baixa: { rotulo: "Baixa", classe: "text-muted-foreground", barras: 1 },
  media: { rotulo: "Média", classe: "text-sky-500", barras: 2 },
  alta: { rotulo: "Alta", classe: "text-amber-500", barras: 3 },
  urgente: { rotulo: "Urgente", classe: "text-red-500", barras: 4 },
};

export function PrioridadeIcone({ prioridade, comRotulo }: { prioridade: Prioridade; comRotulo?: boolean }) {
  const p = PRIORIDADES[prioridade] ?? PRIORIDADES.media;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", p.classe)} title={`Prioridade ${p.rotulo}`}>
      {prioridade === "urgente" ? (
        <Flame className="size-3.5" />
      ) : (
        <span className="flex h-3 items-end gap-[2px]">
          {[1, 2, 3].map((i) => (
            <span key={i} className={cn("w-[3px] rounded-sm", i <= p.barras ? "bg-current" : "bg-current/25")} style={{ height: 4 + i * 3 }} />
          ))}
        </span>
      )}
      {comRotulo && p.rotulo}
    </span>
  );
}

const TIPOS: Record<TipoTicket, { rotulo: string; Icone: typeof Bug; classe: string }> = {
  feature: { rotulo: "Feature", Icone: Sparkles, classe: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  bug: { rotulo: "Bug", Icone: Bug, classe: "text-red-500 bg-red-500/10 border-red-500/20" },
  melhoria: { rotulo: "Melhoria", Icone: Wrench, classe: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  desafio: { rotulo: "Desafio de promoção", Icone: Trophy, classe: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
};

export function TipoBadge({ tipo }: { tipo: TipoTicket }) {
  const t = TIPOS[tipo] ?? TIPOS.feature;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", t.classe)}>
      <t.Icone className="size-3" />
      {t.rotulo}
    </span>
  );
}

const STATUS: Record<StatusTicket, { rotulo: string; Icone: typeof Bug; classe: string }> = {
  bloqueado: { rotulo: "Bloqueado", Icone: Lock, classe: "text-muted-foreground bg-muted" },
  todo: { rotulo: "A fazer", Icone: CircleDashed, classe: "text-muted-foreground bg-muted" },
  doing: { rotulo: "Fazendo", Icone: Play, classe: "text-sky-500 bg-sky-500/10" },
  review: { rotulo: "Mudanças pedidas", Icone: Eye, classe: "text-amber-500 bg-amber-500/10" },
  done: { rotulo: "Concluído", Icone: CheckCircle2, classe: "text-emerald-500 bg-emerald-500/10" },
};

export function StatusBadge({ status }: { status: StatusTicket }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.classe)}>
      <s.Icone className="size-3.5" />
      {s.rotulo}
    </span>
  );
}

export function XpChip({ xp, className }: { xp: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary", className)}>
      +{xp} XP
    </span>
  );
}

/** Barra de XP animada. */
export function BarraXp({ atual, total, className }: { atual: number; total: number; className?: string }) {
  const pct = total ? Math.min(100, (atual / total) * 100) : 0;
  return (
    <div className={cn("relative h-2 overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
      />
      <motion.div
        className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ left: ["-20%", "120%"] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
      />
    </div>
  );
}

/** Markdown curto em uma linha (para títulos e dicas com `código`). */
export function MdInline({ texto, className }: { texto: string; className?: string }) {
  return (
    <span className={cn("md-inline", className)}>
      <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{texto}</ReactMarkdown>
    </span>
  );
}
