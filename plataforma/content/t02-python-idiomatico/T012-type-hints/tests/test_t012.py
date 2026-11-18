import types
import typing
from typing import Any

TICKETS = [
    {"id": 1, "categoria": "tecnico", "prioridade": "alta", "status": "aberto"},
    {"id": 2, "categoria": "cobranca", "prioridade": "baixa", "status": "fechado"},
    {"id": 3, "categoria": "tecnico", "prioridade": "alta", "status": "em_andamento"},
    {"id": 4, "categoria": "conta", "prioridade": "urgente", "status": "fechado"},
]


def forma(tipo):
    """Normaliza uma anotação para comparar (aceita List/Dict/Optional do typing e aliases `type`)."""
    if isinstance(tipo, typing.TypeAliasType):
        return forma(tipo.__value__)
    origem = typing.get_origin(tipo)
    if origem is None:
        return tipo
    argumentos = typing.get_args(tipo)
    if origem in (typing.Union, types.UnionType):
        return ("união", frozenset(forma(a) for a in argumentos))
    return (origem, tuple(forma(a) for a in argumentos))


def texto(tipo):
    if isinstance(tipo, type) and not typing.get_args(tipo):
        return tipo.__name__
    return repr(tipo).replace("typing.", "")


def conferir_tipos(funcao, esperado):
    try:
        tipos = typing.get_type_hints(funcao)
    except Exception as erro:
        raise AssertionError(f"Não consegui ler as anotações de `{funcao.__name__}`: {erro!r}") from erro
    for nome, tipo in esperado.items():
        rotulo = "o retorno" if nome == "return" else f"o parâmetro `{nome}`"
        assert nome in tipos, (
            f"Em `{funcao.__name__}`, {rotulo} está sem anotação de tipo (esperado: {texto(tipo)})."
        )
        assert forma(tipos[nome]) == forma(tipo), (
            f"Em `{funcao.__name__}`, {rotulo} deveria ser anotado como {texto(tipo)}, "
            f"mas está como {texto(tipos[nome])}."
        )


def test_tipos_metricas():
    from suporte.metricas import calcular_pendentes, calcular_taxa_resolucao

    conferir_tipos(calcular_pendentes, {"recebidos": int, "resolvidos": int, "return": int})
    conferir_tipos(calcular_taxa_resolucao, {"recebidos": int, "resolvidos": int, "return": float})
    assert calcular_pendentes(10, 4) == 6, (
        f"O comportamento mudou: calcular_pendentes(10, 4) deveria ser 6, mas foi {calcular_pendentes(10, 4)!r}."
    )
    assert calcular_taxa_resolucao(3, 1) == 33.3, (
        f"O comportamento mudou: calcular_taxa_resolucao(3, 1) deveria ser 33.3, "
        f"mas foi {calcular_taxa_resolucao(3, 1)!r}."
    )
    assert calcular_taxa_resolucao(0, 0) == 0.0, (
        f"O comportamento mudou: calcular_taxa_resolucao(0, 0) deveria ser 0.0, "
        f"mas foi {calcular_taxa_resolucao(0, 0)!r}."
    )


def test_tipos_filtros():
    from suporte.filtros import contar_abertos, filtrar_por_prioridade

    lista = list[dict[str, Any]]
    conferir_tipos(contar_abertos, {"tickets": lista, "return": int})
    conferir_tipos(filtrar_por_prioridade, {"tickets": lista, "prioridade": str, "return": lista})
    assert contar_abertos(TICKETS) == 2, (
        f"O comportamento mudou: deveria haver 2 tickets abertos, mas contar_abertos devolveu {contar_abertos(TICKETS)!r}."
    )
    ids = [t["id"] for t in filtrar_por_prioridade(TICKETS, "alta")]
    assert ids == [1, 3], f"O comportamento mudou: os tickets 'alta' deveriam ser [1, 3], mas vieram {ids}."


def test_tipos_contar_por_categoria():
    from suporte.contagens import contar_por_categoria

    conferir_tipos(contar_por_categoria, {"tickets": list[dict[str, Any]], "return": dict[str, int]})
    esperado = {"tecnico": 2, "cobranca": 1, "conta": 1}
    recebido = contar_por_categoria(TICKETS)
    assert recebido == esperado, f"O comportamento mudou: esperava {esperado}, mas veio {recebido!r}."


def test_tipo_opcional_categoria_mais_frequente():
    from suporte.contagens import categoria_mais_frequente

    conferir_tipos(categoria_mais_frequente, {"tickets": list[dict[str, Any]], "return": str | None})
    assert categoria_mais_frequente(TICKETS) == "tecnico", (
        f"O comportamento mudou: a mais frequente deveria ser 'tecnico', "
        f"mas veio {categoria_mais_frequente(TICKETS)!r}."
    )
    assert categoria_mais_frequente([]) is None, (
        f"Com a lista vazia a função deveria devolver None, mas devolveu {categoria_mais_frequente([])!r}."
    )
