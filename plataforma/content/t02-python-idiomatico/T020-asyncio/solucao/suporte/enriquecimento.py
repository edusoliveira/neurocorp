import asyncio
from collections.abc import Awaitable, Callable
from typing import Any


async def enriquecer_todos(
    nomes: list[str],
    consultar: Callable[[str], Awaitable[dict[str, Any]]],
    limite: int,
) -> dict[str, dict[str, Any]]:
    """Consulta cada nome distinto ao mesmo tempo, com no máximo `limite` consultas em andamento."""
    if limite < 1:
        raise ValueError(f"o limite deve ser pelo menos 1 (recebi {limite})")
    semaforo = asyncio.Semaphore(limite)
    distintos = list(dict.fromkeys(nomes))

    async def consultar_com_vaga(nome: str) -> dict[str, Any]:
        async with semaforo:
            return await consultar(nome)

    resultados = await asyncio.gather(*(consultar_com_vaga(nome) for nome in distintos))
    return dict(zip(distintos, resultados, strict=True))
