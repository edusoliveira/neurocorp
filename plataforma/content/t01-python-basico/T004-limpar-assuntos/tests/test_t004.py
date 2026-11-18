def test_normalizar_remove_espacos():
    from suporte.texto import normalizar_assunto

    casos = [
        ("  Esqueci minha senha  ", "Esqueci minha senha"),
        ("Erro    500 ao   salvar", "Erro 500 ao salvar"),
        ("", ""),
    ]
    for entrada, esperado in casos:
        recebido = normalizar_assunto(entrada)
        assert recebido == esperado, (
            f"normalizar_assunto({entrada!r}) deveria devolver {esperado!r}, mas devolveu {recebido!r}."
        )


def test_normalizar_maiusculas():
    from suporte.texto import normalizar_assunto

    casos = [
        ("APP NÃO ABRE", "App não abre"),
        ("erro 500 ao salvar", "Erro 500 ao salvar"),
        ("   pedido    ATRASADO   ", "Pedido atrasado"),
    ]
    for entrada, esperado in casos:
        recebido = normalizar_assunto(entrada)
        assert recebido == esperado, (
            f"normalizar_assunto({entrada!r}) deveria devolver {esperado!r}, mas devolveu {recebido!r}."
        )


def test_parece_urgente_detecta():
    from suporte.texto import parece_urgente

    casos = [
        "Sistema parado, não funciona nada",
        "SITE FORA DO AR",
        "Conta Bloqueada após várias tentativas",
        "URGENTE: boleto",
        "o app NÃO FUNCIONA",
    ]
    for entrada in casos:
        recebido = parece_urgente(entrada)
        assert recebido is True, (
            f"parece_urgente({entrada!r}) deveria devolver True, mas devolveu {recebido!r}."
        )


def test_parece_urgente_falso():
    from suporte.texto import parece_urgente

    for entrada in ["Esqueci minha senha", "Quero trocar o produto", ""]:
        recebido = parece_urgente(entrada)
        assert recebido is False, (
            f"parece_urgente({entrada!r}) deveria devolver False, mas devolveu {recebido!r}."
        )
