def calcular_pendentes(recebidos: int, resolvidos: int) -> int:
    """Devolve quantos tickets ainda estão pendentes (recebidos - resolvidos)."""
    return recebidos - resolvidos


def calcular_taxa_resolucao(recebidos: int, resolvidos: int) -> float:
    """Devolve a porcentagem de tickets resolvidos, arredondada para 1 casa decimal."""
    if recebidos == 0:
        return 0.0
    return round(resolvidos / recebidos * 100, 1)
