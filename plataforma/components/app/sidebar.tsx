"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { BrainCircuit, Flame, KanbanSquare, LayoutDashboard, Map, Moon, Sun, TrendingUp } from "lucide-react";
import { useEstado } from "@/lib/cliente";
import { cn } from "@/lib/utils";
import { BarraXp } from "./pecas";

const ITENS = [
  { href: "/", rotulo: "Início", Icone: LayoutDashboard, atalho: "G I" },
  { href: "/quadro", rotulo: "Quadro", Icone: KanbanSquare, atalho: "G Q" },
  { href: "/trilhas", rotulo: "Trilhas", Icone: Map, atalho: "G T" },
  { href: "/carreira", rotulo: "Carreira", Icone: TrendingUp, atalho: "G C" },
];

export function Sidebar() {
  const caminho = usePathname();
  const { data } = useEstado();
  const { resolvedTheme, setTheme } = useTheme();
  // true só no navegador (evita divergência de hidratação no ícone do tema)
  const montado = useSyncExternalStore(() => () => {}, () => true, () => false);
  const perfil = data?.perfil;
  const ativo = (href: string) =>
    href === "/" ? caminho === "/" : caminho.startsWith(href) || (href === "/quadro" && /^\/(ticket|review)/.test(caminho));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg shadow-violet-500/25">
          <BrainCircuit className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">NeuroCorp</div>
          <div className="text-[11px] text-muted-foreground">Suporte Inteligente</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {ITENS.map(({ href, rotulo, Icone, atalho }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              ativo(href) && "text-sidebar-foreground",
            )}
          >
            {ativo(href) && (
              <motion.span layoutId="nav-ativo" className="absolute inset-0 rounded-lg bg-sidebar-accent" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <Icone className="relative size-4" />
            <span className="relative">{rotulo}</span>
            <kbd className="relative ml-auto hidden font-mono text-[10px] text-muted-foreground/60 group-hover:inline">{atalho}</kbd>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-3 p-3">
        {perfil && (
          <Link href="/carreira" className="block rounded-xl border bg-card/60 p-3.5 transition-colors hover:bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Nível {perfil.nivel}</span>
              {perfil.sequenciaDias > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500" title="Dias seguidos estudando">
                  <Flame className="size-3.5" />
                  {perfil.sequenciaDias}
                </span>
              )}
            </div>
            <div className="mt-1 truncate text-sm font-semibold">{perfil.cargo}</div>
            <BarraXp atual={perfil.xpNoNivel} total={perfil.xpProximoNivel} className="mt-3" />
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{perfil.xpNoNivel} XP</span>
              <span>{perfil.xpProximoNivel} XP</span>
            </div>
          </Link>
        )}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          {montado && resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {montado && resolvedTheme === "dark" ? "Tema claro" : "Tema escuro"}
        </button>
      </div>
    </aside>
  );
}
