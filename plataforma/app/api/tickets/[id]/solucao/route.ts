import { ErroAcao } from "@/lib/server/acoes";
import { solucaoDoTicket } from "@/lib/server/detalhe";
import { responder } from "@/lib/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/tickets/[id]/solucao">) {
  const { id } = await ctx.params;
  return responder(async () => {
    const arquivos = await solucaoDoTicket(id);
    if (!arquivos) throw new ErroAcao("A solução é liberada depois que o ticket é aprovado.", 403);
    return { arquivos };
  });
}
