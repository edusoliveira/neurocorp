"use client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function chave(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Mapa de calor estilo GitHub com as últimas N semanas. */
export function Heatmap({ atividade, semanas = 18 }: { atividade: Record<string, number>; semanas?: number }) {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - hoje.getDay() - (semanas - 1) * 7);
  const colunas: Date[][] = [];
  for (let s = 0; s < semanas; s++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + s * 7 + d);
      col.push(dia);
    }
    colunas.push(col);
  }
  const nivel = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);
  const cores = ["bg-muted", "bg-violet-500/30", "bg-violet-500/55", "bg-violet-500/80", "bg-violet-400"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {colunas.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((dia) => {
              const n = atividade[chave(dia)] ?? 0;
              const futuro = dia > hoje;
              return (
                <Tooltip key={chave(dia)}>
                  <TooltipTrigger
                    render={<div />}
                    className={cn("size-3 rounded-[3px]", futuro ? "bg-transparent" : cores[nivel(n)])}
                  />
                  {!futuro && (
                    <TooltipContent>
                      {n} {n === 1 ? "submissão" : "submissões"} em {dia.toLocaleDateString("pt-BR")}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        menos
        {cores.map((c) => (
          <span key={c} className={cn("size-2.5 rounded-[2px]", c)} />
        ))}
        mais
      </div>
    </div>
  );
}
