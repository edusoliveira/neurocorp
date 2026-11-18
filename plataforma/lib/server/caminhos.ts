import "server-only";
import fs from "node:fs";
import path from "node:path";

/** Pasta do site (plataforma/). */
export const RAIZ_PLATAFORMA = process.cwd();
/** Pasta raiz do projeto (neurocorp/). */
export const RAIZ_NEUROCORP = path.resolve(RAIZ_PLATAFORMA, "..");
/** O repositório do aluno, aberto no VS Code. */
export const WORKSPACE = process.env.NEUROCORP_WORKSPACE
  ? path.resolve(process.env.NEUROCORP_WORKSPACE)
  : path.join(RAIZ_NEUROCORP, "suporte-inteligente");
export const CONTEUDO = path.join(RAIZ_PLATAFORMA, "content");
export const DADOS = path.join(RAIZ_PLATAFORMA, ".data");
export const GRADER_PY = path.join(RAIZ_PLATAFORMA, "grader-py");

export function pythonBin(): string {
  if (process.env.NEUROCORP_PYTHON) return process.env.NEUROCORP_PYTHON;
  const venv =
    process.platform === "win32"
      ? path.join(RAIZ_NEUROCORP, ".venv", "Scripts", "python.exe")
      : path.join(RAIZ_NEUROCORP, ".venv", "bin", "python");
  if (fs.existsSync(venv)) return venv;
  return process.platform === "win32" ? "python" : "python3";
}

/** Garante que um caminho relativo do aluno não escape da pasta base. */
export function dentroDe(base: string, relativo: string): string {
  const absoluto = path.resolve(base, relativo);
  const rel = path.relative(base, absoluto);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Caminho inválido: ${relativo}`);
  }
  return absoluto;
}
