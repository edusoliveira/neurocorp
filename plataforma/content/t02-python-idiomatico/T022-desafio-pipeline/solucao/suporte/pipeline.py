import csv
from collections.abc import Awaitable, Callable
from functools import partial
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from suporte.enriquecimento import enriquecer_todos
from suporte.modelos import Prioridade
from suporte.resiliencia import com_retry
from suporte.schemas import validar_linhas


class Resumo(BaseModel):
    """Resultado do pipeline diário."""

    total_validos: int
    total_descartados: int
    por_prioridade: dict[str, int]
    clientes_enriquecidos: int
    erros: list[str]


async def processar(
    caminho: Path | str,
    consultar: Callable[[str], Awaitable[dict[str, Any]]],
    limite: int = 5,
) -> Resumo:
    """Lê, valida, converte e enriquece os tickets do CSV, sem quebrar por causa de dados ou da API."""
    with open(caminho, encoding="utf-8", newline="") as arquivo:
        linhas = list(csv.DictReader(arquivo))

    validos, erros = validar_linhas(linhas)
    tickets = [modelo.para_ticket() for modelo in validos]

    por_prioridade = {str(prioridade): 0 for prioridade in Prioridade}
    for ticket in tickets:
        por_prioridade[str(ticket.prioridade)] += 1

    falhas: dict[str, str] = {}

    async def consultar_com_retry(nome: str) -> dict[str, Any]:
        try:
            return await com_retry(partial(consultar, nome))
        except Exception as erro:
            falhas[nome] = type(erro).__name__
            return {}

    clientes = await enriquecer_todos([ticket.cliente for ticket in tickets], consultar_com_retry, limite)
    erros += [f"cliente {nome}: {falhas[nome]}" for nome in clientes if nome in falhas]

    return Resumo(
        total_validos=len(tickets),
        total_descartados=len(linhas) - len(tickets),
        por_prioridade=por_prioridade,
        clientes_enriquecidos=len(clientes) - len(falhas),
        erros=erros,
    )
