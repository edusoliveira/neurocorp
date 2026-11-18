# T004 — Padronizar o assunto dos tickets

PALAVRAS_URGENTES = ["urgente", "parado", "fora do ar", "não funciona", "bloqueada"]


def normalizar_assunto(texto):
    """Devolve o assunto padronizado.

    - tira os espaços do começo e do fim;
    - troca espaços repetidos no meio por um espaço só;
    - primeira letra maiúscula, o resto minúsculo.

    Exemplo: normalizar_assunto("   pedido    ATRASADO   ") -> "Pedido atrasado"
    """
    pass


def parece_urgente(texto):
    """Devolve True se o texto contém alguma palavra de PALAVRAS_URGENTES, senão False.

    Não liga para maiúsculas/minúsculas.
    Exemplo: parece_urgente("SITE FORA DO AR") -> True
    """
    pass
