import copy
from datetime import datetime


def criar_ticket(id_, aberto_em, status="aberto"):
    return {
        "id": id_,
        "cliente": "Cliente Teste",
        "categoria": "tecnico",
        "prioridade": "media",
        "status": status,
        "canal": "email",
        "aberto_em": aberto_em,
        "fechado_em": "",
        "assunto": "Assunto qualquer",
    }


def fila_desordenada():
    return [
        criar_ticket(1, "2026-11-04T09:00"),
        criar_ticket(2, "2026-11-03T15:30"),
        criar_ticket(3, "2026-11-05T08:00"),
        criar_ticket(4, "2026-11-03T08:10"),
    ]


def ids(tickets):
    return [t["id"] for t in tickets] if isinstance(tickets, list) else tickets


def test_ordenar_mais_antigo_primeiro():
    from suporte.sla import ordenar_por_antiguidade

    resultado = ordenar_por_antiguidade(fila_desordenada())
    assert ids(resultado) == [4, 2, 1, 3], (
        f"A ordem esperada (ids) era [4, 2, 1, 3], mas recebi {ids(resultado)!r}."
    )


def test_ordenar_nao_altera_original():
    from suporte.sla import ordenar_por_antiguidade

    tickets = fila_desordenada()
    original = copy.deepcopy(tickets)
    resultado = ordenar_por_antiguidade(tickets)
    assert ids(resultado) == [4, 2, 1, 3], (
        f"A função deveria devolver a lista ordenada [4, 2, 1, 3], mas devolveu {ids(resultado)!r}."
    )
    assert tickets == original, (
        f"A lista recebida foi alterada: a ordem dela virou {ids(tickets)}. Use sorted(), que cria uma lista nova."
    )


def test_fora_do_sla_basico():
    from suporte.sla import tickets_fora_do_sla

    agora = datetime(2026, 11, 4, 10, 0)
    tickets = [
        criar_ticket(1, "2026-11-03T08:00"),
        criar_ticket(2, "2026-11-04T09:00"),
        criar_ticket(3, "2026-11-02T10:00", status="em_andamento"),
    ]
    resultado = tickets_fora_do_sla(tickets, agora, 24)
    assert ids(resultado) == [1, 3], (
        f"Com agora=04/11 10:00 e limite de 24h, esperava os tickets [1, 3], mas recebi {ids(resultado)!r}."
    )

    resultado = tickets_fora_do_sla(tickets, agora, 0.5)
    assert ids(resultado) == [1, 2, 3], (
        f"Com limite de 0.5h, todos os 3 tickets estão atrasados, mas recebi {ids(resultado)!r}."
    )


def test_fora_do_sla_fechados_e_limite():
    from suporte.sla import tickets_fora_do_sla

    agora = datetime(2026, 11, 4, 10, 0)
    tickets = [
        criar_ticket(1, "2026-11-03T08:00"),
        criar_ticket(3, "2026-11-01T08:00", status="fechado"),
        criar_ticket(5, "2026-11-03T10:00"),
    ]
    resultado = tickets_fora_do_sla(tickets, agora, 24)
    assert ids(resultado) == [1], (
        "O ticket 3 está fechado e o ticket 5 está exatamente no limite de 24h: só o ticket 1 "
        f"deveria aparecer, mas recebi {ids(resultado)!r}."
    )

    resultado = tickets_fora_do_sla(tickets, agora, 100)
    assert resultado == [], f"Com limite de 100h ninguém está atrasado: esperava [], recebi {ids(resultado)!r}."
