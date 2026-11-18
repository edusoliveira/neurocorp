from dataclasses import dataclass
from datetime import datetime
from typing import Self


@dataclass(frozen=True)
class Ticket:
    """Um ticket de suporte, com cada campo já no tipo certo."""

    id: int
    cliente: str
    categoria: str
    prioridade: str
    status: str
    canal: str
    aberto_em: datetime
    fechado_em: datetime | None
    assunto: str

    @property
    def esta_aberto(self) -> bool:
        """True enquanto o ticket não está fechado."""
        return self.status != "fechado"

    def horas_aberto(self, agora: datetime) -> float:
        """Horas entre a abertura e o fechamento (ou `agora`, se ainda não fechou)."""
        fim = self.fechado_em if self.fechado_em is not None else agora
        return (fim - self.aberto_em).total_seconds() / 3600

    @classmethod
    def de_linha(cls, linha: dict[str, str]) -> Self:
        """Cria um Ticket a partir de uma linha do CSV (todos os valores como texto)."""
        fechado_em = linha["fechado_em"]
        return cls(
            id=int(linha["id"]),
            cliente=linha["cliente"],
            categoria=linha["categoria"],
            prioridade=linha["prioridade"],
            status=linha["status"],
            canal=linha["canal"],
            aberto_em=datetime.fromisoformat(linha["aberto_em"]),
            fechado_em=datetime.fromisoformat(fechado_em) if fechado_em else None,
            assunto=linha["assunto"],
        )
