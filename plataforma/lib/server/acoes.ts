import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dentroDe, WORKSPACE } from "./caminhos";
import { acharTicket, carregarTrilhas, listarArquivos } from "./conteudo";
import { corrigir } from "./corretor";
import { calcularNivel, resumirTrilhas } from "./estado";
import { atualizarProgresso, lerProgresso, progressoDoTicket, salvarSubmissao } from "./progresso";
import type { Recompensa, Submissao } from "../tipos";

export class ErroAcao extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function statusAtual(id: string) {
  const trilhas = carregarTrilhas();
  const resumo = resumirTrilhas(trilhas, lerProgresso());
  const ticket = resumo.flatMap((t) => t.tickets).find((t) => t.id === id);
  if (!ticket) throw new ErroAcao("Ticket não encontrado.", 404);
  return { trilhas, resumo, ticket };
}

/** Move o ticket para "Fazendo" e cria os arquivos iniciais (sem sobrescrever o que já existe). */
export function iniciarTicket(id: string): { criados: string[]; existentes: string[] } {
  const { trilhas, ticket } = statusAtual(id);
  if (ticket.status === "bloqueado") throw new ErroAcao("Esse ticket ainda está bloqueado. Termine o anterior primeiro.");
  const conteudo = acharTicket(id, trilhas)!;
  const criados: string[] = [];
  const existentes: string[] = [];
  for (const rel of listarArquivos(conteudo, "iniciais")) {
    const destino = dentroDe(WORKSPACE, rel);
    if (fs.existsSync(destino)) {
      existentes.push(rel);
      continue;
    }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(path.join(conteudo.pasta, "iniciais", rel), destino);
    criados.push(rel);
  }
  atualizarProgresso((p) => {
    const t = progressoDoTicket(p, id);
    if (t.status === "todo") {
      t.status = "doing";
      t.iniciadoEm = new Date().toISOString();
      p.eventos.push({ tipo: "inicio", ticketId: id, data: t.iniciadoEm });
    }
  });
  return { criados, existentes };
}

/** Volta um ticket de "Fazendo" para "A fazer" (arrastar no quadro). */
export function moverTicket(id: string, coluna: "todo" | "doing"): void {
  const { ticket } = statusAtual(id);
  if (ticket.status === "bloqueado" || ticket.status === "done") throw new ErroAcao("Esse ticket não pode ser movido.");
  if (coluna === "doing") {
    iniciarTicket(id);
    return;
  }
  atualizarProgresso((p) => {
    progressoDoTicket(p, id).status = "todo";
  });
}

export function revelarDica(id: string, teste: string): number {
  statusAtual(id);
  return atualizarProgresso((p) => {
    const t = progressoDoTicket(p, id);
    t.dicasReveladas[teste] = (t.dicasReveladas[teste] ?? 0) + 1;
    return t.dicasReveladas[teste];
  });
}

/** Mapeia arquivos enviados por upload (pelo nome) para os caminhos esperados do ticket. */
export function mapearUploads(arquivosTicket: string[], enviados: { nome: string; conteudo: string }[]) {
  const mapa: Record<string, string> = {};
  const ignorados: string[] = [];
  for (const e of enviados) {
    const nome = e.nome.replace(/\\/g, "/");
    const alvo =
      arquivosTicket.find((a) => a === nome) ??
      arquivosTicket.find((a) => a.endsWith(`/${nome}`)) ??
      arquivosTicket.find((a) => path.posix.basename(a) === path.posix.basename(nome));
    if (alvo) mapa[alvo] = e.conteudo;
    else ignorados.push(e.nome);
  }
  return { mapa, ignorados };
}

export async function submeterTicket(id: string, uploads: Record<string, string> = {}): Promise<Submissao> {
  const { trilhas, ticket } = statusAtual(id);
  if (ticket.status === "bloqueado") throw new ErroAcao("Esse ticket ainda está bloqueado.");
  const conteudo = acharTicket(id, trilhas)!;

  const resultado = await corrigir(conteudo, uploads);
  const data = new Date().toISOString();

  const submissao = atualizarProgresso((p) => {
    const t = progressoDoTicket(p, id);
    const jaConcluido = t.status === "done";
    t.tentativas += 1;
    const s: Submissao = { id: randomUUID().slice(0, 8), ticketId: id, data, tentativa: t.tentativas, ...resultado };
    p.eventos.push({ tipo: "submissao", ticketId: id, data });

    if (resultado.erroInterno) return s;

    if (!resultado.aprovado) {
      if (!jaConcluido) t.status = "review";
      return s;
    }
    if (jaConcluido) return s; // reenvio de ticket já concluído: sem XP de novo

    // Recompensa
    const bonus: Recompensa["bonus"] = [];
    if (t.tentativas === 1) bonus.push({ motivo: "De primeira! 🎯", xp: 20 });
    if (!resultado.comentarios.some((c) => c.origem === "lint")) bonus.push({ motivo: "Código limpo ✨", xp: 10 });
    if (Object.keys(t.dicasReveladas).length === 0 && !conteudo.meta.semDicas) bonus.push({ motivo: "Sem usar dicas 🧠", xp: 10 });
    const total = conteudo.meta.xp + bonus.reduce((a, b) => a + b.xp, 0);
    const nivelAntes = calcularNivel(p.xp).nivel;
    p.xp += total;
    t.status = "done";
    t.concluidoEm = data;
    t.xpGanho = total;
    p.eventos.push({ tipo: "conclusao", ticketId: id, data });

    const recompensa: Recompensa = {
      xpBase: conteudo.meta.xp,
      bonus,
      total,
      subiuNivel: calcularNivel(p.xp).nivel > nivelAntes,
    };

    // Próximo ticket desbloqueado / promoção
    const resumo = resumirTrilhas(trilhas, p);
    const trilha = resumo.find((tr) => tr.id === conteudo.trilhaId)!;
    const todos = resumo.flatMap((tr) => tr.tickets);
    const proximo = todos[todos.findIndex((x) => x.id === id) + 1];
    if (proximo) p.eventos.push({ tipo: "desbloqueio", ticketId: proximo.id, data: new Date(Date.parse(data) + 1000).toISOString() });
    if (trilha.concluida && !p.trilhasConcluidas[trilha.id]) {
      p.trilhasConcluidas[trilha.id] = data;
      p.eventos.push({ tipo: "promocao", trilhaId: trilha.id, cargo: trilha.cargoAoConcluir, data: new Date(Date.parse(data) + 500).toISOString() });
      recompensa.promocao = { cargo: trilha.cargoAoConcluir, trilha: trilha.titulo };
    }
    s.recompensa = recompensa;
    return s;
  });

  salvarSubmissao(submissao);
  return submissao;
}
