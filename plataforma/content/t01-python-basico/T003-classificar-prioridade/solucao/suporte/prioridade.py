def classificar_prioridade(horas_aberto, cliente_vip):
    """Devolve "urgente", "alta", "media" ou "baixa" conforme as regras do suporte."""
    if cliente_vip and horas_aberto > 2:
        return "urgente"
    elif horas_aberto > 24:
        return "alta"
    elif horas_aberto > 8:
        return "media"
    else:
        return "baixa"
