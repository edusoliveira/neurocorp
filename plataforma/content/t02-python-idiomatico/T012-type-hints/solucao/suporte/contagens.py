from typing import Any


def contar_por_categoria(tickets: list[dict[str, Any]]) -> dict[str, int]:
    """Devolve um dicionário {categoria: quantidade de tickets}."""
    contagem: dict[str, int] = {}
    for ticket in tickets:
        categoria = ticket["categoria"]
        contagem[categoria] = contagem.get(categoria, 0) + 1
    return contagem


def categoria_mais_frequente(tickets: list[dict[str, Any]]) -> str | None:
    """Devolve a categoria com mais tickets (empate: ordem alfabética; vazia: None)."""
    contagem = contar_por_categoria(tickets)
    campea: str | None = None
    maior = 0
    for categoria in sorted(contagem):
        if contagem[categoria] > maior:
            campea = categoria
            maior = contagem[categoria]
    return campea
