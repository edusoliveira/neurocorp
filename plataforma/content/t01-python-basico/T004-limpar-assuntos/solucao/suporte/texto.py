PALAVRAS_URGENTES = ["urgente", "parado", "fora do ar", "não funciona", "bloqueada"]


def normalizar_assunto(texto):
    """Devolve o assunto sem espaços sobrando, com só a primeira letra maiúscula."""
    palavras = texto.split()
    return " ".join(palavras).capitalize()


def parece_urgente(texto):
    """Devolve True se o texto contém alguma palavra de PALAVRAS_URGENTES."""
    texto_minusculo = texto.lower()
    for palavra in PALAVRAS_URGENTES:
        if palavra in texto_minusculo:
            return True
    return False
