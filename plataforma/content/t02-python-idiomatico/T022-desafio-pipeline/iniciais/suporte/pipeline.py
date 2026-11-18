# T022 — Desafio de promoção: o pipeline tipado e assíncrono
# Reaproveite: validar_linhas (T015), Ticket/Prioridade (T014), enriquecer_todos (T020) e com_retry (T021).
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from pydantic import BaseModel


class Resumo(BaseModel):
    """Resultado do pipeline. Campos: total_validos: int, total_descartados: int,
    por_prioridade: dict[str, int], clientes_enriquecidos: int, erros: list[str]."""


async def processar(
    caminho: Path | str,
    consultar: Callable[[str], Awaitable[dict[str, Any]]],
    limite: int = 5,
) -> Resumo:
    """Lê o CSV, valida, converte para Ticket, enriquece cada cliente distinto e devolve o Resumo."""
    pass
