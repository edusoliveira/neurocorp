import ast
import os
import shutil
import subprocess
import sys
from pathlib import Path

ARQUIVO = Path("tests") / "test_prioridade.py"

CORRETO = '''\
def classificar_prioridade(horas_aberto, cliente_vip):
    if cliente_vip and horas_aberto > 2:
        return "urgente"
    elif horas_aberto > 24:
        return "alta"
    elif horas_aberto > 8:
        return "media"
    else:
        return "baixa"
'''

VIP_DEPOIS_DE_ALTA = '''\
def classificar_prioridade(horas_aberto, cliente_vip):
    if horas_aberto > 24:
        return "alta"
    elif cliente_vip and horas_aberto > 2:
        return "urgente"
    elif horas_aberto > 8:
        return "media"
    else:
        return "baixa"
'''


def mutar(antes, depois):
    assert antes in CORRETO
    return CORRETO.replace(antes, depois)


def rodar_testes_do_aluno(pasta, codigo):
    """Copia os testes do aluno para `pasta`, com `codigo` no lugar de suporte/prioridade.py, e roda o pytest."""
    assert ARQUIVO.exists(), "Não encontrei o arquivo tests/test_prioridade.py na pasta suporte-inteligente."
    copia = pasta / "copia"
    shutil.copytree("tests", copia / "tests", ignore=shutil.ignore_patterns("__pycache__", ".pytest_cache"))
    (copia / "suporte").mkdir()
    (copia / "suporte" / "__init__.py").write_text("", encoding="utf-8")
    (copia / "suporte" / "prioridade.py").write_text(codigo, encoding="utf-8")
    (copia / "pytest.ini").write_text("[pytest]\n", encoding="utf-8")
    ambiente = dict(os.environ, PYTHONPATH=str(copia), PYTHONDONTWRITEBYTECODE="1", PYTHONIOENCODING="utf-8")
    ambiente.pop("PYTEST_ADDOPTS", None)
    processo = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/test_prioridade.py", "-q", "-p", "no:cacheprovider"],
        cwd=copia,
        env=ambiente,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
    )
    return processo.returncode, (processo.stdout + processo.stderr)[-1500:]


def conferir_mutante(pasta, codigo, descricao):
    codigo_saida, saida = rodar_testes_do_aluno(pasta, codigo)
    assert codigo_saida != 0, (
        f"O mutante sobreviveu: {descricao}. Com esse bug, todos os seus testes passaram — "
        "falta um teste que perceba essa diferença."
    )
    assert codigo_saida == 1, (
        f"Seus testes não rodaram direito (código de saída {codigo_saida} do pytest). Saída:\n{saida}"
    )


def test_tem_pelo_menos_5_testes():
    assert ARQUIVO.exists(), "Não encontrei o arquivo tests/test_prioridade.py na pasta suporte-inteligente."
    arvore = ast.parse(ARQUIVO.read_text(encoding="utf-8"))
    testes = [
        no.name
        for no in ast.walk(arvore)
        if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)) and no.name.startswith("test")
    ]
    assert len(testes) >= 5, (
        f"O arquivo deveria ter pelo menos 5 funções de teste (começando com test_), mas encontrei {len(testes)}: "
        f"{testes}."
    )


def test_testes_passam_com_codigo_correto(tmp_path):
    codigo_saida, saida = rodar_testes_do_aluno(tmp_path, CORRETO)
    assert codigo_saida != 5, "O pytest não encontrou nenhum teste em tests/test_prioridade.py (funções test_...)."
    assert codigo_saida == 0, (
        "Com a regra CORRETA do T003, algum teste seu falhou (ou o arquivo tem erro). "
        f"Um teste que falha com o código certo está esperando o resultado errado. Saída do pytest:\n{saida}"
    )


def test_pega_mutante_vip_ignorado(tmp_path):
    conferir_mutante(
        tmp_path,
        mutar("if cliente_vip and horas_aberto > 2:", "if False:"),
        "a regra do cliente VIP foi apagada (VIP é tratado como cliente comum)",
    )


def test_pega_mutante_limite_vip(tmp_path):
    conferir_mutante(
        tmp_path,
        mutar("cliente_vip and horas_aberto > 2:", "cliente_vip and horas_aberto >= 2:"),
        "o VIP vira urgente com 2 horas ou mais (o certo é MAIS de 2 horas)",
    )


def test_pega_mutante_limite_media(tmp_path):
    conferir_mutante(
        tmp_path,
        mutar("horas_aberto > 8:", "horas_aberto >= 8:"),
        "a prioridade média começa em 8 horas ou mais (o certo é MAIS de 8 horas)",
    )


def test_pega_mutante_limite_alta(tmp_path):
    conferir_mutante(
        tmp_path,
        mutar("horas_aberto > 24:", "horas_aberto >= 24:"),
        "a prioridade alta começa em 24 horas ou mais (o certo é MAIS de 24 horas)",
    )


def test_pega_mutante_vip_depois_de_alta(tmp_path):
    conferir_mutante(
        tmp_path,
        VIP_DEPOIS_DE_ALTA,
        "a regra das 24 horas é conferida antes da regra do VIP",
    )
