# T017 — Ler arquivos gigantes em lotes com geradores
# Você vai precisar de `import csv` (csv.DictReader) e, se quiser, de `from itertools import batched`.
from collections.abc import Iterable, Iterator
from pathlib import Path


def ler_em_lotes(caminho: str | Path, tamanho: int) -> Iterator[list[dict[str, str]]]:
    """Função GERADORA (use yield): entrega listas de até `tamanho` linhas do CSV.

    - cada linha é o dicionário do csv.DictReader, sem conversão;
    - o último lote pode ser menor; nunca entrega lote vazio;
    - tamanho < 1 -> ValueError.
    Exemplo: 7 linhas com tamanho=3 -> lotes de 3, 3 e 1 linhas.
    """
    pass


def contar_por_status(linhas: Iterable[dict[str, str]]) -> dict[str, int]:
    """Devolve {status: quantidade}, percorrendo `linhas` (qualquer iterável) uma única vez."""
    pass
