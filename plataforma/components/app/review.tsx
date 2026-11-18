"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Lightbulb, MessageSquareWarning, PartyPopper, Sparkles, FileCode2, FileX2 } from "lucide-react";
import { postJson } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import type { ArquivoSubmetido, Comentario } from "@/lib/tipos";
import { MdInline } from "./pecas";

const ESTILO = {
  bloqueante: { Icone: MessageSquareWarning, borda: "border-red-500/30", fundo: "bg-red-500/[0.06]", cor: "text-red-500", rotulo: "Mudança necessária" },
  sugestao: { Icone: AlertTriangle, borda: "border-amber-500/30", fundo: "bg-amber-500/[0.06]", cor: "text-amber-500", rotulo: "Sugestão" },
  elogio: { Icone: PartyPopper, borda: "border-emerald-500/30", fundo: "bg-emerald-500/[0.07]", cor: "text-emerald-500", rotulo: "Aprovado" },
};

export function CardComentario({
  comentario,
  ticketId,
  reveladasIniciais,
}: {
  comentario: Comentario;
  ticketId: string;
  reveladasIniciais: number;
}) {
  const [reveladas, setReveladas] = useState(Math.min(reveladasIniciais, comentario.dicas.length));
  const e = ESTILO[comentario.severidade];
  // Sugestões de lint mostram a dica direto; dicas de teste são progressivas.
  const progressivo = comentario.origem === "teste";
  const visiveis = progressivo ? comentario.dicas.slice(0, reveladas) : comentario.dicas;

  const revelar = async () => {
    setReveladas((r) => r + 1);
    if (comentario.teste) postJson(`/api/tickets/${ticketId}/dica`, { teste: comentario.teste }).catch(() => {});
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-xl border bg-card font-sans", e.borda)}>
      <div className={cn("flex items-start gap-3 rounded-t-xl p-4", e.fundo)}>
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold">Tech Lead Bot</span>
            <span className={cn("inline-flex items-center gap-1 font-medium", e.cor)}>
              <e.Icone className="size-3.5" /> {e.rotulo}
            </span>
            {comentario.teste && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{comentario.teste}</span>}
          </div>
          <div className="mt-1.5 text-sm font-medium">
            <MdInline texto={comentario.titulo} />
          </div>
          {comentario.mensagem && (
            <div className="mt-1 text-sm text-muted-foreground">
              <MdInline texto={comentario.mensagem} />
            </div>
          )}
        </div>
      </div>
      {(visiveis.length > 0 || (progressivo && reveladas < comentario.dicas.length)) && (
        <div className="space-y-2 border-t p-3 pl-[3.75rem]">
          <AnimatePresence initial={false}>
            {visiveis.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex gap-2 text-sm"
              >
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <MdInline texto={d} />
              </motion.div>
            ))}
          </AnimatePresence>
          {progressivo && reveladas < comentario.dicas.length && (
            <button onClick={revelar} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-500/10 dark:text-violet-300">
              <Lightbulb className="size-3.5" />
              {reveladas === 0 ? "Ver uma dica" : "Ver mais uma dica"} ({reveladas}/{comentario.dicas.length})
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/** Código com números de linha e comentários do review inline, como num PR. */
export function ArquivoComComentarios({
  arquivo,
  comentarios,
  ticketId,
  dicasReveladas,
  titulo,
}: {
  arquivo: ArquivoSubmetido;
  comentarios: Comentario[];
  ticketId: string;
  dicasReveladas: Record<string, number>;
  titulo?: string;
}) {
  const porLinha = new Map<number, Comentario[]>();
  for (const c of comentarios) {
    const linha = Math.min(Math.max(c.linha ?? 1, 1), Math.max(arquivo.linhas.length, 1));
    porLinha.set(linha, [...(porLinha.get(linha) ?? []), c]);
  }
  const bloqueantes = comentarios.filter((c) => c.severidade === "bloqueante").length;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        {arquivo.existe ? <FileCode2 className="size-4 text-sky-500" /> : <FileX2 className="size-4 text-red-500" />}
        <span className="font-mono text-sm">{titulo ?? arquivo.caminho}</span>
        {comentarios.length > 0 && (
          <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium", bloqueantes ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>
            {comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}
          </span>
        )}
      </div>
      {!arquivo.existe ? (
        <div className="p-6 text-sm text-muted-foreground">Arquivo não encontrado na submissão.</div>
      ) : (
        <div className="overflow-x-auto font-mono text-[13px] leading-6">
          {arquivo.linhas.map((tokens, i) => {
            const n = i + 1;
            const doLinha = porLinha.get(n);
            return (
              <div key={n}>
                <div className={cn("flex", doLinha?.some((c) => c.severidade === "bloqueante") && "bg-red-500/[0.07]", doLinha && !doLinha.some((c) => c.severidade === "bloqueante") && "bg-amber-500/[0.06]")}>
                  <span className="w-12 shrink-0 pr-3 text-right text-muted-foreground/50 select-none">{n}</span>
                  <span className="pr-6 whitespace-pre">
                    {tokens.length === 0 ? " " : tokens.map((t, j) => (
                      <span key={j} className="tok" style={{ "--c": t.c, "--d": t.d } as React.CSSProperties}>
                        {t.t}
                      </span>
                    ))}
                  </span>
                </div>
                {doLinha && (
                  <div className="space-y-2 border-y bg-muted/30 px-4 py-3 md:pl-12">
                    {doLinha.map((c) => (
                      <CardComentario key={c.id} comentario={c} ticketId={ticketId} reveladasIniciais={c.teste ? (dicasReveladas[c.teste] ?? 0) : 0} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
