"""Valida o conteúdo das trilhas (uso de quem escreve tickets, não do aluno).

Para cada ticket, em ordem:
  1. workspace = dados + soluções de todos os tickets anteriores + solução do ticket  -> todos os testes devem PASSAR
  2. workspace = dados + soluções anteriores + arquivos iniciais do ticket            -> todos os testes devem FALHAR
Também confere se todo teste tem dica em hints.yaml e se todo teste citado nos critérios existe.

Uso: python scripts/checar_conteudo.py [filtro_ticket]
"""

from __future__ import annotations

import ast
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONTEUDO = RAIZ / "content"
GRADER_PY = RAIZ / "grader-py"
PYTHON = sys.executable

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover
    yaml = None


def carregar_yaml(caminho: Path):
    if yaml is None:
        raise SystemExit("Instale pyyaml para usar este script: pip install pyyaml")
    return yaml.safe_load(caminho.read_text(encoding="utf-8"))


def copiar_por_cima(origem: Path, destino: Path) -> None:
    if origem.exists():
        shutil.copytree(origem, destino, dirs_exist_ok=True)


def nomes_de_testes(pasta: Path) -> set[str]:
    nomes = set()
    for arquivo in pasta.glob("test_*.py"):
        for no in ast.parse(arquivo.read_text(encoding="utf-8")).body:
            if isinstance(no, ast.FunctionDef) and no.name.startswith("test_"):
                nomes.add(no.name)
    return nomes


def rodar(workspace: Path, testes: Path) -> dict[str, str]:
    destino_testes = workspace / "_testes_ocultos"
    shutil.copytree(testes, destino_testes, dirs_exist_ok=True)
    relatorio = workspace / "_relatorio.json"
    ambiente = dict(os.environ)
    ambiente["PYTHONPATH"] = os.pathsep.join([str(workspace), str(GRADER_PY)])
    ambiente["NEUROCORP_REPORT"] = str(relatorio)
    ambiente["PYTHONIOENCODING"] = "utf-8"
    subprocess.run(
        [PYTHON, "-m", "pytest", "_testes_ocultos", "-q", "-p", "neurocorp_plugin", "-p", "no:cacheprovider"],
        cwd=workspace,
        env=ambiente,
        capture_output=True,
        timeout=60,
    )
    shutil.rmtree(destino_testes, ignore_errors=True)
    if not relatorio.exists():
        return {}
    dados = json.loads(relatorio.read_text(encoding="utf-8"))
    relatorio.unlink()
    resultado = {t["nome"]: t["resultado"] for t in dados["testes"]}
    for erro in dados["errosColeta"]:
        resultado[f"COLETA:{erro['arquivo']}"] = "falhou"
    return resultado


def checar_regras(workspace: Path, meta: dict, tmp: Path) -> list[str]:
    """Roda a análise estática do corretor na solução: ela não pode violar as regras do próprio ticket."""
    regras = tmp / "regras.json"
    regras.write_text(
        json.dumps({"arquivos": meta.get("arquivos", []), "checagens": meta.get("checagens", [])}),
        encoding="utf-8",
    )
    saida = subprocess.run(
        [PYTHON, str(GRADER_PY / "analisar.py"), str(workspace), str(regras)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    try:
        analise = json.loads(saida.stdout)
    except json.JSONDecodeError:
        return [f"análise estática falhou: {saida.stderr[-300:]}"]
    problemas = [f"solução com problema em {arq}: {p['mensagem']}" for arq, p in analise["sintaxe"].items()]
    problemas += [
        f"solução viola a checagem {v['regra']['tipo']} em {v['arquivo']}:{v['linha']}" for v in analise["violacoes"]
    ]
    return problemas


def main() -> int:
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    problemas = 0
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp) / "base"
        base.mkdir()
        subprocess.run([PYTHON, str(RAIZ / "scripts" / "gerar_dados.py"), str(base / "data")], check=True, capture_output=True)
        (base / "suporte").mkdir()
        (base / "suporte" / "__init__.py").write_text("", encoding="utf-8")

        trilhas = sorted((p for p in CONTEUDO.iterdir() if (p / "trilha.yaml").exists()), key=lambda p: carregar_yaml(p / "trilha.yaml")["ordem"])
        for trilha in trilhas:
            for nome_ticket in carregar_yaml(trilha / "trilha.yaml")["tickets"]:
                pasta = trilha / nome_ticket
                meta = carregar_yaml(pasta / "meta.yaml")
                testes = nomes_de_testes(pasta / "tests")
                dicas = carregar_yaml(pasta / "hints.yaml") or {} if (pasta / "hints.yaml").exists() else {}
                citados = {t for c in meta.get("criterios", []) for t in c.get("testes", [])}
                avisos = []
                if not meta.get("semDicas"):
                    avisos += [f"teste sem dica: {t}" for t in sorted(testes - set(dicas))]
                avisos += [f"critério cita teste inexistente: {t}" for t in sorted(citados - testes)]
                avisos += [f"teste fora dos critérios: {t}" for t in sorted(testes - citados)]

                if not filtro or filtro in nome_ticket:
                    with tempfile.TemporaryDirectory() as t1:
                        ws = Path(t1) / "ws"
                        shutil.copytree(base, ws)
                        copiar_por_cima(pasta / "solucao", ws)
                        r_sol = rodar(ws, pasta / "tests")
                        avisos += checar_regras(ws, meta, Path(t1))
                    with tempfile.TemporaryDirectory() as t2:
                        ws = Path(t2) / "ws"
                        shutil.copytree(base, ws)
                        copiar_por_cima(pasta / "iniciais", ws)
                        r_ini = rodar(ws, pasta / "tests")
                    falhas_sol = [n for n, r in r_sol.items() if r != "passou"]
                    passam_ini = [n for n, r in r_ini.items() if r == "passou"]
                    ok = not falhas_sol and r_sol and not passam_ini and not avisos
                    problemas += 0 if ok else 1
                    print(f"{'OK ' if ok else 'ERRO'} {meta['id']} solucao={len(r_sol) - len(falhas_sol)}/{len(r_sol)} iniciais_passando={len(passam_ini)}")
                    for f in falhas_sol:
                        print(f"     solução falhou em: {f}")
                    for p in passam_ini:
                        print(f"     arquivo inicial já passa em: {p}")
                    for a in avisos:
                        print(f"     {a}")

                # o próximo ticket parte da solução deste
                copiar_por_cima(pasta / "solucao", base)
    return 1 if problemas else 0


if __name__ == "__main__":
    raise SystemExit(main())
