import { ErroAcao, moverTicket } from "@/lib/server/acoes";
import { responder } from "@/lib/server/http";

export async function POST(req: Request, ctx: RouteContext<"/api/tickets/[id]/mover">) {
  const { id } = await ctx.params;
  return responder(async () => {
    const { coluna } = (await req.json()) as { coluna?: string };
    if (coluna !== "todo" && coluna !== "doing") throw new ErroAcao("Coluna inválida.");
    moverTicket(id, coluna);
    return { ok: true };
  });
}
