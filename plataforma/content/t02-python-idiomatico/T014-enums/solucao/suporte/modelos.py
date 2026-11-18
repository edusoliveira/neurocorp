from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Self


class Prioridade(StrEnum):
    """Prioridades aceitas, da menos para a mais urgente."""

    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"

    @property
    def peso(self) -> int:
        """Peso de urgência: baixa=1, media=2, alta=3, urgente=4."""
        return PESOS[self]


PESOS = {Prioridade.BAIXA: 1, Prioridade.MEDIA: 2, Prioridade.ALTA: 3, Prioridade.URGENTE: 4}


class Status(StrEnum):
    """Situações possíveis de um ticket."""

    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    FECHADO = "fechado"


@dataclass(frozen=True)
class Ticket:
    """Um ticket de suporte, com cada campo já no tipo certo."""

    id: int
    cliente: str
    categoria: str
    prioridade: Prioridade
    status: Status
    canal: str
    aberto_em: datetime
    fechado_em: datetime | None
    assunto: str

    @property
    def esta_aberto(self) -> bool:
        """True enquanto o ticket não está fechado."""
        return self.status != Status.FECHADO

    def horas_aberto(self, agora: datetime) -> float:
        """Horas entre a abertura e o fechamento (ou `agora`, se ainda não fechou)."""
        fim = self.fechado_em if self.fechado_em is not None else agora
        return (fim - self.aberto_em).total_seconds() / 3600

    @classmethod
    def de_linha(cls, linha: dict[str, str]) -> Self:
        """Cria um Ticket a partir de uma linha do CSV (ValueError se algum valor for inválido)."""
        fechado_em = linha["fechado_em"]
        return cls(
            id=int(linha["id"]),
            cliente=linha["cliente"],
            categoria=linha["categoria"],
            prioridade=Prioridade(linha["prioridade"]),
            status=Status(linha["status"]),
            canal=linha["canal"],
            aberto_em=datetime.fromisoformat(linha["aberto_em"]),
            fechado_em=datetime.fromisoformat(fechado_em) if fechado_em else None,
            assunto=linha["assunto"],
        )


def ordenar_por_urgencia(tickets: list[Ticket]) -> list[Ticket]:
    """Nova lista: mais urgente primeiro; no empate, o mais antigo primeiro."""
    return sorted(tickets, key=lambda ticket: (-ticket.prioridade.peso, ticket.aberto_em))
