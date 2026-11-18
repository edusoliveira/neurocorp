# T019 — Repositório de tickets com Protocol
# Você vai precisar de: import csv, from typing import Protocol e Prioridade (de suporte.modelos).
from pathlib import Path

from suporte.modelos import Ticket

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


class RepositorioTickets:
    """Contrato (deve herdar de Protocol) com três métodos, corpo `...`:

    listar(self) -> list[Ticket]
    buscar(self, id_ticket: int) -> Ticket | None
    salvar(self, ticket: Ticket) -> None
    """


class RepositorioEmMemoria:
    """Tickets guardados na memória. RepositorioEmMemoria() começa vazio."""

    def __init__(self, tickets: list[Ticket] | None = None) -> None:
        pass

    def listar(self) -> list[Ticket]:
        """Nova lista com os tickets, na ordem de inserção."""
        pass

    def buscar(self, id_ticket: int) -> Ticket | None:
        """O ticket com esse id, ou None."""
        pass

    def salvar(self, ticket: Ticket) -> None:
        """Substitui o ticket de mesmo id (mesma posição) ou adiciona no fim."""
        pass


class RepositorioCsv:
    """Tickets guardados num arquivo CSV (lido com Ticket.de_linha, gravado com csv.DictWriter)."""

    def __init__(self, caminho: str | Path) -> None:
        pass

    def listar(self) -> list[Ticket]:
        """Lê o arquivo; se ele não existe, devolve []."""
        pass

    def buscar(self, id_ticket: int) -> Ticket | None:
        """O ticket com esse id, ou None."""
        pass

    def salvar(self, ticket: Ticket) -> None:
        """Substitui ou adiciona e regrava o arquivo inteiro, com cabeçalho (cria se não existir)."""
        pass


def tickets_urgentes_abertos(repo: RepositorioTickets) -> list[Ticket]:
    """Tickets URGENTE ainda abertos, do mais antigo para o mais novo. Use só os métodos do protocolo."""
    pass
