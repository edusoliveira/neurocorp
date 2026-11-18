import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DADOS } from "./caminhos";
import type { Submissao } from "../tipos";

export interface ProgressoTicket {
  status: "todo" | "doing" | "review" | "done";
  tentativas: number;
  iniciadoEm?: string;
  concluidoEm?: string;
  xpGanho?: number;
  dicasReveladas: Record<string, number>;
}

export interface Evento {
  tipo: "inicio" | "submissao" | "conclusao" | "promocao" | "desbloqueio";
  ticketId?: string;
  trilhaId?: string;
  cargo?: string;
  data: string;
}

export interface Progresso {
  versao: 1;
  criadoEm: string;
  xp: number;
  tickets: Record<string, ProgressoTicket>;
  trilhasConcluidas: Record<string, string>; // trilhaId -> data
  eventos: Evento[];
}

const ARQUIVO = path.join(DADOS, "progresso.json");
const PASTA_SUBMISSOES = path.join(DADOS, "submissoes");

function novo(): Progresso {
  return { versao: 1, criadoEm: new Date().toISOString(), xp: 0, tickets: {}, trilhasConcluidas: {}, eventos: [] };
}

export function lerProgresso(): Progresso {
  if (!fs.existsSync(ARQUIVO)) return novo();
  try {
    return { ...novo(), ...JSON.parse(fs.readFileSync(ARQUIVO, "utf-8")) };
  } catch {
    return novo();
  }
}

export function salvarProgresso(p: Progresso): void {
  fs.mkdirSync(DADOS, { recursive: true });
  const tmp = `${ARQUIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(p, null, 2), "utf-8");
  fs.renameSync(tmp, ARQUIVO);
}

/** Lê, altera e salva o progresso de uma vez. */
export function atualizarProgresso<T>(fn: (p: Progresso) => T): T {
  const p = lerProgresso();
  const r = fn(p);
  salvarProgresso(p);
  return r;
}

export function progressoDoTicket(p: Progresso, id: string): ProgressoTicket {
  p.tickets[id] ??= { status: "todo", tentativas: 0, dicasReveladas: {} };
  p.tickets[id].dicasReveladas ??= {};
  return p.tickets[id];
}

export function salvarSubmissao(s: Submissao): void {
  fs.mkdirSync(PASTA_SUBMISSOES, { recursive: true });
  fs.writeFileSync(path.join(PASTA_SUBMISSOES, `${s.id}.json`), JSON.stringify(s), "utf-8");
}

export function lerSubmissao(id: string): Submissao | null {
  if (!/^[\w-]+$/.test(id)) return null;
  const arquivo = path.join(PASTA_SUBMISSOES, `${id}.json`);
  if (!fs.existsSync(arquivo)) return null;
  return JSON.parse(fs.readFileSync(arquivo, "utf-8")) as Submissao;
}

export function listarSubmissoes(ticketId?: string): Submissao[] {
  if (!fs.existsSync(PASTA_SUBMISSOES)) return [];
  return fs
    .readdirSync(PASTA_SUBMISSOES)
    .filter((n) => n.endsWith(".json"))
    .map((n) => JSON.parse(fs.readFileSync(path.join(PASTA_SUBMISSOES, n), "utf-8")) as Submissao)
    .filter((s) => !ticketId || s.ticketId === ticketId)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function resetarProgresso(): void {
  fs.rmSync(DADOS, { recursive: true, force: true });
}
