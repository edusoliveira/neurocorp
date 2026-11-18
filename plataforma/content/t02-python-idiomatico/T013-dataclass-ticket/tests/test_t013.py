import csv
import dataclasses
import inspect
import typing
from datetime import datetime
from pathlib import Path

import pytest

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


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


def criar(classe, **mudancas):
    ticket = classe.de_linha(linha(**mudancas))
    assert isinstance(ticket, classe), f"`Ticket.de_linha` deveria devolver um Ticket, mas devolveu {ticket!r}."
    return ticket


def test_ticket_e_dataclass_com_campos():
    from suporte.modelos import Ticket

    assert dataclasses.is_dataclass(Ticket), "`Ticket` deveria ser uma dataclass (use o decorador @dataclass)."
    nomes = [campo.name for campo in dataclasses.fields(Ticket)]
    assert nomes == COLUNAS, f"Os campos deveriam ser {COLUNAS}, nesta ordem, mas são {nomes}."
    tipos = typing.get_type_hints(Ticket)
    esperados = {"id": int, "cliente": str, "aberto_em": datetime, "fechado_em": datetime | None, "assunto": str}
    for nome, tipo in esperados.items():
        assert tipos.get(nome) == tipo, f"O campo `{nome}` deveria ser do tipo {tipo}, mas está como {tipos.get(nome)!r}."


def test_ticket_imutavel():
    from suporte.modelos import Ticket

    ticket = criar(Ticket)
    with pytest.raises(dataclasses.FrozenInstanceError):
        ticket.status = "aberto"
        pytest.fail("Consegui mudar `ticket.status` — o Ticket deveria ser imutável (frozen=True).")


def test_de_linha_converte_tipos():
    from suporte.modelos import Ticket

    ticket = criar(Ticket)
    assert ticket.id == 7 and type(ticket.id) is int, f"`id` deveria ser o inteiro 7, mas veio {ticket.id!r}."
    assert ticket.aberto_em == datetime(2026, 11, 3, 8, 0), (
        f"`aberto_em` deveria ser datetime(2026, 11, 3, 8, 0), mas veio {ticket.aberto_em!r}."
    )
    assert ticket.fechado_em == datetime(2026, 11, 3, 10, 30), (
        f"`fechado_em` deveria ser datetime(2026, 11, 3, 10, 30), mas veio {ticket.fechado_em!r}."
    )
    assert ticket.cliente == "Padaria Pão Quente" and ticket.assunto == "Boleto não foi gerado", (
        f"Os campos de texto deveriam ficar como vieram, mas o ticket ficou {ticket!r}."
    )
    assert ticket.categoria == "cobranca" and ticket.canal == "email", (
        f"Os campos de texto deveriam ficar como vieram, mas o ticket ficou {ticket!r}."
    )


def test_de_linha_fechado_em_vazio_vira_none():
    from suporte.modelos import Ticket

    ticket = criar(Ticket, status="aberto", fechado_em="")
    assert ticket.fechado_em is None, f"`fechado_em` vazio deveria virar None, mas veio {ticket.fechado_em!r}."


def test_esta_aberto_e_property():
    from suporte.modelos import Ticket

    assert isinstance(inspect.getattr_static(Ticket, "esta_aberto", None), property), (
        "`esta_aberto` deveria ser uma @property (lida sem parênteses: ticket.esta_aberto)."
    )
    casos = {"aberto": True, "em_andamento": True, "fechado": False}
    for status, esperado in casos.items():
        ticket = criar(Ticket, status=status, fechado_em="" if status != "fechado" else "2026-11-03T10:30")
        assert ticket.esta_aberto is esperado, (
            f"Com status {status!r}, esta_aberto deveria ser {esperado}, mas foi {ticket.esta_aberto!r}."
        )


def test_horas_aberto():
    from suporte.modelos import Ticket

    agora = datetime(2026, 11, 4, 8, 0)
    fechado = criar(Ticket)
    horas = fechado.horas_aberto(agora)
    assert isinstance(horas, float) and horas == pytest.approx(2.5), (
        f"Aberto às 08:00 e fechado às 10:30 deveria dar 2.5 horas (float), mas deu {horas!r}."
    )
    aberto = criar(Ticket, status="aberto", fechado_em="", aberto_em="2026-11-03T20:15")
    horas = aberto.horas_aberto(agora)
    assert horas == pytest.approx(11.75), (
        f"Aberto às 20:15 do dia 3 e ainda aberto no dia 4 às 08:00 deveria dar 11.75 horas, mas deu {horas!r}."
    )


def test_de_linha_com_csv_real():
    from suporte.modelos import Ticket

    origem = Path("data") / "tickets.csv"
    assert origem.exists(), "Não encontrei data/tickets.csv na pasta do projeto."
    with open(origem, encoding="utf-8", newline="") as arquivo:
        linhas = list(csv.DictReader(arquivo))
    tickets = [Ticket.de_linha(dados) for dados in linhas]
    assert len(tickets) == len(linhas), f"Esperava {len(linhas)} tickets, mas vieram {len(tickets)}."
    abertos = sum(1 for dados in linhas if dados["status"] != "fechado")
    recebido = sum(1 for t in tickets if t.esta_aberto)
    assert recebido == abertos, f"O CSV tem {abertos} tickets abertos, mas `esta_aberto` contou {recebido}."
    sem_data = sum(1 for t in tickets if t.fechado_em is None)
    assert sem_data == abertos, (
        f"Os {abertos} tickets não fechados têm `fechado_em` vazio no CSV e deveriam ficar com None "
        f"(contei {sem_data})."
    )
