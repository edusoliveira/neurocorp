# T015 — Validação dos dados sujos com Pydantic
# Você vai precisar também de: from datetime import datetime,
# ValidationError e field_validator (de pydantic), Prioridade e Status (de suporte.modelos)
# e normalizar_assunto (de suporte.texto).
from pydantic import BaseModel

from suporte.modelos import Ticket


class TicketEntrada(BaseModel):
    """Uma linha crua do CSV, convertida e validada.

    Campos (nesta ordem): id: int (positivo), cliente: str, categoria: str (strip + lower, não vazia),
    prioridade: Prioridade (strip + lower antes de converter), status: Status, canal: str,
    aberto_em: datetime, fechado_em: datetime | None = None ("" vira None),
    assunto: str (normalizado com normalizar_assunto).
    Use @field_validator (com @classmethod logo abaixo) para as regras.
    """

    def para_ticket(self) -> Ticket:
        """Devolve o Ticket (dataclass do T014) com os mesmos valores."""
        pass


def validar_linhas(linhas: list[dict[str, str]]) -> tuple[list[TicketEntrada], list[str]]:
    """Valida cada linha e devolve a tupla (validos, erros).

    validos: os TicketEntrada das linhas válidas, na ordem.
    erros: uma mensagem por linha inválida, no formato "linha <n>: <campos>"
           (n começa em 1; campos separados por ", "). Ex.: "linha 4: id"
    """
    pass
