// Tipos compartilhados entre servidor e interface.

export type Prioridade = "baixa" | "media" | "alta" | "urgente";
export type TipoTicket = "feature" | "bug" | "melhoria" | "desafio";
export type StatusTicket = "bloqueado" | "todo" | "doing" | "review" | "done";

export interface Persona {
  id: string;
  nome: string;
  cargo: string;
  cor: string;
}

export interface Checagem {
  tipo: string;
  modulo?: string;
  nome?: string;
  arquivo?: string;
  mensagem?: string;
}

export interface Criterio {
  texto: string;
  testes: string[];
}

export interface Dica {
  titulo: string;
  dicas: string[];
  alvo?: { arquivo?: string; funcao?: string };
}

export interface MetaTicket {
  id: string;
  titulo: string;
  tipo: TipoTicket;
  prioridade: Prioridade;
  solicitante: string;
  xp: number;
  estimativa?: string;
  conceitos?: string[];
  arquivos: string[];
  criterios: Criterio[];
  checagens?: Checagem[];
  mensagemAbertura?: string;
  mensagemConclusao?: string;
  semDicas?: boolean;
}

export interface TicketResumo extends MetaTicket {
  pasta: string;
  trilhaId: string;
  ordem: number;
  status: StatusTicket;
  tentativas: number;
  xpGanho?: number;
}

/** Informações de planejamento de uma trilha (fase do plano de estudos, período, tópicos, projeto e marco). */
export interface InfoTrilha {
  fase?: string;
  periodo?: string;
  topicos?: string[];
  projeto?: string;
  marco?: string;
}

export interface TrilhaResumo extends InfoTrilha {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  cargoInicial?: string;
  cargoAoConcluir: string;
  cor: string;
  tickets: TicketResumo[];
  concluida: boolean;
  emBreve?: boolean;
}

export interface MensagemFeed {
  id: string;
  autor: string;
  texto: string;
  data: string;
  ticketId?: string;
  tipo: "abertura" | "conclusao" | "promocao" | "sistema";
}

export interface Perfil {
  xp: number;
  nivel: number;
  xpNoNivel: number;
  xpProximoNivel: number;
  cargo: string;
  proximoCargo?: string;
  ticketsConcluidos: number;
  ticketsTotal: number;
  sequenciaDias: number;
  promocoes: { cargo: string; data: string; trilhaId: string }[];
}

export interface Estado {
  perfil: Perfil;
  trilhas: TrilhaResumo[];
  personas: Record<string, Persona>;
  feed: MensagemFeed[];
  atividade: Record<string, number>; // "2026-11-17" -> quantidade de ações
  workspace: { caminho: string; existe: boolean };
}

export type Severidade = "bloqueante" | "sugestao" | "elogio";

export interface Comentario {
  id: string;
  arquivo: string | null;
  linha: number | null;
  severidade: Severidade;
  titulo: string;
  mensagem?: string;
  dicas: string[];
  teste?: string;
  origem: "teste" | "sintaxe" | "regra" | "lint" | "geral";
}

export interface ResultadoTeste {
  nome: string;
  passou: boolean;
  mensagem?: string;
}

export interface Recompensa {
  xpBase: number;
  bonus: { motivo: string; xp: number }[];
  total: number;
  subiuNivel: boolean;
  promocao?: { cargo: string; trilha: string };
}

export interface ArquivoSubmetido {
  caminho: string;
  existe: boolean;
  linhas: TokenLinha[];
}

export type TokenLinha = { t: string; c?: string; d?: string }[];

export interface Submissao {
  id: string;
  ticketId: string;
  data: string;
  aprovado: boolean;
  origem: "pasta" | "upload";
  duracaoMs: number;
  testes: ResultadoTeste[];
  criterios: { texto: string; ok: boolean }[];
  comentarios: Comentario[];
  arquivos: ArquivoSubmetido[];
  recompensa?: Recompensa;
  erroInterno?: string;
  tentativa: number;
}

export interface TicketDetalhe {
  ticket: TicketResumo;
  trilha: { id: string; titulo: string; cor: string };
  markdown: string;
  solicitante: Persona;
  criterios: { texto: string; ok: boolean | null }[];
  submissoes: Pick<Submissao, "id" | "data" | "aprovado" | "tentativa" | "testes">[];
  arquivos: { caminho: string; absoluto: string; existe: boolean }[];
  workspace: string;
  dicasReveladas: Record<string, number>;
  proximoTicketId?: string;
}
