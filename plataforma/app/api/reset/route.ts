import { resetarProgresso } from "@/lib/server/progresso";

export async function POST() {
  resetarProgresso();
  return Response.json({ ok: true });
}
