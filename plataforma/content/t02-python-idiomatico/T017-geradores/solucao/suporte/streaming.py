import csv
from collections.abc import Iterable, Iterator
from itertools import batched
from pathlib import Path


def ler_em_lotes(caminho: str | Path, tamanho: int) -> Iterator[list[dict[str, str]]]:
    """Entrega as linhas do CSV em listas de até `tamanho` linhas, sem carregar o arquivo todo."""
    if tamanho < 1:
        raise ValueError(f"o tamanho do lote deve ser pelo menos 1 (recebi {tamanho})")
    with open(caminho, encoding="utf-8", newline="") as arquivo:
        for lote in batched(csv.DictReader(arquivo), tamanho):
            yield list(lote)


def contar_por_status(linhas: Iterable[dict[str, str]]) -> dict[str, int]:
    """Conta {status: quantidade} percorrendo `linhas` uma única vez."""
    contagem: dict[str, int] = {}
    for linha in linhas:
        contagem[linha["status"]] = contagem.get(linha["status"], 0) + 1
    return contagem
