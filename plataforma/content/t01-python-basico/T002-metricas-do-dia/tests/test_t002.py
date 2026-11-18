def test_calcular_pendentes():
    from suporte.metricas import calcular_pendentes

    casos = [((42, 30), 12), ((10, 10), 0), ((5, 0), 5)]
    for (recebidos, resolvidos), esperado in casos:
        recebido = calcular_pendentes(recebidos, resolvidos)
        assert recebido == esperado, (
            f"calcular_pendentes({recebidos}, {resolvidos}) deveria devolver {esperado}, "
            f"mas devolveu {recebido!r}."
        )


def test_taxa_resolucao_basica():
    from suporte.metricas import calcular_taxa_resolucao

    casos = [((40, 30), 75.0), ((8, 8), 100.0), ((10, 0), 0.0)]
    for (recebidos, resolvidos), esperado in casos:
        recebido = calcular_taxa_resolucao(recebidos, resolvidos)
        assert recebido == esperado, (
            f"calcular_taxa_resolucao({recebidos}, {resolvidos}) deveria devolver {esperado}, "
            f"mas devolveu {recebido!r}."
        )


def test_taxa_resolucao_arredonda():
    from suporte.metricas import calcular_taxa_resolucao

    casos = [((3, 1), 33.3), ((3, 2), 66.7)]
    for (recebidos, resolvidos), esperado in casos:
        recebido = calcular_taxa_resolucao(recebidos, resolvidos)
        assert recebido == esperado, (
            f"calcular_taxa_resolucao({recebidos}, {resolvidos}) deveria devolver {esperado} "
            f"(arredondado para 1 casa decimal), mas devolveu {recebido!r}."
        )


def test_taxa_resolucao_sem_tickets():
    from suporte.metricas import calcular_taxa_resolucao

    recebido = calcular_taxa_resolucao(0, 0)
    assert isinstance(recebido, float) and recebido == 0.0, (
        f"Com 0 tickets recebidos a taxa deveria ser 0.0, mas a função devolveu {recebido!r}."
    )
