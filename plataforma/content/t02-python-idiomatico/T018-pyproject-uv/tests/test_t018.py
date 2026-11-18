import re
import tomllib
from pathlib import Path

ARQUIVO = Path("pyproject.toml")


def carregar():
    assert ARQUIVO.exists(), "Não encontrei o pyproject.toml na raiz do projeto (pasta suporte-inteligente)."
    try:
        with open(ARQUIVO, "rb") as arquivo:
            return tomllib.load(arquivo)
    except tomllib.TOMLDecodeError as erro:
        raise AssertionError(f"O pyproject.toml tem um erro de sintaxe TOML: {erro}") from erro


def projeto():
    dados = carregar()
    assert isinstance(dados.get("project"), dict), "O pyproject.toml não tem a seção [project]."
    return dados, dados["project"]


def nome_do_pacote(dependencia):
    """'pydantic>=2.7' -> 'pydantic'; 'Ruff [extra] ; python_version>="3.12"' -> 'ruff'."""
    return re.split(r"[\s<>=!~;\[(@]", dependencia.strip(), maxsplit=1)[0].lower().replace("_", "-")


def test_projeto_metadados():
    _, secao = projeto()
    assert secao.get("name") == "suporte-inteligente", (
        f"Em [project], name deveria ser \"suporte-inteligente\", mas é {secao.get('name')!r}."
    )
    versao = secao.get("version")
    assert isinstance(versao, str) and versao.strip(), f"Em [project], version deveria ser um texto, mas é {versao!r}."
    requer = secao.get("requires-python")
    encontrado = re.fullmatch(r"\s*>=\s*3\.(\d+)(\.\d+)?\s*", requer or "")
    assert encontrado and int(encontrado.group(1)) >= 12, (
        f"Em [project], requires-python deveria ser \">=3.12\" (ou uma versão mais nova), mas é {requer!r}."
    )


def test_dependencias():
    _, secao = projeto()
    dependencias = secao.get("dependencies")
    assert isinstance(dependencias, list), "Em [project], dependencies deveria ser uma lista."
    nomes = [nome_do_pacote(d) for d in dependencias]
    assert "pydantic" in nomes, f"pydantic deveria estar em [project] dependencies, mas a lista é {dependencias}."


def test_dependencias_dev():
    dados, _ = projeto()
    grupos = dados.get("dependency-groups")
    assert isinstance(grupos, dict) and isinstance(grupos.get("dev"), list), (
        "Faltou o grupo de desenvolvimento: uma seção [dependency-groups] com dev = [...] "
        "(é o que o `uv add --dev` cria)."
    )
    nomes = [nome_do_pacote(d) for d in grupos["dev"] if isinstance(d, str)]
    for pacote in ["pytest", "ruff"]:
        assert pacote in nomes, f"{pacote} deveria estar em [dependency-groups] dev, mas a lista é {grupos['dev']}."


def test_ruff_configurado():
    dados, _ = projeto()
    ruff = dados.get("tool", {}).get("ruff")
    assert isinstance(ruff, dict), "Faltou a seção [tool.ruff]."
    tamanho = ruff.get("line-length")
    assert isinstance(tamanho, int) and not isinstance(tamanho, bool) and tamanho > 0, (
        f"Em [tool.ruff], line-length deveria ser um número inteiro (ex.: 120), mas é {tamanho!r}."
    )


def test_comando_suporte():
    _, secao = projeto()
    scripts = secao.get("scripts")
    assert isinstance(scripts, dict), "Faltou a seção [project.scripts]."
    assert scripts.get("suporte") == "suporte.__main__:main", (
        f"Em [project.scripts], suporte deveria ser \"suporte.__main__:main\", mas é {scripts.get('suporte')!r}."
    )
