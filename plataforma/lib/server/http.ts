import "server-only";
import { ErroAcao } from "./acoes";

/** Executa a ação e converte erros em respostas JSON com mensagem amigável. */
export async function responder<T>(fn: () => T | Promise<T>): Promise<Response> {
  try {
    return Response.json(await fn());
  } catch (erro) {
    const status = erro instanceof ErroAcao ? erro.status : 500;
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (status === 500) console.error(erro);
    return Response.json({ erro: mensagem }, { status });
  }
}
