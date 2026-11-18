import csv

from suporte.texto import normalizar_assunto

PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"]


def carregar_tickets_limpos(caminho):
    """Lê o CSV, limpa o que dá e descarta as linhas sem salvação.

    Devolve a tupla (validos, quantidade_descartada).
    """
    validos = []
    descartados = 0
    with open(caminho, encoding="utf-8", newline="") as arquivo:
        for linha in csv.DictReader(arquivo):
            try:
                linha["id"] = int(linha["id"])
            except ValueError:
                descartados += 1
                continue

            linha["categoria"] = linha["categoria"].strip().lower()
            linha["prioridade"] = linha["prioridade"].strip().lower()
            if linha["categoria"] == "" or linha["prioridade"] not in PRIORIDADES_VALIDAS:
                descartados += 1
                continue

            linha["assunto"] = normalizar_assunto(linha["assunto"])
            validos.append(linha)
    return validos, descartados
