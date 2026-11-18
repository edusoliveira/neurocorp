# T005 — Contar e filtrar tickets da fila
# Cada ticket é um dicionário, por exemplo: {"id": 1, "prioridade": "alta", "status": "aberto", ...}


def contar_abertos(tickets):
    """Devolve quantos tickets têm status diferente de "fechado".

    Exemplo: status ["aberto", "fechado", "em_andamento"] -> 2
    Lista vazia -> 0
    """
    pass


def filtrar_por_prioridade(tickets, prioridade):
    """Devolve uma NOVA lista só com os tickets cuja chave "prioridade" é igual a `prioridade`.

    Mantém a ordem original e não altera a lista recebida.
    Se nenhum ticket combinar, devolve [].
    """
    pass
