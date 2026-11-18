"""Análise estática dos arquivos do aluno (sintaxe, funções definidas e regras do ticket).

Uso: python analisar.py <raiz_workspace> <regras.json>
regras.json = {"arquivos": [...], "checagens": [...]}
Imprime um JSON com: sintaxe, funcoes, violacoes.
"""

from __future__ import annotations

import ast
import json
import sys
from pathlib import Path


def nome_chamada(no: ast.Call) -> str | None:
    if isinstance(no.func, ast.Name):
        return no.func.id
    if isinstance(no.func, ast.Attribute):
        return no.func.attr
    return None


def analisar_arquivo(caminho: Path) -> tuple[ast.Module | None, dict | None]:
    try:
        codigo = caminho.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None, {"tipo": "ausente", "mensagem": "Arquivo não encontrado."}
    except UnicodeDecodeError:
        return None, {"tipo": "encoding", "mensagem": "Salve o arquivo com encoding UTF-8."}
    try:
        return ast.parse(codigo, filename=str(caminho)), None
    except SyntaxError as erro:
        return None, {
            "tipo": "sintaxe",
            "linha": erro.lineno or 1,
            "coluna": erro.offset or 0,
            "mensagem": erro.msg,
            "classe": type(erro).__name__,
        }


def main() -> None:
    raiz = Path(sys.argv[1])
    regras = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    arquivos: list[str] = regras.get("arquivos", [])
    checagens: list[dict] = regras.get("checagens", [])

    sintaxe: dict[str, dict] = {}
    funcoes: dict[str, dict[str, int]] = {}
    arvores: dict[str, ast.Module] = {}

    for rel in arquivos:
        if not rel.endswith(".py"):
            # Arquivos que não são Python (ex.: pyproject.toml): só conferimos se existem.
            if not (raiz / rel).exists():
                sintaxe[rel] = {"tipo": "ausente", "mensagem": "Arquivo não encontrado."}
            continue
        arvore, problema = analisar_arquivo(raiz / rel)
        if problema:
            sintaxe[rel] = problema
            continue
        arvores[rel] = arvore
        funcoes[rel] = {
            no.name: no.lineno
            for no in ast.walk(arvore)
            if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef))
        }

    violacoes: list[dict] = []
    for regra in checagens:
        tipo = regra.get("tipo")
        alvo = regra.get("arquivo")
        alvos = [alvo] if alvo else list(arvores)
        for rel in alvos:
            arvore = arvores.get(rel)
            if arvore is None:
                continue
            achados: list[int] = []
            if tipo in ("proibir_import", "exigir_import"):
                modulo = regra["modulo"]
                for no in ast.walk(arvore):
                    if isinstance(no, ast.Import) and any(
                        a.name.split(".")[0] == modulo for a in no.names
                    ):
                        achados.append(no.lineno)
                    elif isinstance(no, ast.ImportFrom) and (no.module or "").split(".")[0] == modulo:
                        achados.append(no.lineno)
            elif tipo in ("proibir_chamada", "exigir_chamada"):
                for no in ast.walk(arvore):
                    if isinstance(no, ast.Call) and nome_chamada(no) == regra["nome"]:
                        achados.append(no.lineno)
            elif tipo == "exigir_funcao":
                if regra["nome"] in funcoes.get(rel, {}):
                    achados.append(funcoes[rel][regra["nome"]])
            elif tipo == "exigir_laco":
                for no in ast.walk(arvore):
                    if isinstance(no, (ast.For, ast.While, ast.comprehension)):
                        achados.append(getattr(no, "lineno", 1))
            elif tipo == "exigir_decorador":
                # nome do decorador, ex.: "dataclass", "field_validator", "classmethod"
                for no in ast.walk(arvore):
                    if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                        for dec in no.decorator_list:
                            alvo_dec = dec.func if isinstance(dec, ast.Call) else dec
                            nome = alvo_dec.id if isinstance(alvo_dec, ast.Name) else getattr(alvo_dec, "attr", None)
                            if nome == regra["nome"]:
                                achados.append(no.lineno)
            elif tipo == "exigir_heranca":
                # alguma classe herda de regra["nome"], ex.: "BaseModel", "Enum", "Protocol"
                for no in ast.walk(arvore):
                    if isinstance(no, ast.ClassDef):
                        for base in no.bases:
                            nome = base.id if isinstance(base, ast.Name) else getattr(base, "attr", None)
                            if nome == regra["nome"]:
                                achados.append(no.lineno)
            elif tipo == "exigir_async":
                for no in ast.walk(arvore):
                    if isinstance(no, ast.AsyncFunctionDef):
                        achados.append(no.lineno)
            elif tipo == "exigir_anotacoes":
                # toda função (opcionalmente só as de regra["funcoes"]) tem tipos em todos os
                # parâmetros (exceto self/cls) e no retorno. Viola uma vez por função incompleta.
                somente = set(regra.get("funcoes") or [])
                for no in ast.walk(arvore):
                    if not isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        continue
                    if somente and no.name not in somente:
                        continue
                    args = no.args.posonlyargs + no.args.args + no.args.kwonlyargs
                    sem_tipo = [a.arg for a in args if a.annotation is None and a.arg not in ("self", "cls")]
                    if sem_tipo or no.returns is None:
                        violacoes.append({"arquivo": rel, "linha": no.lineno, "regra": regra})
                continue
            else:
                continue

            proibicao = tipo.startswith("proibir")
            if proibicao and achados:
                for linha in achados:
                    violacoes.append({"arquivo": rel, "linha": linha, "regra": regra})
            elif not proibicao and not achados:
                violacoes.append({"arquivo": rel, "linha": 1, "regra": regra})

    print(json.dumps({"sintaxe": sintaxe, "funcoes": funcoes, "violacoes": violacoes}, ensure_ascii=False))


if __name__ == "__main__":
    main()
