import { montarEstado } from "@/lib/server/estado";

export async function GET() {
  return Response.json(montarEstado());
}
