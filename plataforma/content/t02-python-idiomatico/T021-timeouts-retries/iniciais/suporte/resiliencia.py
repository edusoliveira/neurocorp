# T021 — Timeouts e novas tentativas para a API instável
# Você vai precisar de `import asyncio` (asyncio.wait_for e asyncio.sleep).
from collections.abc import Awaitable, Callable


class ErroTemporario(Exception):  # noqa: N818 (nomes em português: "Erro..." no começo)
    """Falha passageira: vale a pena tentar de novo."""


async def com_retry[T](
    funcao: Callable[[], Awaitable[T]],
    tentativas: int = 3,
    timeout: float = 1.0,
    espera_base: float = 0.1,
) -> T:
    """Chama `funcao()` (de novo a cada tentativa) com asyncio.wait_for(..., timeout).

    - TimeoutError, ConnectionError e ErroTemporario: espera espera_base * 2**n (n = 0, 1, 2...)
      e tenta de novo; na última tentativa, levanta a própria exceção (sem esperar).
    - Qualquer outra exceção sobe na hora.
    - tentativas < 1 -> ValueError.
    """
    pass
