from typing import Any


def contar_abertos(tickets: list[dict[str, Any]]) -> int:
    """Devolve quantos tickets têm status diferente de "fechado"."""
    total = 0
    for ticket in tickets:
        if ticket["status"] != "fechado":
            total += 1
    return total


def filtrar_por_prioridade(tickets: list[dict[str, Any]], prioridade: str) -> list[dict[str, Any]]:
    """Devolve uma nova lista só com os tickets da prioridade pedida."""
    resultado: list[dict[str, Any]] = []
    for ticket in tickets:
        if ticket["prioridade"] == prioridade:
            resultado.append(ticket)
    return resultado
