from datetime import datetime
from enum import StrEnum

import pytest


def linha(**mudancas):
    base = {
        "id": "7",
        "cliente": "Padaria Pão Quente",
        "categoria": "cobranca",
        "prioridade": "alta",
        "status": "fechado",
        "canal": "email",
        "aberto_em": "2026-11-03T08:00",
        "fechado_em": "2026-11-03T10:30",
        "assunto": "Boleto não foi gerado",
    }
    base.update(mudancas)
    return base


def test_prioridade_enum():
    from suporte.modelos import Prioridade

    assert issubclass(Prioridade, StrEnum), "`Prioridade` deveria herdar de StrEnum."
    nomes = [p.name for p in Prioridade]
    valores = [p.value for p in Prioridade]
    assert nomes == ["BAIXA", "MEDIA", "ALTA", "URGENTE"], (
        f"Os membros deveriam ser BAIXA, MEDIA, ALTA e URGENTE (nesta ordem), mas são {nomes}."
    )
    assert valores == ["baixa", "media", "alta", "urgente"], (
        f"Os valores deveriam ser ['baixa', 'media', 'alta', 'urgente'], mas são {valores}."
    )
    assert Prioridade("urgente") is Prioridade.URGENTE, "Prioridade('urgente') deveria devolver Prioridade.URGENTE."
    assert Prioridade.ALTA == "alta", "Um StrEnum deveria ser igual ao seu texto: Prioridade.ALTA == 'alta'."


def test_status_enum():
    from suporte.modelos import Status

    assert issubclass(Status, StrEnum), "`Status` deveria herdar de StrEnum."
    pares = [(s.name, s.value) for s in Status]
    esperado = [("ABERTO", "aberto"), ("EM_ANDAMENTO", "em_andamento"), ("FECHADO", "fechado")]
    assert pares == esperado, f"Os membros (nome, valor) deveriam ser {esperado}, mas são {pares}."


def test_peso_da_prioridade():
    from suporte.modelos import Prioridade

    esperado = {"baixa": 1, "media": 2, "alta": 3, "urgente": 4}
    recebido = {p.value: p.peso for p in Prioridade}
    assert recebido == esperado, f"Os pesos deveriam ser {esperado}, mas são {recebido}."
    ordem = sorted([Prioridade.URGENTE, Prioridade.BAIXA, Prioridade.ALTA, Prioridade.MEDIA], key=lambda p: p.peso)
    assert ordem == [Prioridade.BAIXA, Prioridade.MEDIA, Prioridade.ALTA, Prioridade.URGENTE], (
        f"Ordenando pelo peso, a ordem deveria ser baixa, media, alta, urgente, mas foi {ordem}."
    )


def test_de_linha_usa_enums():
    from suporte.modelos import Prioridade, Status, Ticket

    ticket = Ticket.de_linha(linha())
    assert ticket.prioridade is Prioridade.ALTA, (
        f"`prioridade` deveria ser Prioridade.ALTA, mas veio {ticket.prioridade!r}."
    )
    assert ticket.status is Status.FECHADO, f"`status` deveria ser Status.FECHADO, mas veio {ticket.status!r}."
    assert ticket.esta_aberto is False, "Um ticket com Status.FECHADO não deveria estar aberto."
    aberto = Ticket.de_linha(linha(status="em_andamento", fechado_em="", prioridade="urgente"))
    assert aberto.status is Status.EM_ANDAMENTO and aberto.prioridade is Prioridade.URGENTE, (
        f"Esperava Status.EM_ANDAMENTO e Prioridade.URGENTE, mas veio {aberto.status!r} e {aberto.prioridade!r}."
    )
    assert aberto.esta_aberto is True, "Um ticket em andamento deveria estar aberto."
    assert aberto.id == 7 and aberto.fechado_em is None, "O que o T013 já fazia (id int, fechado_em None) parou de funcionar."
    assert ticket.horas_aberto(datetime(2026, 11, 4)) == pytest.approx(2.5), (
        "`horas_aberto` parou de funcionar: aberto às 08:00 e fechado às 10:30 deveria dar 2.5."
    )


def test_de_linha_rejeita_valor_desconhecido():
    from suporte.modelos import Ticket

    with pytest.raises(ValueError):
        Ticket.de_linha(linha(prioridade="altíssima"))
        pytest.fail("A prioridade 'altíssima' não existe, mas de_linha não gerou ValueError.")
    with pytest.raises(ValueError):
        Ticket.de_linha(linha(status="pendente"))
        pytest.fail("O status 'pendente' não existe, mas de_linha não gerou ValueError.")


def test_ordenar_por_urgencia():
    from suporte.modelos import Ticket, ordenar_por_urgencia

    dados = [
        ("1", "baixa", "2026-11-03T08:00"),
        ("2", "urgente", "2026-11-03T12:00"),
        ("3", "alta", "2026-11-03T09:00"),
        ("4", "urgente", "2026-11-03T07:00"),
        ("5", "media", "2026-11-03T06:00"),
        ("6", "alta", "2026-11-03T08:30"),
    ]
    tickets = [
        Ticket.de_linha(linha(id=i, prioridade=p, aberto_em=a, status="aberto", fechado_em=""))
        for i, p, a in dados
    ]
    copia = list(tickets)
    ordenados = ordenar_por_urgencia(tickets)
    ids = [t.id for t in ordenados] if ordenados else ordenados
    assert ids == [4, 2, 6, 3, 5, 1], (
        f"A ordem dos ids deveria ser [4, 2, 6, 3, 5, 1] (urgência primeiro, depois o mais antigo), mas foi {ids}."
    )
    assert tickets == copia, "A lista recebida não deveria ser alterada — devolva uma lista nova."
