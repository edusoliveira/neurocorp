import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import type { TokenLinha } from "../tipos";

const LINGUAGENS = { py: "python", toml: "toml", json: "json", md: "markdown", yaml: "yaml", yml: "yaml" } as const;

let promessa: Promise<Highlighter> | null = null;

function highlighter() {
  promessa ??= createHighlighter({ themes: ["github-light", "github-dark"], langs: [...new Set(Object.values(LINGUAGENS))] });
  return promessa;
}

/** Quebra o código em linhas de tokens coloridos (cor clara `c` e escura `d`). A linguagem vem da extensão. */
export async function destacar(codigo: string, arquivo = "x.py"): Promise<TokenLinha[]> {
  const h = await highlighter();
  const extensao = arquivo.split(".").pop()?.toLowerCase() ?? "py";
  const lang = LINGUAGENS[extensao as keyof typeof LINGUAGENS] ?? "text";
  const linhas = h.codeToTokensWithThemes(codigo.replace(/\r\n/g, "\n"), {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
  });
  return linhas.map((linha) =>
    linha.map((tok) => ({ t: tok.content, c: tok.variants.light?.color, d: tok.variants.dark?.color })),
  );
}
