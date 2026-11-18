# T008 — Fila por antiguidade e tickets fora do SLA
from datetime import datetime, timedelta  # noqa: F401  (você vai precisar deles!)


def ordenar_por_antiguidade(tickets):
    """Devolve uma NOVA lista com os tickets do mais antigo (menor "aberto_em") ao mais recente.

    Não altera a lista recebida.
    """
    pass


def tickets_fora_do_sla(tickets, agora, limite_horas):
    """Devolve os tickets não fechados abertos há MAIS de `limite_horas` horas.

    - `agora` é um datetime;
    - status "fechado" nunca entra;
    - exatamente no limite ainda não está fora do SLA;
    - mantém a ordem da lista recebida.
    """
    pass
