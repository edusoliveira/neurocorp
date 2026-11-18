import csv
from collections.abc import Iterable
from pathlib import Path
from typing import Protocol

from suporte.modelos import Prioridade, Ticket

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


class RepositorioTickets(Protocol):
    """Contrato de qualquer lugar onde os tickets ficam guardados."""

    def listar(self) -> list[Ticket]: ...

    def buscar(self, id_ticket: int) -> Ticket | None: ...

    def salvar(self, ticket: Ticket) -> None: ...


class RepositorioEmMemoria:
    """Tickets guardados num dicionário (ótimo para testes)."""

    def __init__(self, tickets: Iterable[Ticket] = ()) -> None:
        self._tickets: dict[int, Ticket] = {ticket.id: ticket for ticket in tickets}

    def listar(self) -> list[Ticket]:
        return list(self._tickets.values())

    def buscar(self, id_ticket: int) -> Ticket | None:
        return self._tickets.get(id_ticket)

    def salvar(self, ticket: Ticket) -> None:
        self._tickets[ticket.id] = ticket


def ticket_para_linha(ticket: Ticket) -> dict[str, str]:
    """Converte o Ticket de volta para uma linha de texto do CSV."""
    return {
        "id": str(ticket.id),
        "cliente": ticket.cliente,
        "categoria": ticket.categoria,
        "prioridade": str(ticket.prioridade),
        "status": str(ticket.status),
        "canal": ticket.canal,
        "aberto_em": ticket.aberto_em.isoformat(timespec="minutes"),
        "fechado_em": ticket.fechado_em.isoformat(timespec="minutes") if ticket.fechado_em else "",
        "assunto": ticket.assunto,
    }


class RepositorioCsv:
    """Tickets guardados num arquivo CSV (lido e regravado a cada operação)."""

    def __init__(self, caminho: str | Path) -> None:
        self.caminho = Path(caminho)

    def listar(self) -> list[Ticket]:
        if not self.caminho.exists():
            return []
        with self.caminho.open(encoding="utf-8", newline="") as arquivo:
            return [Ticket.de_linha(linha) for linha in csv.DictReader(arquivo)]

    def buscar(self, id_ticket: int) -> Ticket | None:
        return next((ticket for ticket in self.listar() if ticket.id == id_ticket), None)

    def salvar(self, ticket: Ticket) -> None:
        tickets = {atual.id: atual for atual in self.listar()}
        tickets[ticket.id] = ticket
        with self.caminho.open("w", encoding="utf-8", newline="") as arquivo:
            escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
            escritor.writeheader()
            escritor.writerows(ticket_para_linha(atual) for atual in tickets.values())


def tickets_urgentes_abertos(repo: RepositorioTickets) -> list[Ticket]:
    """Tickets urgentes ainda abertos, do mais antigo para o mais novo."""
    urgentes = [t for t in repo.listar() if t.prioridade == Prioridade.URGENTE and t.esta_aberto]
    return sorted(urgentes, key=lambda ticket: ticket.aberto_em)
