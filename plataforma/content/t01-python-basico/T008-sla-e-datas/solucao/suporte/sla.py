from datetime import datetime, timedelta


def ordenar_por_antiguidade(tickets):
    """Devolve uma nova lista com os tickets do mais antigo ao mais recente."""
    return sorted(tickets, key=lambda ticket: datetime.fromisoformat(ticket["aberto_em"]))


def tickets_fora_do_sla(tickets, agora, limite_horas):
    """Devolve os tickets não fechados abertos há mais de `limite_horas` horas."""
    limite = timedelta(hours=limite_horas)
    atrasados = []
    for ticket in tickets:
        if ticket["status"] == "fechado":
            continue
        aberto_em = datetime.fromisoformat(ticket["aberto_em"])
        if agora - aberto_em > limite:
            atrasados.append(ticket)
    return atrasados
