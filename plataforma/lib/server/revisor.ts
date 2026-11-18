// "Tech Lead Bot": transforma os resultados brutos (testes, AST, lint) em um code review amigável.
// Lógica pura, sem acesso a disco — testada em revisor.test.ts.
import type { Checagem, Comentario, Dica, MetaTicket, ResultadoTeste } from "../tipos";

export interface AnaliseEstatica {
  sintaxe: Record<string, { tipo: string; linha?: number; coluna?: number; mensagem: string; classe?: string }>;
  funcoes: Record<string, Record<string, number>>;
  violacoes: { arquivo: string; linha: number; regra: Checagem }[];
}

export interface TesteBruto {
  nome: string;
  resultado: "passou" | "falhou";
  mensagem?: string;
  local?: { arquivo: string; linha: number } | null;
}

export interface RelatorioPytest {
  testes: TesteBruto[];
  errosColeta: { arquivo: string; mensagem: string }[];
}

export interface ProblemaLint {
  codigo: string;
  mensagem: string;
  arquivo: string;
  linha: number;
}

const LINT_PT: Record<string, (m: string) => { titulo: string; dica: string }> = {
  F401: (m) => ({ titulo: `Import não utilizado: ${entreAspas(m)}`, dica: "Você importou algo que não usa. Pode apagar essa linha — código limpo é código sem sobras." }),
  F841: (m) => ({ titulo: `Variável criada mas nunca usada: ${entreAspas(m)}`, dica: "Ou use a variável, ou remova a linha." }),
  F811: (m) => ({ titulo: `Nome redefinido: ${entreAspas(m)}`, dica: "Você definiu duas vezes a mesma função/variável. A segunda apaga a primeira." }),
  F821: (m) => ({ titulo: `Nome não definido: ${entreAspas(m)}`, dica: "Esse nome não existe nesse ponto do código. Confira se escreveu certo ou se esqueceu de criar/importar." }),
  F541: () => ({ titulo: "f-string sem nenhuma variável", dica: "Se não há `{}` dentro do texto, não precisa do `f` na frente." }),
  E711: () => ({ titulo: "Comparação com None usando ==", dica: "Em Python, compare com None usando `is None` ou `is not None`." }),
  E712: () => ({ titulo: "Comparação com True/False usando ==", dica: "Em vez de `if x == True:`, escreva só `if x:` (ou `if not x:`)." }),
  E713: () => ({ titulo: "Use `not in`", dica: "Escreva `if x not in lista:` em vez de `if not x in lista:`." }),
  E701: () => ({ titulo: "Várias instruções na mesma linha", dica: "Depois dos dois-pontos, quebre a linha e indente o bloco." }),
  E702: () => ({ titulo: "Várias instruções na mesma linha", dica: "Separe cada instrução em uma linha." }),
  E703: () => ({ titulo: "Ponto e vírgula desnecessário", dica: "Em Python não precisa de `;` no fim da linha." }),
  E741: (m) => ({ titulo: `Nome de variável ambíguo: ${entreAspas(m)}`, dica: "Evite `l`, `O` e `I` como nomes — se confundem com 1 e 0. Use nomes descritivos." }),
  E722: () => ({ titulo: "`except:` sem tipo de erro", dica: "Capture o erro específico, ex.: `except ValueError:`. Um except vazio esconde bugs." }),
  W291: () => ({ titulo: "Espaços sobrando no fim da linha", dica: "Apague os espaços depois do último caractere." }),
  W293: () => ({ titulo: "Linha em branco com espaços", dica: "Linhas vazias não devem ter espaços." }),
  N802: (m) => ({ titulo: `Nome de função fora do padrão: ${entreAspas(m)}`, dica: "Em Python, funções usam snake_case: `minha_funcao`." }),
  N803: (m) => ({ titulo: `Nome de parâmetro fora do padrão: ${entreAspas(m)}`, dica: "Parâmetros usam snake_case: `total_tickets`." }),
  N806: (m) => ({ titulo: `Nome de variável fora do padrão: ${entreAspas(m)}`, dica: "Variáveis dentro de funções usam snake_case: `total_tickets`." }),
  B006: () => ({ titulo: "Valor padrão mutável", dica: "Não use `[]` ou `{}` como valor padrão de parâmetro. Use `None` e crie a lista dentro da função." }),
  B007: (m) => ({ titulo: `Variável do laço não usada: ${entreAspas(m)}`, dica: "Se não precisa da variável, chame-a de `_`." }),
};

function entreAspas(m: string): string {
  const achado = m.match(/`([^`]+)`/);
  return achado ? `\`${achado[1]}\`` : "";
}

const REGRA_PADRAO: Record<string, (r: Checagem) => string> = {
  proibir_import: (r) => `Neste ticket não use \`${r.modulo}\`.`,
  exigir_import: (r) => `Este ticket pede o uso do módulo \`${r.modulo}\`.`,
  proibir_chamada: (r) => `Neste ticket não use \`${r.nome}()\`.`,
  exigir_chamada: (r) => `Este ticket pede o uso de \`${r.nome}()\`.`,
  exigir_funcao: (r) => `Não encontrei a função \`${r.nome}\`.`,
  exigir_laco: () => "Este ticket pede o uso de um laço (`for` ou `while`).",
  exigir_decorador: (r) => `Este ticket pede o uso do decorador \`@${r.nome}\`.`,
  exigir_heranca: (r) => `Este ticket pede uma classe que herde de \`${r.nome}\`.`,
  exigir_async: () => "Este ticket pede pelo menos uma função `async def`.",
  exigir_anotacoes: () => "Esta função precisa de type hints em todos os parâmetros e no retorno (`-> tipo`).",
};

/** Traduz a mensagem bruta de uma falha de teste para algo legível. */
export function explicarFalha(mensagem = ""): string {
  const primeira = mensagem.split("\n")[0].trim();
  let m: RegExpMatchArray | null;
  if ((m = primeira.match(/^ModuleNotFoundError: No module named '([\w.]+)'/))) {
    return `O arquivo \`${m[1].replace(/\./g, "/")}.py\` não foi encontrado. Confira o nome e a pasta.`;
  }
  if ((m = primeira.match(/^ImportError: cannot import name '(\w+)' from '([\w.]+)'/))) {
    return `Não encontrei a função \`${m[1]}\` em \`${m[2].replace(/\./g, "/")}.py\`. Confira se o nome está exatamente igual ao do ticket.`;
  }
  if (primeira.startsWith("AssertionError")) {
    const texto = primeira.replace(/^AssertionError:?\s*/, "");
    return texto || "O resultado não foi o esperado.";
  }
  if (primeira.startsWith("assert ")) return "O resultado não foi o esperado.";
  if ((m = primeira.match(/^(\w+(?:Error|Exception)):\s*(.*)$/))) {
    return `Seu código lançou um erro: \`${m[1]}\` — ${m[2]}`;
  }
  return primeira || "O teste falhou.";
}

let contador = 0;
const novoId = (prefixo: string) => `${prefixo}-${++contador}`;

export function revisar(entrada: {
  meta: MetaTicket;
  dicas: Record<string, Dica>;
  analise: AnaliseEstatica;
  pytest: RelatorioPytest | null;
  lint: ProblemaLint[];
  estourouTempo: boolean;
}): { aprovado: boolean; testes: ResultadoTeste[]; criterios: { texto: string; ok: boolean }[]; comentarios: Comentario[] } {
  const { meta, dicas, analise, pytest, lint, estourouTempo } = entrada;
  const comentarios: Comentario[] = [];
  const semDicas = !!meta.semDicas;

  // Erros de sintaxe / arquivos ausentes
  for (const [arquivo, prob] of Object.entries(analise.sintaxe)) {
    if (prob.tipo === "ausente") {
      comentarios.push({
        id: novoId("sintaxe"), arquivo: null, linha: null, severidade: "bloqueante", origem: "sintaxe",
        titulo: `Arquivo \`${arquivo}\` não encontrado`,
        mensagem: "Crie o arquivo exatamente nesse caminho dentro da pasta suporte-inteligente (ou clique em \"Começar\" no ticket para gerar o arquivo inicial).",
        dicas: [],
      });
    } else {
      comentarios.push({
        id: novoId("sintaxe"), arquivo, linha: prob.linha ?? 1, severidade: "bloqueante", origem: "sintaxe",
        titulo: prob.classe === "IndentationError" ? "Erro de indentação" : "Erro de sintaxe",
        mensagem: `O Python não conseguiu ler esta linha: ${prob.mensagem}. Os testes só rodam depois que o código compila.`,
        dicas: semDicas ? [] : [
          "Confira parênteses, aspas e colchetes — todo que abre precisa fechar.",
          "Depois de `if`, `for`, `def` e `while` vêm dois-pontos `:` e a linha de baixo é indentada (4 espaços).",
        ],
      });
    }
  }

  // Regras do ticket (AST)
  for (const v of analise.violacoes) {
    const padrao = REGRA_PADRAO[v.regra.tipo];
    comentarios.push({
      id: novoId("regra"), arquivo: v.arquivo, linha: v.linha, severidade: "bloqueante", origem: "regra",
      titulo: v.regra.mensagem ?? (padrao ? padrao(v.regra) : "Regra do ticket não atendida"),
      dicas: [],
    });
  }

  if (estourouTempo) {
    comentarios.push({
      id: novoId("geral"), arquivo: null, linha: null, severidade: "bloqueante", origem: "geral",
      titulo: "Os testes demoraram demais e foram interrompidos",
      mensagem: "Isso costuma ser um laço infinito (um `while` que nunca termina) ou um `input()` esperando você digitar algo.",
      dicas: [],
    });
  }

  for (const erro of pytest?.errosColeta ?? []) {
    comentarios.push({
      id: novoId("geral"), arquivo: null, linha: null, severidade: "bloqueante", origem: "geral",
      titulo: "Não foi possível carregar os testes",
      mensagem: explicarFalha(erro.mensagem.split("\n").find((l) => /Error/.test(l)) ?? erro.mensagem),
      dicas: [],
    });
  }

  // Testes
  const testes: ResultadoTeste[] = (pytest?.testes ?? []).map((t) => ({
    nome: t.nome,
    passou: t.resultado === "passou",
    mensagem: t.resultado === "passou" ? undefined : explicarFalha(t.mensagem),
  }));
  for (const t of pytest?.testes ?? []) {
    if (t.resultado === "passou") continue;
    const dica = dicas[t.nome];
    let arquivo: string | null = null;
    let linha: number | null = null;
    if (t.local && meta.arquivos.includes(t.local.arquivo)) {
      arquivo = t.local.arquivo;
      linha = t.local.linha;
    } else if (dica?.alvo?.arquivo) {
      arquivo = dica.alvo.arquivo;
      linha = (dica.alvo.funcao && analise.funcoes[arquivo]?.[dica.alvo.funcao]) || 1;
    } else if (meta.arquivos.length === 1) {
      arquivo = meta.arquivos[0];
      linha = 1;
    }
    comentarios.push({
      id: novoId("teste"), arquivo, linha, severidade: "bloqueante", origem: "teste", teste: t.nome,
      titulo: semDicas || !dica ? `O teste \`${t.nome}\` falhou` : dica.titulo,
      mensagem: explicarFalha(t.mensagem),
      dicas: semDicas ? [] : (dica?.dicas ?? []),
    });
  }

  // Lint (não bloqueia)
  for (const p of lint) {
    const traducao = LINT_PT[p.codigo]?.(p.mensagem);
    comentarios.push({
      id: novoId("lint"), arquivo: p.arquivo, linha: p.linha, severidade: "sugestao", origem: "lint",
      titulo: traducao?.titulo ?? `${p.codigo}: ${p.mensagem}`,
      mensagem: traducao ? `Regra ${p.codigo} do ruff.` : undefined,
      dicas: traducao ? [traducao.dica] : [],
    });
  }

  const resultados = new Map(testes.map((t) => [t.nome, t.passou]));
  const criterios = meta.criterios.map((c) => ({
    texto: c.texto,
    ok: c.testes.length > 0 && c.testes.every((n) => resultados.get(n) === true),
  }));

  const bloqueantes = comentarios.some((c) => c.severidade === "bloqueante");
  const aprovado = !bloqueantes && testes.length > 0 && testes.every((t) => t.passou);

  if (aprovado) {
    comentarios.unshift({
      id: novoId("elogio"), arquivo: null, linha: null, severidade: "elogio", origem: "geral",
      titulo: lint.length === 0 ? "LGTM! 🚀 Código aprovado e limpinho." : "LGTM! 🚀 Código aprovado.",
      mensagem: lint.length === 0
        ? "Todos os critérios de aceite foram atendidos e o linter não encontrou nada. Pode mergear!"
        : "Todos os critérios de aceite foram atendidos. Deixei algumas sugestões de estilo — não bloqueiam, mas vale olhar.",
      dicas: [],
    });
  }

  return { aprovado, testes, criterios, comentarios };
}
