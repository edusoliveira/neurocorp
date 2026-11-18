# T020 — Enriquecer clientes em paralelo com asyncio
# Você vai precisar de `import asyncio` (asyncio.Semaphore e asyncio.gather).
from collections.abc import Awaitable, Callable
from typing import Any


async def enriquecer_todos(
    nomes: list[str],
    consultar: Callable[[str], Awaitable[dict[str, Any]]],
    limite: int,
) -> dict[str, dict[str, Any]]:
    """Devolve {nome: await consultar(nome)} para cada nome distinto.

    - as consultas rodam ao mesmo tempo (asyncio.gather), mas nunca mais de `limite` juntas (asyncio.Semaphore);
    - nomes repetidos são consultados uma vez só; lista vazia -> {};
    - limite < 1 -> ValueError.
    """
    pass
