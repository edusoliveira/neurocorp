import "server-only";
import fs from "node:fs";
import { carregarPersonas, carregarRoadmap, carregarTrilhas, type TrilhaConteudo } from "./conteudo";
import { lerProgresso, listarSubmissoes, type Progresso } from "./progresso";
import { WORKSPACE } from "./caminhos";
import type { Estado, MensagemFeed, Perfil, StatusTicket, TicketResumo, TrilhaResumo } from "../tipos";

/** XP necessário para sair do nível n para o n+1 (curva crescente). */
const xpDoNivel = (n: number) => 150 * n;

export function calcularNivel(xp: number) {
  let nivel = 1;
  let resto = xp;
  while (resto >= xpDoNivel(nivel)) {
    resto -= xpDoNivel(nivel);
    nivel++;
  }
  return { nivel, xpNoNivel: resto, xpProximoNivel: xpDoNivel(nivel) };
}

export function dia(dataIso: string): string {
  const d = new Date(dataIso);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const diaMes = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${diaMes}`;
}

/** Calcula o status de cada ticket: só o próximo da fila fica liberado. */
export function resumirTrilhas(trilhas: TrilhaConteudo[], p: Progresso): TrilhaResumo[] {
  let liberado = true;
  return trilhas.map((t) => {
    const tickets: TicketResumo[] = t.tickets.map((tc) => {
      const prog = p.tickets[tc.meta.id];
      let status: StatusTicket = prog?.status ?? "todo";
      if (!liberado && status !== "done") status = "bloqueado";
      liberado = status === "done";
      return {
        ...tc.meta,
        pasta: tc.nomePasta,
        trilhaId: t.id,
        ordem: tc.ordem,
        status,
        tentativas: prog?.tentativas ?? 0,
        xpGanho: prog?.xpGanho,
      };
    });
    const concluida = tickets.length > 0 && tickets.every((x) => x.status === "done");
    return {
      id: t.id,
      ordem: t.ordem,
      titulo: t.titulo,
      descricao: t.descricao,
      cargoInicial: t.cargoInicial,
      cargoAoConcluir: t.cargoAoConcluir,
      cor: t.cor,
      fase: t.fase,
      periodo: t.periodo,
      topicos: t.topicos,
      projeto: t.projeto,
      marco: t.marco,
      tickets,
      concluida,
    };
  });
}

function sequenciaDeDias(atividade: Record<string, number>): number {
  let seq = 0;
  const cursor = new Date();
  // Hoje ainda sem atividade não quebra a sequência.
  if (!atividade[dia(cursor.toISOString())]) cursor.setDate(cursor.getDate() - 1);
  while (atividade[dia(cursor.toISOString())]) {
    seq++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return seq;
}

export function montarEstado(): Estado {
  const conteudo = carregarTrilhas();
  const p = lerProgresso();
  const personas = carregarPersonas();
  const trilhas = resumirTrilhas(conteudo, p);
  const roadmap = carregarRoadmap();

  const atividade: Record<string, number> = {};
  for (const s of listarSubmissoes()) {
    const d = dia(s.data);
    atividade[d] = (atividade[d] ?? 0) + 1;
  }

  // Cargo atual e próximo
  let cargo = trilhas[0]?.cargoInicial ?? "Estagiário(a) de IA";
  for (const t of trilhas) if (t.concluida) cargo = t.cargoAoConcluir;
  const proxima = trilhas.find((t) => !t.concluida);
  const proximoCargo =
    proxima?.cargoAoConcluir ??
    roadmap.filter((r) => !trilhas.some((t) => t.ordem === r.ordem)).sort((a, b) => a.ordem - b.ordem)[0]?.cargoAoConcluir;

  const todos = trilhas.flatMap((t) => t.tickets);
  const perfil: Perfil = {
    xp: p.xp,
    ...calcularNivel(p.xp),
    cargo,
    proximoCargo,
    ticketsConcluidos: todos.filter((t) => t.status === "done").length,
    ticketsTotal: todos.length,
    sequenciaDias: sequenciaDeDias(atividade),
    promocoes: p.eventos
      .filter((e) => e.tipo === "promocao")
      .map((e) => ({ cargo: e.cargo ?? "", data: e.data, trilhaId: e.trilhaId ?? "" })),
  };

  // Feed estilo chat, montado a partir dos eventos
  const feed: MensagemFeed[] = [];
  const porId = new Map(conteudo.flatMap((t) => t.tickets).map((t) => [t.meta.id, t.meta]));
  const primeiro = todos[0];
  if (primeiro?.mensagemAbertura) {
    feed.push({
      id: `abertura-${primeiro.id}`,
      autor: primeiro.solicitante,
      texto: primeiro.mensagemAbertura,
      data: p.criadoEm,
      ticketId: primeiro.id,
      tipo: "abertura",
    });
  }
  for (const e of p.eventos) {
    const meta = e.ticketId ? porId.get(e.ticketId) : undefined;
    if (e.tipo === "desbloqueio" && meta?.mensagemAbertura) {
      feed.push({ id: `abertura-${meta.id}`, autor: meta.solicitante, texto: meta.mensagemAbertura, data: e.data, ticketId: meta.id, tipo: "abertura" });
    } else if (e.tipo === "conclusao" && meta?.mensagemConclusao) {
      feed.push({ id: `conclusao-${meta.id}`, autor: meta.solicitante, texto: meta.mensagemConclusao, data: e.data, ticketId: meta.id, tipo: "conclusao" });
    } else if (e.tipo === "promocao") {
      feed.push({
        id: `promocao-${e.trilhaId}`,
        autor: "carlos",
        texto: `Pessoal, anúncio importante: a partir de hoje temos um(a) novo(a) ${e.cargo} no time! 🎉 Parabéns pelo trabalho excelente na trilha. Bora pra próxima!`,
        data: e.data,
        tipo: "promocao",
      });
    }
  }
  feed.sort((a, b) => b.data.localeCompare(a.data));

  return {
    perfil,
    trilhas: [
      ...trilhas,
      ...roadmap
        .filter((r) => !trilhas.some((t) => t.ordem === r.ordem))
        .map<TrilhaResumo>((r) => ({
          id: `futura-${r.ordem}`,
          ordem: r.ordem,
          titulo: r.titulo,
          descricao: r.descricao,
          cargoAoConcluir: r.cargoAoConcluir,
          fase: r.fase,
          periodo: r.periodo,
          topicos: r.topicos,
          projeto: r.projeto,
          marco: r.marco,
          cor: "#64748b",
          tickets: [],
          concluida: false,
          emBreve: true,
        })),
    ].sort((a, b) => a.ordem - b.ordem),
    personas,
    feed,
    atividade,
    workspace: { caminho: WORKSPACE, existe: fs.existsSync(WORKSPACE) },
  };
}
