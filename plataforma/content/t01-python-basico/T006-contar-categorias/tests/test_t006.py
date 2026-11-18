def criar_tickets(categorias):
    return [
        {"id": i, "categoria": c, "prioridade": "media", "status": "aberto"}
        for i, c in enumerate(categorias, start=1)
    ]


def test_contar_por_categoria():
    from suporte.contagens import contar_por_categoria

    categorias = ["tecnico", "cobranca", "tecnico", "entrega", "tecnico"]
    recebido = contar_por_categoria(criar_tickets(categorias))
    esperado = {"tecnico": 3, "cobranca": 1, "entrega": 1}
    assert isinstance(recebido, dict), f"A função deveria devolver um dicionário, mas devolveu {recebido!r}."
    assert recebido == esperado, (
        f"Para as categorias {categorias} esperava {esperado}, mas recebi {recebido}."
    )


def test_contar_por_categoria_vazia():
    from suporte.contagens import contar_por_categoria

    recebido = contar_por_categoria([])
    assert recebido == {}, f"contar_por_categoria([]) deveria devolver {{}}, mas devolveu {recebido!r}."


def test_categoria_mais_frequente():
    from suporte.contagens import categoria_mais_frequente

    casos = [
        (["tecnico", "cobranca", "tecnico", "entrega", "tecnico"], "tecnico"),
        (["conta", "cobranca", "cobranca"], "cobranca"),
        (["entrega"], "entrega"),
    ]
    for categorias, esperado in casos:
        recebido = categoria_mais_frequente(criar_tickets(categorias))
        assert recebido == esperado, (
            f"Para as categorias {categorias} a mais frequente é {esperado!r}, mas recebi {recebido!r}."
        )


def test_categoria_mais_frequente_empate_e_vazia():
    from suporte.contagens import categoria_mais_frequente

    casos = [
        (["entrega", "conta", "entrega", "conta"], "conta"),
        (["tecnico", "cobranca"], "cobranca"),
    ]
    for categorias, esperado in casos:
        recebido = categoria_mais_frequente(criar_tickets(categorias))
        assert recebido == esperado, (
            f"Para as categorias {categorias} há empate: deveria vencer {esperado!r} "
            f"(primeira em ordem alfabética), mas recebi {recebido!r}."
        )

    recebido = categoria_mais_frequente([])
    assert recebido is None, f"Com a lista vazia a função deveria devolver None, mas devolveu {recebido!r}."
