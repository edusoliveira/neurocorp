import copy


def criar_ticket(id_, prioridade="media", status="aberto"):
    return {
        "id": id_,
        "cliente": "Cliente Teste",
        "categoria": "tecnico",
        "prioridade": prioridade,
        "status": status,
        "canal": "email",
        "aberto_em": "2026-11-03T08:00",
        "fechado_em": "",
        "assunto": "Assunto qualquer",
    }


def test_contar_abertos():
    from suporte.filtros import contar_abertos

    status = ["aberto", "fechado", "em_andamento", "fechado", "aberto"]
    tickets = [criar_ticket(i, status=s) for i, s in enumerate(status, start=1)]
    recebido = contar_abertos(tickets)
    assert recebido == 3, (
        f"Com os status {status}, contar_abertos deveria devolver 3, mas devolveu {recebido!r}."
    )

    fechados = [criar_ticket(1, status="fechado"), criar_ticket(2, status="fechado")]
    recebido = contar_abertos(fechados)
    assert recebido == 0, f"Com todos os tickets fechados o resultado deveria ser 0, mas foi {recebido!r}."


def test_contar_abertos_lista_vazia():
    from suporte.filtros import contar_abertos

    recebido = contar_abertos([])
    assert recebido == 0, f"contar_abertos([]) deveria devolver 0, mas devolveu {recebido!r}."


def test_filtrar_por_prioridade():
    from suporte.filtros import filtrar_por_prioridade

    prioridades = ["alta", "baixa", "urgente", "alta", "media"]
    tickets = [criar_ticket(i, prioridade=p) for i, p in enumerate(prioridades, start=1)]

    resultado = filtrar_por_prioridade(tickets, "alta")
    assert isinstance(resultado, list), f"A função deveria devolver uma lista, mas devolveu {resultado!r}."
    ids = [t["id"] for t in resultado]
    assert ids == [1, 4], f"Filtrando por 'alta' esperava os tickets [1, 4], mas recebi {ids}."

    resultado = filtrar_por_prioridade(tickets, "urgente")
    ids = [t["id"] for t in resultado]
    assert ids == [3], f"Filtrando por 'urgente' esperava o ticket [3], mas recebi {ids}."
    assert resultado[0] == tickets[2], "Cada item do resultado deve ser o dicionário completo do ticket."


def test_filtrar_sem_resultados():
    from suporte.filtros import filtrar_por_prioridade

    tickets = [criar_ticket(1, prioridade="baixa"), criar_ticket(2, prioridade="media")]
    original = copy.deepcopy(tickets)
    resultado = filtrar_por_prioridade(tickets, "urgente")
    assert resultado == [], f"Sem tickets 'urgente' a função deveria devolver [], mas devolveu {resultado!r}."
    assert tickets == original, "A lista recebida foi alterada! Crie uma lista nova em vez de mexer na original."
