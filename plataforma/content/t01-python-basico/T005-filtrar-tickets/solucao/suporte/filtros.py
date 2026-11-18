def contar_abertos(tickets):
    """Devolve quantos tickets têm status diferente de "fechado"."""
    total = 0
    for ticket in tickets:
        if ticket["status"] != "fechado":
            total += 1
    return total


def filtrar_por_prioridade(tickets, prioridade):
    """Devolve uma nova lista só com os tickets da prioridade pedida."""
    resultado = []
    for ticket in tickets:
        if ticket["prioridade"] == prioridade:
            resultado.append(ticket)
    return resultado
