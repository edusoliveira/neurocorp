import { acharTicket } from "@/lib/server/conteudo";
import { ErroAcao, mapearUploads, submeterTicket } from "@/lib/server/acoes";
import { responder } from "@/lib/server/http";

export const maxDuration = 120;

/** Corrige o ticket. Sem arquivos no corpo → usa a pasta do workspace; com arquivos → usa os enviados. */
export async function POST(req: Request, ctx: RouteContext<"/api/tickets/[id]/submeter">) {
  const { id } = await ctx.params;
  return responder(async () => {
    const ticket = acharTicket(id);
    if (!ticket) throw new ErroAcao("Ticket não encontrado.", 404);
    let uploads: Record<string, string> = {};
    let ignorados: string[] = [];
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      const enviados = await Promise.all(
        form
          .getAll("arquivos")
          .filter((f): f is File => f instanceof File)
          .map(async (f) => ({ nome: f.name, conteudo: await f.text() })),
      );
      ({ mapa: uploads, ignorados } = mapearUploads(ticket.meta.arquivos, enviados));
      if (enviados.length && !Object.keys(uploads).length) {
        throw new ErroAcao(`Nenhum arquivo enviado corresponde ao ticket. Esperado: ${ticket.meta.arquivos.join(", ")}`);
      }
    }
    const submissao = await submeterTicket(id, uploads);
    return { submissao, ignorados };
  });
}
