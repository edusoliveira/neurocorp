"""Plugin do pytest usado pelo corretor da NeuroCorp.

Grava o resultado de cada teste em JSON (caminho na variável NEUROCORP_REPORT),
incluindo a mensagem de erro e o último ponto do código do aluno no traceback.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

_resultados: dict[str, dict] = {}
_erros_coleta: list[dict] = []
_raiz = Path.cwd().resolve()


def _local_do_aluno(longrepr) -> dict | None:
    """Procura, no traceback, a última linha que pertence ao código do aluno."""
    traceback = getattr(longrepr, "reprtraceback", None)
    if traceback is None:
        return None
    local = None
    for entrada in getattr(traceback, "reprentries", []):
        loc = getattr(entrada, "reprfileloc", None)
        if loc is None:
            continue
        caminho = Path(loc.path)
        if not caminho.is_absolute():
            caminho = (_raiz / caminho).resolve()
        try:
            relativo = caminho.resolve().relative_to(_raiz)
        except ValueError:
            continue
        partes = relativo.parts
        if not partes or partes[0] == "_testes_ocultos":
            continue
        local = {"arquivo": relativo.as_posix(), "linha": loc.lineno}
    return local


def _mensagem(report) -> str:
    longrepr = report.longrepr
    crash = getattr(longrepr, "reprcrash", None)
    if crash is not None and crash.message:
        return crash.message
    return str(longrepr)[-1500:]


def pytest_runtest_logreport(report):
    nome = report.nodeid.split("::")[-1]
    atual = _resultados.get(nome)
    if report.when == "call" or (report.failed and report.when != "teardown"):
        if atual and atual["resultado"] == "falhou":
            return
        info = {"nome": nome, "resultado": "passou" if report.passed else "falhou"}
        if report.failed:
            info["mensagem"] = _mensagem(report)
            info["local"] = _local_do_aluno(report.longrepr)
            info["detalhe"] = str(report.longrepr)[-3000:]
        _resultados[nome] = info


def pytest_collectreport(report):
    if report.failed:
        _erros_coleta.append({"arquivo": report.nodeid, "mensagem": str(report.longrepr)[-2000:]})


def pytest_sessionfinish(session, exitstatus):
    destino = os.environ.get("NEUROCORP_REPORT")
    if not destino:
        return
    Path(destino).write_text(
        json.dumps(
            {"testes": list(_resultados.values()), "errosColeta": _erros_coleta},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
