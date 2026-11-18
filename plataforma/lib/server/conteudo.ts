import "server-only";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { CONTEUDO } from "./caminhos";
import type { Dica, InfoTrilha, MetaTicket, Persona } from "../tipos";

export interface TicketConteudo {
  pasta: string; // caminho absoluto da pasta do ticket
  nomePasta: string;
  trilhaId: string;
  ordem: number;
  meta: MetaTicket;
}

export interface TrilhaConteudo extends InfoTrilha {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  cargoInicial?: string;
  cargoAoConcluir: string;
  cor: string;
  tickets: TicketConteudo[];
}

export interface TrilhaFutura extends InfoTrilha {
  ordem: number;
  titulo: string;
  descricao: string;
  cargoAoConcluir: string;
}

function lerYaml<T>(arquivo: string, padrao: T): T {
  if (!fs.existsSync(arquivo)) return padrao;
  const dados = YAML.parse(fs.readFileSync(arquivo, "utf-8"));
  return (dados ?? padrao) as T;
}

export function carregarPersonas(): Record<string, Persona> {
  const brutas = lerYaml<Record<string, Omit<Persona, "id">>>(path.join(CONTEUDO, "personas.yaml"), {});
  return Object.fromEntries(Object.entries(brutas).map(([id, p]) => [id, { id, ...p }]));
}

export function carregarRoadmap(): TrilhaFutura[] {
  return lerYaml<TrilhaFutura[]>(path.join(CONTEUDO, "roadmap.yaml"), []);
}

/** Lê todas as trilhas e tickets do disco (sempre fresco, para refletir edições no conteúdo). */
export function carregarTrilhas(): TrilhaConteudo[] {
  if (!fs.existsSync(CONTEUDO)) return [];
  const trilhas: TrilhaConteudo[] = [];
  for (const nome of fs.readdirSync(CONTEUDO)) {
    const pastaTrilha = path.join(CONTEUDO, nome);
    const arquivoTrilha = path.join(pastaTrilha, "trilha.yaml");
    if (!fs.existsSync(arquivoTrilha)) continue;
    const t = lerYaml<Omit<TrilhaConteudo, "tickets"> & { tickets?: string[] }>(arquivoTrilha, {} as never);
    const tickets: TicketConteudo[] = [];
    (t.tickets ?? []).forEach((nomePasta, indice) => {
      const pasta = path.join(pastaTrilha, nomePasta);
      const meta = lerYaml<MetaTicket | null>(path.join(pasta, "meta.yaml"), null);
      if (!meta) return;
      meta.arquivos ??= [];
      meta.criterios ??= [];
      tickets.push({ pasta, nomePasta, trilhaId: t.id, ordem: indice, meta });
    });
    trilhas.push({ ...t, id: t.id ?? nome, tickets });
  }
  return trilhas.sort((a, b) => a.ordem - b.ordem);
}

export function todosTickets(trilhas = carregarTrilhas()): TicketConteudo[] {
  return trilhas.flatMap((t) => t.tickets);
}

export function acharTicket(id: string, trilhas = carregarTrilhas()): TicketConteudo | undefined {
  return todosTickets(trilhas).find((t) => t.meta.id === id);
}

export function lerMarkdown(ticket: TicketConteudo): string {
  const arquivo = path.join(ticket.pasta, "ticket.md");
  return fs.existsSync(arquivo) ? fs.readFileSync(arquivo, "utf-8") : "";
}

export function lerDicas(ticket: TicketConteudo): Record<string, Dica> {
  return lerYaml<Record<string, Dica>>(path.join(ticket.pasta, "hints.yaml"), {});
}

/** Lista arquivos (relativos) de uma subpasta do ticket, ex.: "iniciais" ou "solucao". */
export function listarArquivos(ticket: TicketConteudo, sub: "iniciais" | "solucao"): string[] {
  const base = path.join(ticket.pasta, sub);
  if (!fs.existsSync(base)) return [];
  const saida: string[] = [];
  const andar = (dir: string) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const completo = path.join(dir, item.name);
      if (item.isDirectory()) andar(completo);
      else saida.push(path.relative(base, completo).split(path.sep).join("/"));
    }
  };
  andar(base);
  return saida.sort();
}
