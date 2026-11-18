import csv
from datetime import datetime
from pathlib import Path

import pytest
from pydantic import ValidationError


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


def validar(classe, dados):
    try:
        return classe.model_validate(dados)
    except ValidationError as erro:
        raise AssertionError(f"A linha {dados} deveria ser válida, mas o Pydantic recusou:\n{erro}") from erro


def test_entrada_converte_tipos():
    from suporte.modelos import Prioridade, Status
    from suporte.schemas import TicketEntrada

    modelo = validar(TicketEntrada, linha())
    assert getattr(modelo, "id", None) == 7 and type(modelo.id) is int, (
        f"`id` deveria virar o inteiro 7, mas veio {getattr(modelo, 'id', None)!r}."
    )
    assert getattr(modelo, "prioridade", None) is Prioridade.ALTA, (
        f"`prioridade` deveria virar Prioridade.ALTA, mas veio {getattr(modelo, 'prioridade', None)!r}."
    )
    assert getattr(modelo, "status", None) is Status.FECHADO, (
        f"`status` deveria virar Status.FECHADO, mas veio {getattr(modelo, 'status', None)!r}."
    )
    assert getattr(modelo, "aberto_em", None) == datetime(2026, 11, 3, 8, 0), (
        f"`aberto_em` deveria virar datetime(2026, 11, 3, 8, 0), mas veio {getattr(modelo, 'aberto_em', None)!r}."
    )
    assert getattr(modelo, "fechado_em", None) == datetime(2026, 11, 3, 10, 30), (
        f"`fechado_em` deveria virar datetime(2026, 11, 3, 10, 30), mas veio {getattr(modelo, 'fechado_em', None)!r}."
    )
    assert getattr(modelo, "cliente", None) == "Padaria Pão Quente" and getattr(modelo, "canal", None) == "email", (
        f"`cliente` e `canal` deveriam ficar como vieram, mas o modelo ficou {modelo!r}."
    )


def test_entrada_limpa_campos():
    from suporte.modelos import Prioridade
    from suporte.schemas import TicketEntrada

    modelo = validar(
        TicketEntrada,
        linha(prioridade=" ALTA ", categoria="  Tecnico ", assunto="   pedido    ATRASADO   ", fechado_em="",
              status="aberto"),
    )
    assert getattr(modelo, "prioridade", None) is Prioridade.ALTA, (
        f"A prioridade ' ALTA ' deveria virar Prioridade.ALTA, mas veio {getattr(modelo, 'prioridade', None)!r}."
    )
    assert getattr(modelo, "categoria", None) == "tecnico", (
        f"A categoria '  Tecnico ' deveria virar 'tecnico', mas veio {getattr(modelo, 'categoria', None)!r}."
    )
    assert getattr(modelo, "assunto", None) == "Pedido atrasado", (
        f"O assunto deveria virar 'Pedido atrasado', mas veio {getattr(modelo, 'assunto', None)!r}."
    )
    assert "fechado_em" in type(modelo).model_fields and modelo.fechado_em is None, (
        f"`fechado_em` vazio deveria virar None, mas veio {getattr(modelo, 'fechado_em', 'campo inexistente')!r}."
    )


def test_entrada_rejeita_id_invalido():
    from suporte.schemas import TicketEntrada

    for valor in ["abc", "", "0", "-3"]:
        with pytest.raises(ValidationError):
            TicketEntrada.model_validate(linha(id=valor))
            pytest.fail(f"O id {valor!r} não é um inteiro positivo, mas o modelo aceitou.")


def test_entrada_rejeita_categoria_e_prioridade():
    from suporte.schemas import TicketEntrada

    for campo, valor in [("categoria", ""), ("categoria", "   "), ("prioridade", "altíssima"), ("prioridade", "")]:
        with pytest.raises(ValidationError):
            TicketEntrada.model_validate(linha(**{campo: valor}))
            pytest.fail(f"O modelo aceitou {campo}={valor!r}, que deveria ser inválido.")


def test_validar_linhas_separa_validos_e_erros():
    from suporte.schemas import TicketEntrada, validar_linhas

    linhas = [
        linha(id="1"),
        linha(id="abc"),
        linha(id="3", prioridade=" Media "),
        linha(id="4"),
        linha(id="5", categoria="", prioridade="altíssima"),
    ]
    resultado = validar_linhas(linhas)
    assert isinstance(resultado, tuple) and len(resultado) == 2, (
        f"validar_linhas deveria devolver a tupla (validos, erros), mas devolveu {resultado!r}."
    )
    validos, erros = resultado
    assert all(isinstance(v, TicketEntrada) for v in validos), "Os válidos deveriam ser objetos TicketEntrada."
    ids = [v.id for v in validos]
    assert ids == [1, 3, 4], f"Os válidos deveriam ter ids [1, 3, 4], mas vieram {ids}."
    assert len(erros) == 2, f"Deveria haver 2 mensagens de erro (linhas 2 e 5), mas vieram {erros!r}."
    assert erros[0].startswith("linha 2:") and "id" in erros[0], (
        f"A 1ª mensagem deveria começar com 'linha 2:' e citar o campo id, mas foi {erros[0]!r}."
    )
    assert erros[1].startswith("linha 5:") and "categoria" in erros[1] and "prioridade" in erros[1], (
        f"A 2ª mensagem deveria começar com 'linha 5:' e citar categoria e prioridade, mas foi {erros[1]!r}."
    )


def test_validar_linhas_dados_sujos():
    from suporte.limpeza import carregar_tickets_limpos
    from suporte.schemas import validar_linhas

    origem = Path("data") / "tickets_sujos.csv"
    assert origem.exists(), "Não encontrei data/tickets_sujos.csv na pasta do projeto."
    with open(origem, encoding="utf-8", newline="") as arquivo:
        linhas = list(csv.DictReader(arquivo))
    validos, erros = validar_linhas(linhas)
    assert len(validos) == 36 and len(erros) == 4, (
        f"Com tickets_sujos.csv deveriam ser 36 válidos e 4 erros, mas vieram {len(validos)} e {len(erros)}."
    )
    t009, _ = carregar_tickets_limpos(str(origem))
    assert [v.id for v in validos] == [t["id"] for t in t009], (
        "Os tickets válidos deveriam ser os mesmos do carregar_tickets_limpos do T009."
    )
    assert [e.split(":")[0] for e in erros] == ["linha 4", "linha 8", "linha 12", "linha 20"], (
        f"As linhas com erro deveriam ser 4, 8, 12 e 20, mas as mensagens foram {erros}."
    )


def test_para_ticket():
    from suporte.modelos import Prioridade, Status, Ticket
    from suporte.schemas import TicketEntrada

    modelo = validar(TicketEntrada, linha(prioridade=" URGENTE ", status="aberto", fechado_em=""))
    ticket = modelo.para_ticket()
    assert isinstance(ticket, Ticket), f"para_ticket() deveria devolver um Ticket, mas devolveu {ticket!r}."
    assert ticket.id == 7 and ticket.prioridade is Prioridade.URGENTE and ticket.status is Status.ABERTO, (
        f"O Ticket deveria ter id 7, Prioridade.URGENTE e Status.ABERTO, mas ficou {ticket!r}."
    )
    assert ticket.fechado_em is None and ticket.esta_aberto, f"O Ticket deveria estar aberto, mas ficou {ticket!r}."
