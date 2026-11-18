// Atalho: roda o validador de conteúdo com o Python do .venv.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const plataforma = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const python = path.resolve(plataforma, "..", ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
try {
  execFileSync(python, [path.join(plataforma, "scripts", "checar_conteudo.py"), ...process.argv.slice(2)], { stdio: "inherit" });
} catch (erro) {
  process.exit(erro.status ?? 1);
}
