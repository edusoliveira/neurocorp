import "server-only";
import fs from "node:fs";
import path from "node:path";
import { WORKSPACE } from "./caminhos";
import { acharTicket, carregarPersonas, carregarTrilhas, lerMarkdown, listarArquivos } from "./conteudo";
import { destacar } from "./destaque";
import { resumirTrilhas } from "./estado";
import { lerProgresso, listarSubmissoes } from "./progresso";
import type { ArquivoSubmetido, TicketDetalhe } from "../tipos";

export function detalharTicket(id: string): TicketDetalhe | null {
  const trilhas = carregarTrilhas();
  const conteudo = acharTicket(id, trilhas);
  if (!conteudo) return null;
  const p = lerProgresso();
  const resumo = resumirTrilhas(trilhas, p);
  const todos = resumo.flatMap((t) => t.tickets);
  const indice = todos.findIndex((t) => t.id === id);
  const ticket = todos[indice];
  const trilha = resumo.find((t) => t.id === ticket.trilhaId)!;
  const personas = carregarPersonas();
  const submissoes = listarSubmissoes(id);
  const ultima = submissoes[0];

  return {
    ticket,
    trilha: { id: trilha.id, titulo: trilha.titulo, cor: trilha.cor },
    markdown: lerMarkdown(conteudo),
    solicitante: personas[ticket.solicitante] ?? { id: ticket.solicitante, nome: ticket.solicitante, cargo: "", cor: "#64748b" },
    criterios: conteudo.meta.criterios.map((c, i) => ({ texto: c.texto, ok: ultima ? (ultima.criterios[i]?.ok ?? false) : null })),
    submissoes: submissoes.map(({ id: sid, data, aprovado, tentativa, testes }) => ({ id: sid, data, aprovado, tentativa, testes })),
    arquivos: conteudo.meta.arquivos.map((rel) => {
      const absoluto = path.join(WORKSPACE, rel);
      return { caminho: rel, absoluto, existe: fs.existsSync(absoluto) };
    }),
    workspace: WORKSPACE,
    dicasReveladas: p.tickets[id]?.dicasReveladas ?? {},
    proximoTicketId: todos[indice + 1]?.id,
  };
}

/** Solução de referência — só liberada depois que o ticket é concluído. */
export async function solucaoDoTicket(id: string): Promise<ArquivoSubmetido[] | null> {
  const trilhas = carregarTrilhas();
  const conteudo = acharTicket(id, trilhas);
  if (!conteudo) return null;
  if (lerProgresso().tickets[id]?.status !== "done") return null;
  return Promise.all(
    listarArquivos(conteudo, "solucao").map(async (rel) => ({
      caminho: rel,
      existe: true,
      linhas: await destacar(fs.readFileSync(path.join(conteudo.pasta, "solucao", rel), "utf-8"), rel),
    })),
  );
}
