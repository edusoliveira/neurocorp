import asyncio
from collections.abc import Awaitable, Callable


class ErroTemporario(Exception):  # noqa: N818 (nomes em português: "Erro..." no começo)
    """Falha passageira: vale a pena tentar de novo."""


ERROS_TEMPORARIOS = (TimeoutError, ConnectionError, ErroTemporario)


async def com_retry[T](
    funcao: Callable[[], Awaitable[T]],
    tentativas: int = 3,
    timeout: float = 1.0,
    espera_base: float = 0.1,
) -> T:
    """Chama `funcao()` com timeout, repetindo falhas temporárias com backoff exponencial."""
    if tentativas < 1:
        raise ValueError(f"tentativas deve ser pelo menos 1 (recebi {tentativas})")
    for numero in range(tentativas):
        try:
            return await asyncio.wait_for(funcao(), timeout)
        except ERROS_TEMPORARIOS:
            if numero == tentativas - 1:
                raise
            await asyncio.sleep(espera_base * 2**numero)
    raise AssertionError("inalcançável: o laço sempre devolve ou levanta")
