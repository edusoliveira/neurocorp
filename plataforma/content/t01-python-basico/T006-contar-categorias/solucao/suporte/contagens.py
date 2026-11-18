def contar_por_categoria(tickets):
    """Devolve um dicionário {categoria: quantidade de tickets}."""
    contagem = {}
    for ticket in tickets:
        categoria = ticket["categoria"]
        contagem[categoria] = contagem.get(categoria, 0) + 1
    return contagem


def categoria_mais_frequente(tickets):
    """Devolve a categoria com mais tickets (empate: ordem alfabética; vazia: None)."""
    contagem = contar_por_categoria(tickets)
    campea = None
    maior = 0
    for categoria in sorted(contagem):
        if contagem[categoria] > maior:
            campea = categoria
            maior = contagem[categoria]
    return campea
