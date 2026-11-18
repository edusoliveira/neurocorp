import { describe, expect, it } from "vitest";
import { explicarFalha, revisar, type AnaliseEstatica } from "./revisor";
import type { MetaTicket } from "../tipos";

const meta: MetaTicket = {
  id: "T999",
  titulo: "Teste",
  tipo: "feature",
  prioridade: "media",
  solicitante: "marina",
  xp: 50,
  arquivos: ["suporte/x.py"],
  criterios: [
    { texto: "soma", testes: ["test_soma"] },
    { texto: "sub", testes: ["test_sub"] },
  ],
};
const semProblemas: AnaliseEstatica = { sintaxe: {}, funcoes: { "suporte/x.py": { soma: 3, sub: 7 } }, violacoes: [] };

describe("explicarFalha", () => {
  it("traduz arquivo ausente", () => {
    expect(explicarFalha("ModuleNotFoundError: No module named 'suporte.x'")).toContain("suporte/x.py");
  });
  it("traduz função ausente", () => {
    expect(explicarFalha("ImportError: cannot import name 'soma' from 'suporte.x' (C:/tmp/x.py)")).toContain("`soma`");
  });
  it("usa a mensagem do assert", () => {
    expect(explicarFalha("AssertionError: Esperava 3, recebi 4\nassert 4 == 3")).toBe("Esperava 3, recebi 4");
  });
  it("descreve exceções do código do aluno", () => {
    expect(explicarFalha("ZeroDivisionError: division by zero")).toContain("ZeroDivisionError");
  });
});

describe("revisar", () => {
  it("aprova quando todos os testes passam, com elogio", () => {
    const r = revisar({
      meta,
      dicas: {},
      analise: semProblemas,
      pytest: { testes: [{ nome: "test_soma", resultado: "passou" }, { nome: "test_sub", resultado: "passou" }], errosColeta: [] },
      lint: [],
      estourouTempo: false,
    });
    expect(r.aprovado).toBe(true);
    expect(r.criterios.every((c) => c.ok)).toBe(true);
    expect(r.comentarios[0].severidade).toBe("elogio");
  });

  it("comenta na linha da função alvo e usa as dicas do hints.yaml", () => {
    const r = revisar({
      meta,
      dicas: { test_sub: { titulo: "Subtração errada", dicas: ["d1", "d2"], alvo: { arquivo: "suporte/x.py", funcao: "sub" } } },
      analise: semProblemas,
      pytest: { testes: [{ nome: "test_soma", resultado: "passou" }, { nome: "test_sub", resultado: "falhou", mensagem: "AssertionError: errado" }], errosColeta: [] },
      lint: [],
      estourouTempo: false,
    });
    expect(r.aprovado).toBe(false);
    const c = r.comentarios.find((x) => x.teste === "test_sub")!;
    expect(c).toMatchObject({ linha: 7, arquivo: "suporte/x.py", titulo: "Subtração errada", dicas: ["d1", "d2"], mensagem: "errado" });
    expect(r.criterios).toEqual([{ texto: "soma", ok: true }, { texto: "sub", ok: false }]);
  });

  it("prefere a linha do traceback no código do aluno", () => {
    const r = revisar({
      meta,
      dicas: {},
      analise: semProblemas,
      pytest: { testes: [{ nome: "test_soma", resultado: "falhou", mensagem: "ZeroDivisionError: x", local: { arquivo: "suporte/x.py", linha: 4 } }], errosColeta: [] },
      lint: [],
      estourouTempo: false,
    });
    expect(r.comentarios.find((x) => x.teste === "test_soma")?.linha).toBe(4);
  });

  it("esconde dicas em desafios semDicas", () => {
    const r = revisar({
      meta: { ...meta, semDicas: true },
      dicas: { test_soma: { titulo: "x", dicas: ["segredo"] } },
      analise: semProblemas,
      pytest: { testes: [{ nome: "test_soma", resultado: "falhou", mensagem: "AssertionError: x" }], errosColeta: [] },
      lint: [],
      estourouTempo: false,
    });
    expect(r.comentarios.every((c) => c.dicas.length === 0)).toBe(true);
  });

  it("lint não bloqueia, mas regra do ticket e erro de sintaxe bloqueiam", () => {
    const passou = { testes: [{ nome: "test_soma", resultado: "passou" as const }, { nome: "test_sub", resultado: "passou" as const }], errosColeta: [] };
    const comLint = revisar({ meta, dicas: {}, analise: semProblemas, pytest: passou, lint: [{ codigo: "F401", mensagem: "`os` imported but unused", arquivo: "suporte/x.py", linha: 1 }], estourouTempo: false });
    expect(comLint.aprovado).toBe(true);
    expect(comLint.comentarios.find((c) => c.origem === "lint")?.titulo).toContain("`os`");

    const comRegra = revisar({
      meta,
      dicas: {},
      analise: { ...semProblemas, violacoes: [{ arquivo: "suporte/x.py", linha: 1, regra: { tipo: "proibir_import", modulo: "pandas" } }] },
      pytest: passou,
      lint: [],
      estourouTempo: false,
    });
    expect(comRegra.aprovado).toBe(false);

    const comSintaxe = revisar({
      meta,
      dicas: {},
      analise: { ...semProblemas, sintaxe: { "suporte/x.py": { tipo: "sintaxe", linha: 2, mensagem: "invalid syntax" } } },
      pytest: null,
      lint: [],
      estourouTempo: false,
    });
    expect(comSintaxe.aprovado).toBe(false);
    expect(comSintaxe.comentarios[0]).toMatchObject({ linha: 2, origem: "sintaxe" });
  });
});
