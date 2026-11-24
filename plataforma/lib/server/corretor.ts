import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dentroDe, GRADER_PY, pythonBin, WORKSPACE } from "./caminhos";
import { lerDicas, type TicketConteudo } from "./conteudo";
import { destacar } from "./destaque";
import { revisar, type AnaliseEstatica, type ProblemaLint, type RelatorioPytest } from "./revisor";
import type { Submissao } from "../tipos";

const IGNORAR = new Set([".git", ".neurocorp",".venv", "venv", "__pycache__", ".pytest_cache", ".ruff_cache", "node_modules", ".mypy_cache"]);
const TIMEOUT_TESTES_MS = 30_000;

interface Execucao {
  codigo: number | null;
  stdout: string;
  stderr: string;
  estourouTempo: boolean;
}

function executar(args: string[], cwd: string, env: NodeJS.ProcessEnv, timeoutMs: number): Promise<Execucao> {
  return new Promise((resolve) => {
    const filho = spawn(pythonBin(), args, { cwd, env, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let estourouTempo = false;
    const timer = setTimeout(() => {
      estourouTempo = true;
      filho.kill("SIGKILL");
    }, timeoutMs);
    filho.stdout.on("data", (d) => (stdout += d.toString("utf-8")));
    filho.stderr.on("data", (d) => (stderr += d.toString("utf-8")));
    filho.on("error", (erro) => {
      clearTimeout(timer);
      resolve({ codigo: -1, stdout, stderr: stderr + String(erro), estourouTempo });
    });
    filho.on("close", (codigo) => {
      clearTimeout(timer);
      resolve({ codigo, stdout, stderr, estourouTempo });
    });
  });
}

function ambientePython(ws: string, extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PYTHONPATH: [ws, GRADER_PY].join(path.delimiter),
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    ...extra,
  };
}

export type ResultadoCorrecao = Omit<Submissao, "id" | "data" | "ticketId" | "tentativa" | "recompensa">;

/**
 * Corrige um ticket: copia o workspace do aluno para uma pasta temporária,
 * aplica arquivos enviados por upload, roda análise estática, testes ocultos e lint.
 */
export async function corrigir(ticket: TicketConteudo, uploads: Record<string, string> = {}): Promise<ResultadoCorrecao> {
  const inicio = Date.now();
  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "neurocorp-"));
  const ws = path.join(tmp, "ws");
  const meta = ticket.meta;
  try {
    if (fs.existsSync(WORKSPACE)) {
      fs.cpSync(WORKSPACE, ws, { recursive: true, filter: (origem) => !IGNORAR.has(path.basename(origem)) });
    } else {
      fs.mkdirSync(ws, { recursive: true });
    }
    for (const [rel, conteudo] of Object.entries(uploads)) {
      const destino = dentroDe(ws, rel);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, conteudo, "utf-8");
    }

    // 1) Análise estática (sintaxe, funções, regras do ticket)
    const regras = path.join(tmp, "regras.json");
    fs.writeFileSync(regras, JSON.stringify({ arquivos: meta.arquivos, checagens: meta.checagens ?? [] }), "utf-8");
    const exAnalise = await executar([path.join(GRADER_PY, "analisar.py"), ws, regras], tmp, ambientePython(ws), 15_000);
    let analise: AnaliseEstatica = { sintaxe: {}, funcoes: {}, violacoes: [] };
    try {
      analise = JSON.parse(exAnalise.stdout);
    } catch {
      throw new Error(`Falha na análise estática: ${exAnalise.stderr.slice(-800) || exAnalise.stdout.slice(-800)}`);
    }

    // 2) Testes ocultos (só se o código compila)
    let pytest: RelatorioPytest | null = null;
    let estourouTempo = false;
    if (Object.keys(analise.sintaxe).length === 0) {
      fs.cpSync(path.join(ticket.pasta, "tests"), path.join(ws, "_testes_ocultos"), { recursive: true });
      const relatorio = path.join(tmp, "relatorio.json");
      const ex = await executar(
        ["-m", "pytest", "_testes_ocultos", "-q", "-p", "neurocorp_plugin", "-p", "no:cacheprovider", "--tb=short"],
        ws,
        ambientePython(ws, { NEUROCORP_REPORT: relatorio }),
        TIMEOUT_TESTES_MS,
      );
      estourouTempo = ex.estourouTempo;
      if (fs.existsSync(relatorio)) {
        pytest = JSON.parse(fs.readFileSync(relatorio, "utf-8"));
      } else if (!estourouTempo) {
        throw new Error(`O pytest não gerou relatório. Saída:\n${(ex.stdout + ex.stderr).slice(-1500)}`);
      }
      fs.rmSync(path.join(ws, "_testes_ocultos"), { recursive: true, force: true });
    }

    // 3) Lint (ruff) nos arquivos do ticket que existem
    let lint: ProblemaLint[] = [];
    const existentes = meta.arquivos.filter((a) => a.endsWith(".py") && fs.existsSync(path.join(ws, a)) && !analise.sintaxe[a]);
    if (existentes.length) {
      const ex = await executar(
        [
          "-m", "ruff", "check", "--no-cache", "--output-format", "json",
          "--select", "E4,E7,E9,F,W,N,B", "--ignore", "W292,W391,E501",
          ...existentes,
        ],
        ws,
        ambientePython(ws),
        15_000,
      );
      try {
        lint = (JSON.parse(ex.stdout || "[]") as { code: string; message: string; filename: string; location: { row: number } }[]).map(
          (p) => ({
            codigo: p.code,
            mensagem: p.message,
            arquivo: path.relative(ws, p.filename).split(path.sep).join("/"),
            linha: p.location.row,
          }),
        );
      } catch {
        lint = [];
      }
    }

    // 4) Revisão do Tech Lead Bot
    const revisao = revisar({ meta, dicas: lerDicas(ticket), analise, pytest, lint, estourouTempo });

    // 5) Arquivos para exibir no review
    const arquivos = await Promise.all(
      meta.arquivos.map(async (caminho) => {
        const absoluto = path.join(ws, caminho);
        const existe = fs.existsSync(absoluto);
        const codigo = existe ? fs.readFileSync(absoluto, "utf-8") : "";
        return { caminho, existe, linhas: existe ? await destacar(codigo, caminho) : [] };
      }),
    );

    return {
      aprovado: revisao.aprovado,
      origem: Object.keys(uploads).length ? "upload" : "pasta",
      duracaoMs: Date.now() - inicio,
      testes: revisao.testes,
      criterios: revisao.criterios,
      comentarios: revisao.comentarios,
      arquivos,
    };
  } catch (erro) {
    return {
      aprovado: false,
      origem: Object.keys(uploads).length ? "upload" : "pasta",
      duracaoMs: Date.now() - inicio,
      testes: [],
      criterios: meta.criterios.map((c) => ({ texto: c.texto, ok: false })),
      comentarios: [],
      arquivos: [],
      erroInterno: erro instanceof Error ? erro.message : String(erro),
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
