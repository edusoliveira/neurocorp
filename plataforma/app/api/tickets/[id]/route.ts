import { ErroAcao } from "@/lib/server/acoes";
import { detalharTicket } from "@/lib/server/detalhe";
import { responder } from "@/lib/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/tickets/[id]">) {
  const { id } = await ctx.params;
  return responder(() => {
    const detalhe = detalharTicket(id);
    if (!detalhe) throw new ErroAcao("Ticket não encontrado.", 404);
    return detalhe;
  });
}
