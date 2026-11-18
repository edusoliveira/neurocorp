import pytest

from suporte.prioridade import classificar_prioridade


@pytest.mark.parametrize(
    ("horas", "esperado"),
    [(0, "baixa"), (5, "baixa"), (12, "media"), (30, "alta")],
)
def test_cliente_comum(horas: float, esperado: str) -> None:
    assert classificar_prioridade(horas, False) == esperado


def test_limite_de_8_horas() -> None:
    assert classificar_prioridade(8, False) == "baixa"
    assert classificar_prioridade(8.5, False) == "media"


def test_limite_de_24_horas() -> None:
    assert classificar_prioridade(24, False) == "media"
    assert classificar_prioridade(24.5, False) == "alta"


def test_vip_acima_de_2_horas_e_urgente() -> None:
    assert classificar_prioridade(3, True) == "urgente"


def test_vip_com_exatamente_2_horas_ainda_nao_e_urgente() -> None:
    assert classificar_prioridade(2, True) == "baixa"
    assert classificar_prioridade(1, True) == "baixa"


def test_vip_continua_urgente_depois_de_24_horas() -> None:
    assert classificar_prioridade(30, True) == "urgente"
