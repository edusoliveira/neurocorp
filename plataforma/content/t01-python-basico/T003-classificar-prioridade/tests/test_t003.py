def conferir(classificar_prioridade, casos):
    for (horas, vip), esperado in casos:
        recebido = classificar_prioridade(horas, vip)
        assert recebido == esperado, (
            f"classificar_prioridade({horas}, {vip}) deveria devolver {esperado!r}, "
            f"mas devolveu {recebido!r}."
        )


def test_prioridade_baixa():
    from suporte.prioridade import classificar_prioridade

    conferir(classificar_prioridade, [((1, False), "baixa"), ((0, False), "baixa"), ((5.5, False), "baixa")])


def test_prioridade_media_e_alta():
    from suporte.prioridade import classificar_prioridade

    conferir(
        classificar_prioridade,
        [((8.5, False), "media"), ((12, False), "media"), ((30, False), "alta"), ((100, False), "alta")],
    )


def test_prioridade_vip_urgente():
    from suporte.prioridade import classificar_prioridade

    conferir(
        classificar_prioridade,
        [((2.5, True), "urgente"), ((10, True), "urgente"), ((30, True), "urgente"), ((1, True), "baixa")],
    )


def test_prioridade_limites_exatos():
    from suporte.prioridade import classificar_prioridade

    conferir(classificar_prioridade, [((8, False), "baixa"), ((24, False), "media"), ((2, True), "baixa")])
