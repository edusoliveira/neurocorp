# T013 — Um modelo Ticket de verdade com dataclass
# Transforme a classe abaixo numa @dataclass(frozen=True) com os campos do CSV.
from datetime import datetime
from typing import Self


class Ticket:
    """Um ticket de suporte, com cada campo já no tipo certo.

    Campos (nesta ordem): id: int, cliente: str, categoria: str, prioridade: str,
    status: str, canal: str, aberto_em: datetime, fechado_em: datetime | None, assunto: str
    """

    def esta_aberto(self) -> bool:
        """True enquanto o status for diferente de "fechado". Deve ser uma @property."""
        pass

    def horas_aberto(self, agora: datetime) -> float:
        """Horas entre aberto_em e fechado_em (ou `agora`, se fechado_em for None), sem arredondar.

        Exemplo: aberto às 08:00 e fechado às 10:30 -> 2.5
        """
        pass

    @classmethod
    def de_linha(cls, linha: dict[str, str]) -> Self:
        """Cria um Ticket a partir de uma linha do csv.DictReader (`cls` é a própria classe Ticket).

        id -> int; aberto_em -> datetime; fechado_em -> datetime, ou None se vier "".
        """
        pass
