// Prepara o ambiente da NeuroCorp:
//  1. cria o ambiente Python (.venv) com pytest, ruff e pyyaml
//  2. cria a pasta suporte-inteligente/ (o SEU repositório) com dados e estrutura inicial
// Pode ser rodado de novo sem perigo: não apaga nem sobrescreve o seu código.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const plataforma = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raiz = path.resolve(plataforma, "..");
const workspace = path.join(raiz, "suporte-inteligente");
const windows = process.platform === "win32";
const venvPython = windows ? path.join(raiz, ".venv", "Scripts", "python.exe") : path.join(raiz, ".venv", "bin", "python");

function rodar(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

function passo(msg) {
  console.log(`\n\x1b[35m▸ ${msg}\x1b[0m`);
}

function escreverSeNaoExiste(arquivo, conteudo) {
  if (fs.existsSync(arquivo)) return;
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, conteudo, "utf-8");
}

passo("Ambiente Python (.venv)");
if (!fs.existsSync(venvPython)) {
  const candidatos = windows ? ["py", "python"] : ["python3", "python"];
  const python = candidatos.find((c) => {
    try {
      execFileSync(c, ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });
  if (!python) {
    console.error("Python não encontrado. Instale o Python 3.11+ em https://www.python.org/downloads/ e rode de novo.");
    process.exit(1);
  }
  rodar(python, ["-m", "venv", path.join(raiz, ".venv")]);
}
rodar(venvPython, ["-m", "pip", "install", "-q", "--disable-pip-version-check", "pytest", "ruff", "pyyaml", "pydantic"]);

passo("Seu repositório: suporte-inteligente/");
fs.mkdirSync(workspace, { recursive: true });
escreverSeNaoExiste(path.join(workspace, "suporte", "__init__.py"), '"""Suporte Inteligente — produto da NeuroCorp."""\n');
if (!fs.existsSync(path.join(workspace, "data", "tickets.csv"))) {
  rodar(venvPython, [path.join(plataforma, "scripts", "gerar_dados.py"), path.join(workspace, "data")]);
}
escreverSeNaoExiste(
  path.join(workspace, "README.md"),
  `# Suporte Inteligente

Produto da **NeuroCorp**: ferramentas de IA para a central de suporte ao cliente.

Este é o seu repositório de trabalho. Os tickets ficam no site da NeuroCorp
(\`npm run dev\` dentro de \`plataforma/\` → http://localhost:3000).

## Estrutura

- \`suporte/\` — o pacote Python que você vai construindo ticket a ticket
- \`data/tickets.csv\` — tickets de clientes (dados fictícios)

## Rodando

\`\`\`bash
python suporte/boas_vindas.py
\`\`\`
`,
);
escreverSeNaoExiste(path.join(workspace, ".gitignore"), "__pycache__/\n*.pyc\n.pytest_cache/\n.ruff_cache/\n.venv/\nrelatorio*.json\n");
escreverSeNaoExiste(
  path.join(workspace, ".vscode", "settings.json"),
  JSON.stringify(
    {
      "python.defaultInterpreterPath": windows ? "${workspaceFolder}\\..\\.venv\\Scripts\\python.exe" : "${workspaceFolder}/../.venv/bin/python",
      "editor.formatOnSave": true,
      "files.insertFinalNewline": true,
      "files.trimTrailingWhitespace": true,
      "[python]": { "editor.defaultFormatter": "charliermarsh.ruff", "editor.tabSize": 4 },
    },
    null,
    2,
  ) + "\n",
);
escreverSeNaoExiste(
  path.join(workspace, ".vscode", "extensions.json"),
  JSON.stringify({ recommendations: ["ms-python.python", "charliermarsh.ruff"] }, null, 2) + "\n",
);

if (!fs.existsSync(path.join(workspace, ".git"))) {
  try {
    rodar("git", ["init", "-q", "-b", "main"], { cwd: workspace });
    rodar("git", ["add", "-A"], { cwd: workspace });
    rodar("git", ["commit", "-q", "-m", "chore: estrutura inicial do Suporte Inteligente"], { cwd: workspace });
  } catch {
    console.warn("(git não disponível ou sem nome/e-mail configurado — tudo bem, siga sem ele por enquanto)");
  }
}

console.log(`\n\x1b[32m✔ Pronto!\x1b[0m
  Seu repositório: ${workspace}
  Abra no VS Code:  code "${workspace}"
  Suba o site:      npm run dev  →  http://localhost:3000\n`);
