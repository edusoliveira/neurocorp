import csv


def carregar_tickets(caminho):
    """Lê o CSV em `caminho` e devolve uma lista de dicionários (um por linha)."""
    tickets = []
    with open(caminho, encoding="utf-8", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)
        for linha in leitor:
            linha["id"] = int(linha["id"])
            tickets.append(linha)
    return tickets
