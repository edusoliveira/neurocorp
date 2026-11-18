# T003 — Classificar a prioridade de um ticket
# Use if / elif / else para aplicar as regras do ticket, na ordem certa.


def classificar_prioridade(horas_aberto, cliente_vip):
    """Devolve "urgente", "alta", "media" ou "baixa".

    Regras (nesta ordem):
        1. cliente_vip é True e horas_aberto > 2  -> "urgente"
        2. horas_aberto > 24                       -> "alta"
        3. horas_aberto > 8                        -> "media"
        4. qualquer outro caso                     -> "baixa"
    """
    pass
