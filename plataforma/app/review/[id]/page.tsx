"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clipboard, GitMerge, GitPullRequestArrow, RotateCcw, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { tempoRelativo, useSolucao, useSubmissao, useTicket } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArquivoComComentarios, CardComentario } from "@/components/app/review";
import { MdInline } from "@/components/app/pecas";
import { useSubmeter } from "@/components/app/submeter";

export default function PaginaReview() {
  const { id } = useParams<{ id: string }>();
  const { data: s, error } = useSubmissao(id);
  const { data: detalhe } = useTicket(s?.ticketId);
  const concluido = detalhe?.ticket.status === "done";
  const { data: solucao } = useSolucao(s?.ticketId ?? "", !!s && concluido);
  const [aba, setAba] = useState<"revisao" | "solucao">("revisao");
  const { submeter, ocupado } = useSubmeter();

  if (error) return <div className="p-10 text-sm text-muted-foreground">{error.message}</div>;
  if (!s || !detalhe) return <div className="p-10 text-sm text-muted-foreground">Carregando revisão…</div>;

  const ticket = detalhe.ticket;
  const passaram = s.testes.filter((t) => t.passou).length;
  const caminhos = new Set(s.arquivos.map((a) => a.caminho));
  const gerais = s.comentarios.filter((c) => !c.arquivo || !caminhos.has(c.arquivo));
  const bloqueantes = s.comentarios.filter((c) => c.severidade === "bloqueante").length;
  const sugestoes = s.comentarios.filter((c) => c.severidade === "sugestao").length;
  const comandoCommit = `git add -A && git commit -m "feat(${ticket.id}): ${ticket.titulo.toLowerCase()}"`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href={`/ticket/${ticket.id}`} className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {ticket.id}
        </Link>
        <ChevronRight className="size-3" />
        <span>Revisão #{s.tentativa}</span>
      </nav>

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {ticket.titulo} <span className="font-normal text-muted-foreground">#{s.tentativa}</span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white",
              s.erroInterno ? "bg-zinc-500" : s.aprovado ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" : "bg-amber-600",
            )}
          >
            {s.aprovado ? <GitMerge className="size-4" /> : <GitPullRequestArrow className="size-4" />}
            {s.erroInterno ? "Erro no corretor" : s.aprovado ? "Aprovado" : "Mudanças solicitadas"}
          </span>
          <span className="text-muted-foreground">
            Tech Lead Bot revisou {tempoRelativo(s.data)} · {s.origem === "upload" ? "arquivos enviados" : "pasta do projeto"}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Timer className="size-3.5" /> {(s.duracaoMs / 1000).toFixed(1)}s
          </span>
        </div>
      </motion.header>

      {s.erroInterno ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="font-semibold text-red-500">O corretor não conseguiu rodar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Isso não é culpa do seu código. Verifique se rodou <code className="font-mono">npm run setup</code>. Detalhes:</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs whitespace-pre-wrap">{s.erroInterno}</pre>
        </div>
      ) : (
        <>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">Testes ocultos</h2>
                <span className={cn("font-mono text-sm font-semibold", passaram === s.testes.length && s.testes.length ? "text-emerald-500" : "text-amber-500")}>
                  {passaram}/{s.testes.length}
                </span>
              </div>
              <div className="mt-3 flex gap-1">
                {s.testes.map((t, i) => (
                  <motion.div
                    key={t.nome}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    title={t.nome}
                    className={cn("h-2 flex-1 rounded-full", t.passou ? "bg-emerald-500" : "bg-red-500")}
                  />
                ))}
                {s.testes.length === 0 && <div className="h-2 flex-1 rounded-full bg-muted" />}
              </div>
              <ul className="mt-4 space-y-1.5">
                {s.testes.map((t) => (
                  <li key={t.nome} className="flex items-center gap-2 font-mono text-xs">
                    {t.passou ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                    <span className={cn(t.passou && "text-muted-foreground")}>{t.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-semibold">Critérios de aceite</h2>
              <ul className="mt-3 space-y-2">
                {s.criterios.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />}
                    <MdInline texto={c.texto} className={cn(c.ok && "text-muted-foreground")} />
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-3 border-t pt-3 text-xs text-muted-foreground">
                <span>{bloqueantes} bloqueante(s)</span>
                <span>{sugestoes} sugestão(ões)</span>
              </div>
            </div>
          </motion.section>

          {concluido && (
            <div className="mt-8 flex gap-1 border-b">
              {(["revisao", "solucao"] as const).map((a) => (
                <button key={a} onClick={() => setAba(a)} className={cn("relative px-4 py-2.5 text-sm font-medium transition-colors", aba === a ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {a === "revisao" ? "Revisão" : "Solução de referência"}
                  {aba === a && <motion.span layoutId="aba-review" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                </button>
              ))}
            </div>
          )}

          {aba === "revisao" ? (
            <div className="mt-6 space-y-5">
              {gerais.map((c) => (
                <CardComentario key={c.id} comentario={c} ticketId={ticket.id} reveladasIniciais={c.teste ? (detalhe.dicasReveladas[c.teste] ?? 0) : 0} />
              ))}
              {s.arquivos.map((a) => (
                <ArquivoComComentarios
                  key={a.caminho}
                  arquivo={a}
                  comentarios={s.comentarios.filter((c) => c.arquivo === a.caminho)}
                  ticketId={ticket.id}
                  dicasReveladas={detalhe.dicasReveladas}
                />
              ))}
              {s.aprovado && <Commit comando={comandoCommit} />}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                Esta é <em>uma</em> forma de resolver — não a única. Compare com a sua: o que ficou diferente? O que você faria igual?
              </p>
              {solucao?.arquivos.map((a) => (
                <ArquivoComComentarios key={a.caminho} arquivo={a} comentarios={[]} ticketId={ticket.id} dicasReveladas={{}} titulo={`${a.caminho} (referência)`} />
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
            {!s.aprovado && (
              <Button size="lg" className="gap-2" disabled={ocupado} onClick={() => submeter(ticket.id, ticket.titulo)}>
                <RotateCcw className="size-4" /> Corrigi, submeter de novo
              </Button>
            )}
            {s.aprovado && detalhe.proximoTicketId && (
              <Link href={`/ticket/${detalhe.proximoTicketId}`} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                Próximo ticket <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Commit({ comando }: { comando: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-sm font-semibold">Faça o commit, como no trabalho de verdade</h3>
      <p className="mt-1 text-xs text-muted-foreground">No terminal do VS Code, dentro de suporte-inteligente:</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/50 p-2 pl-3">
        <code className="flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">{comando}</code>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(comando);
            setCopiado(true);
            toast.success("Comando copiado");
            setTimeout(() => setCopiado(false), 1500);
          }}
        >
          {copiado ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
