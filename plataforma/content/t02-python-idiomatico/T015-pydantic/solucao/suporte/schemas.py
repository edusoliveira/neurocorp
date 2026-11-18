from datetime import datetime
from typing import Any

from pydantic import BaseModel, ValidationError, field_validator

from suporte.modelos import Prioridade, Status, Ticket
from suporte.texto import normalizar_assunto


class TicketEntrada(BaseModel):
    """Uma linha crua do CSV, convertida e validada."""

    id: int
    cliente: str
    categoria: str
    prioridade: Prioridade
    status: Status
    canal: str
    aberto_em: datetime
    fechado_em: datetime | None = None
    assunto: str

    @field_validator("id")
    @classmethod
    def id_positivo(cls, valor: int) -> int:
        if valor <= 0:
            raise ValueError("o id precisa ser um inteiro positivo")
        return valor

    @field_validator("categoria", "prioridade", mode="before")
    @classmethod
    def limpar_texto(cls, valor: Any) -> Any:
        return valor.strip().lower() if isinstance(valor, str) else valor

    @field_validator("categoria")
    @classmethod
    def categoria_preenchida(cls, valor: str) -> str:
        if not valor:
            raise ValueError("a categoria não pode ficar vazia")
        return valor

    @field_validator("fechado_em", mode="before")
    @classmethod
    def vazio_vira_none(cls, valor: Any) -> Any:
        if isinstance(valor, str) and not valor.strip():
            return None
        return valor

    @field_validator("assunto")
    @classmethod
    def normalizar(cls, valor: str) -> str:
        return normalizar_assunto(valor)

    def para_ticket(self) -> Ticket:
        """Converte para o Ticket (dataclass) do T014."""
        return Ticket(**self.model_dump())


def validar_linhas(linhas: list[dict[str, str]]) -> tuple[list[TicketEntrada], list[str]]:
    """Valida cada linha; devolve (válidos, mensagens "linha <n>: <campos>" das inválidas)."""
    validos: list[TicketEntrada] = []
    erros: list[str] = []
    for numero, linha in enumerate(linhas, start=1):
        try:
            validos.append(TicketEntrada.model_validate(linha))
        except ValidationError as erro:
            campos = dict.fromkeys(str(item["loc"][0]) if item["loc"] else "linha" for item in erro.errors())
            erros.append(f"linha {numero}: {', '.join(campos)}")
    return validos, erros
