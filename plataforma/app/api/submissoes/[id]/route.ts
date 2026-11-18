import { ErroAcao } from "@/lib/server/acoes";
import { responder } from "@/lib/server/http";
import { lerSubmissao } from "@/lib/server/progresso";

export async function GET(_req: Request, ctx: RouteContext<"/api/submissoes/[id]">) {
  const { id } = await ctx.params;
  return responder(() => {
    const s = lerSubmissao(id);
    if (!s) throw new ErroAcao("Submissão não encontrada.", 404);
    return s;
  });
}
