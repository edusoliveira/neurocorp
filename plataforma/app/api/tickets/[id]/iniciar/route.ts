import { iniciarTicket } from "@/lib/server/acoes";
import { responder } from "@/lib/server/http";

export async function POST(_req: Request, ctx: RouteContext<"/api/tickets/[id]/iniciar">) {
  const { id } = await ctx.params;
  return responder(() => iniciarTicket(id));
}
