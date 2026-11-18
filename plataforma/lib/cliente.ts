"use client";
import useSWR, { mutate } from "swr";
import type { ArquivoSubmetido, Estado, Submissao, TicketDetalhe } from "./tipos";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error((dados as { erro?: string }).erro ?? `Erro ${resp.status}`);
  return dados as T;
}

export const postJson = <T>(url: string, corpo: unknown = {}) =>
  api<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });

const buscar = <T>(url: string) => api<T>(url);

export const useEstado = () => useSWR<Estado>("/api/estado", buscar);
export const useTicket = (id?: string | null) => useSWR<TicketDetalhe>(id ? `/api/tickets/${id}` : null, buscar);
export const useSubmissao = (id: string) => useSWR<Submissao>(`/api/submissoes/${id}`, buscar);
export const useSolucao = (id: string, liberada: boolean) =>
  useSWR<{ arquivos: ArquivoSubmetido[] }>(liberada ? `/api/tickets/${id}/solucao` : null, buscar);

/** Recarrega tudo que depende do progresso. */
export const recarregarTudo = () => mutate(() => true);

export function tempoRelativo(dataIso: string): string {
  const seg = Math.round((Date.now() - Date.parse(dataIso)) / 1000);
  if (seg < 45) return "agora";
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  return new Date(dataIso).toLocaleDateString("pt-BR");
}
