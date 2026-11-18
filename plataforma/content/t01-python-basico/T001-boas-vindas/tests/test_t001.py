import runpy

ARQUIVO = "suporte/boas_vindas.py"


def executar(capsys):
    variaveis = runpy.run_path(ARQUIVO)
    saida = capsys.readouterr().out
    return variaveis, saida


def test_variavel_empresa(capsys):
    variaveis, _ = executar(capsys)
    assert "empresa" in variaveis, "Não encontrei a variável `empresa`."
    assert variaveis["empresa"] == "NeuroCorp", (
        f"`empresa` deveria ser 'NeuroCorp', mas é {variaveis['empresa']!r}."
    )


def test_variavel_tickets_ontem(capsys):
    variaveis, _ = executar(capsys)
    assert "tickets_ontem" in variaveis, "Não encontrei a variável `tickets_ontem`."
    valor = variaveis["tickets_ontem"]
    assert isinstance(valor, int) and not isinstance(valor, bool), (
        f"`tickets_ontem` deveria ser um int, mas é {type(valor).__name__}."
    )
    assert valor == 42, f"`tickets_ontem` deveria ser 42, mas é {valor!r}."


def test_variavel_equipe(capsys):
    variaveis, _ = executar(capsys)
    assert "equipe" in variaveis, "Não encontrei a variável `equipe`."
    equipe = variaveis["equipe"]
    assert isinstance(equipe, list), f"`equipe` deveria ser uma lista, mas é {type(equipe).__name__}."
    assert len(equipe) == 3, f"`equipe` deveria ter 3 nomes, mas tem {len(equipe)}."
    assert all(isinstance(nome, str) for nome in equipe), "Todos os itens de `equipe` devem ser textos."


def test_mensagem_impressa(capsys):
    _, saida = executar(capsys)
    esperado = "Bom dia, equipe NeuroCorp! Ontem recebemos 42 tickets. Hoje no plantão: 3 pessoas."
    assert saida.strip() == esperado, f"A mensagem impressa foi: {saida.strip()!r}"
