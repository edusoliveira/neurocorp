"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  FileCode2,
  FolderOpen,
  GitPullRequestArrow,
  Lock,
  Play,
  Rocket,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { postJson, recarregarTudo, tempoRelativo, useTicket } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AvatarPersona, MdInline, PrioridadeIcone, StatusBadge, TipoBadge, XpChip } from "@/components/app/pecas";
import { useSubmeter } from "@/components/app/submeter";

const vscode = (caminho: string) => `vscode://file/${caminho.replace(/\\/g, "/")}`;

export default function PaginaTicket() {
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useTicket(id);
  const { submeter, ocupado } = useSubmeter();
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const status = data?.ticket.status;
  const podeSubmeter = !!status && status !== "bloqueado" && status !== "todo";

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && data && podeSubmeter && !ocupado) {
        e.preventDefault();
        submeter(data.ticket.id, data.ticket.titulo);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [data, podeSubmeter, ocupado, submeter]);

  if (error) return <div className="p-10 text-sm text-muted-foreground">{error.message}</div>;
  if (!data) return <div className="p-10 text-sm text-muted-foreground">Carregando ticket…</div>;
  const { ticket, trilha, markdown, solicitante, criterios, submissoes, arquivos, workspace } = data;

  const comecar = async () => {
    setIniciando(true);
    try {
      const r = await postJson<{ criados: string[]; existentes: string[] }>(`/api/tickets/${ticket.id}/iniciar`);
      await mutate();
      recarregarTudo();
      toast.success("Ticket em andamento!", {
        description: r.criados.length ? `Criei ${r.criados.join(", ")} na sua pasta. Abra no VS Code e mãos à obra.` : "Seus arquivos já existiam — nada foi sobrescrito.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar");
    } finally {
      setIniciando(false);
    }
  };

  const enviarArquivos = (lista: FileList | null) => {
    const arquivosPy = Array.from(lista ?? []).filter((f) => /\.(py|toml)$/.test(f.name));
    if (!arquivosPy.length) return toast.error("Envie arquivos .py ou .toml");
    submeter(ticket.id, ticket.titulo, arquivosPy);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/quadro" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Quadro
        </Link>
        <ChevronRight className="size-3" />
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: trilha.cor }} />
          {trilha.titulo}
        </span>
        <ChevronRight className="size-3" />
        <span className="font-mono">{ticket.id}</span>
      </nav>

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <TipoBadge tipo={ticket.tipo} />
          <PrioridadeIcone prioridade={ticket.prioridade} comRotulo />
          <StatusBadge status={ticket.status} />
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{ticket.titulo}</h1>
      </motion.header>

      {ticket.status === "bloqueado" && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border bg-muted/50 p-4 text-sm">
          <Lock className="size-4" /> Este ticket será liberado quando você concluir o anterior.
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border bg-card p-7">
            <div className="mb-6 flex items-center gap-3 border-b pb-5">
              <AvatarPersona persona={solicitante} tamanho={38} />
              <div className="text-sm">
                <div className="font-semibold">{solicitante.nome}</div>
                <div className="text-xs text-muted-foreground">{solicitante.cargo} · abriu este ticket</div>
              </div>
            </div>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </motion.article>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-4 text-emerald-500" /> Critérios de aceite
            </h2>
            <ul className="mt-4 space-y-2.5">
              {criterios.map((c, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }} className="flex items-start gap-3 text-sm">
                  {c.ok === null ? (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                  ) : c.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  )}
                  <MdInline texto={c.texto} className={cn(c.ok && "text-muted-foreground line-through decoration-emerald-500/40")} />
                </motion.li>
              ))}
            </ul>
            {criterios.every((c) => c.ok === null) && <p className="mt-4 text-xs text-muted-foreground">Os critérios são marcados automaticamente a cada submissão.</p>}
          </motion.section>
        </div>

        <aside className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl border bg-card p-5">
            {ticket.status === "todo" ? (
              <Button size="lg" className="h-11 w-full gap-2 text-sm" onClick={comecar} disabled={iniciando}>
                <Play className="size-4" /> {iniciando ? "Preparando arquivos…" : "Começar ticket"}
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-11 w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm text-white hover:opacity-90"
                disabled={!podeSubmeter || ocupado}
                onClick={() => submeter(ticket.id, ticket.titulo)}
              >
                <GitPullRequestArrow className="size-4" />
                {ticket.status === "done" ? "Submeter de novo" : "Submeter para revisão"}
              </Button>
            )}
            {podeSubmeter && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Lê os arquivos da sua pasta · <kbd className="font-mono">Ctrl+Enter</kbd>
              </p>
            )}

            {podeSubmeter && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastandoArquivo(true);
                }}
                onDragLeave={() => setArrastandoArquivo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastandoArquivo(false);
                  enviarArquivos(e.dataTransfer.files);
                }}
                onClick={() => inputArquivo.current?.click()}
                className={cn(
                  "mt-4 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors hover:border-violet-500/50 hover:bg-violet-500/5",
                  arrastandoArquivo && "border-violet-500 bg-violet-500/10 text-foreground",
                )}
              >
                <Upload className="size-4" />
                ou arraste seus arquivos <span className="font-mono">.py</span> aqui
                <input ref={inputArquivo} type="file" accept=".py,.toml" multiple hidden onChange={(e) => enviarArquivos(e.target.files)} />
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Code2 className="size-4 text-violet-500" /> Arquivos do ticket
            </h3>
            <ul className="mt-3 space-y-1.5">
              {arquivos.map((a) => (
                <li key={a.caminho}>
                  <a
                    href={vscode(a.absoluto)}
                    className="group flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs transition-colors hover:border-violet-500/40 hover:bg-violet-500/5"
                    title="Abrir no VS Code"
                  >
                    <FileCode2 className={cn("size-3.5", a.existe ? "text-sky-500" : "text-muted-foreground")} />
                    <span className="truncate">{a.caminho}</span>
                    {!a.existe && <span className="ml-auto text-[10px] text-muted-foreground">não criado</span>}
                    {a.existe && <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">abrir ↗</span>}
                  </a>
                </li>
              ))}
            </ul>
            <a href={vscode(workspace)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <FolderOpen className="size-3.5" /> Abrir a pasta suporte-inteligente no VS Code
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
            <Linha rotulo="Recompensa">
              <XpChip xp={ticket.xp} />
            </Linha>
            <Linha rotulo="Estimativa">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 text-muted-foreground" />
                {ticket.estimativa}
              </span>
            </Linha>
            <Linha rotulo="Tentativas">{ticket.tentativas}</Linha>
            {ticket.semDicas && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                🏆 Desafio de promoção: o Tech Lead Bot não dá dicas aqui. Mostre o que aprendeu!
              </div>
            )}
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Conceitos</div>
              <div className="flex flex-wrap gap-1.5">
                {ticket.conceitos?.map((c) => (
                  <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {submissoes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border bg-card p-5">
              <h3 className="text-sm font-semibold">Histórico de revisões</h3>
              <ol className="relative mt-4 space-y-3 border-l pl-4">
                {submissoes.map((s) => {
                  const passaram = s.testes.filter((t) => t.passou).length;
                  return (
                    <li key={s.id} className="relative">
                      <span className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-card", s.aprovado ? "bg-emerald-500" : "bg-amber-500")} />
                      <Link href={`/review/${s.id}`} className="group block rounded-lg px-2 py-1 -mx-2 hover:bg-muted/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">
                            Tentativa #{s.tentativa} · {s.aprovado ? <span className="text-emerald-500">aprovada</span> : <span className="text-amber-500">mudanças pedidas</span>}
                          </span>
                          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {passaram}/{s.testes.length} testes · {tempoRelativo(s.data)}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          )}

          {ticket.status === "done" && data.proximoTicketId && (
            <Link href={`/ticket/${data.proximoTicketId}`} className="flex items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-500/15 dark:text-violet-300">
              <span className="inline-flex items-center gap-2">
                <Rocket className="size-4" /> Próximo ticket: {data.proximoTicketId}
              </span>
              <ChevronRight className="size-4" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <span>{children}</span>
    </div>
  );
}
