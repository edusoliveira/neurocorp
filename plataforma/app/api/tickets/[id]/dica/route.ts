import { ErroAcao, revelarDica } from "@/lib/server/acoes";
import { responder } from "@/lib/server/http";

export async function POST(req: Request, ctx: RouteContext<"/api/tickets/[id]/dica">) {
  const { id } = await ctx.params;
  return responder(async () => {
    const { teste } = (await req.json()) as { teste?: string };
    if (!teste) throw new ErroAcao("Informe o teste.");
    return { reveladas: revelarDica(id, teste) };
  });
}
