import asyncio
import time

import pytest


class ApiFalsa:
    """Consulta de mentira: espera `espera` segundos e anota quantas chamadas estão em andamento."""

    def __init__(self, espera=0.2):
        self.espera = espera
        self.em_andamento = 0
        self.max_em_andamento = 0
        self.chamadas = []

    async def __call__(self, nome):
        self.chamadas.append(nome)
        self.em_andamento += 1
        self.max_em_andamento = max(self.max_em_andamento, self.em_andamento)
        try:
            await asyncio.sleep(self.espera)
        finally:
            self.em_andamento -= 1
        return {"cliente": nome, "plano": "pro", "letras": len(nome)}


def rodar(enriquecer_todos, nomes, api, limite):
    inicio = time.perf_counter()
    resultado = asyncio.run(enriquecer_todos(nomes, api, limite))
    return resultado, time.perf_counter() - inicio


def test_enriquecer_resultados():
    from suporte.enriquecimento import enriquecer_todos

    api = ApiFalsa(espera=0.01)
    nomes = ["Padaria Pão Quente", "Loja Bella Moda", "TechNova Sistemas"]
    resultado, _ = rodar(enriquecer_todos, nomes, api, 2)
    esperado = {n: {"cliente": n, "plano": "pro", "letras": len(n)} for n in nomes}
    assert resultado == esperado, f"O resultado deveria ser {esperado}, mas veio {resultado!r}."


def test_enriquecer_e_concorrente():
    from suporte.enriquecimento import enriquecer_todos

    api = ApiFalsa(espera=0.2)
    nomes = [f"Cliente {i}" for i in range(10)]
    resultado, segundos = rodar(enriquecer_todos, nomes, api, 10)
    assert isinstance(resultado, dict) and len(resultado) == 10, (
        f"Esperava um dicionário com os 10 clientes, mas veio {resultado!r}."
    )
    assert segundos < 1.0, (
        f"10 consultas de 0,2 s com limite 10 levaram {segundos:.2f} s. Rodando uma por vez levariam 2 s; "
        "ao mesmo tempo deveriam levar ~0,2 s. Use asyncio.gather para disparar todas juntas."
    )


def test_enriquecer_respeita_limite():
    from suporte.enriquecimento import enriquecer_todos

    api = ApiFalsa(espera=0.1)
    nomes = [f"Cliente {i}" for i in range(10)]
    resultado, _ = rodar(enriquecer_todos, nomes, api, 3)
    assert isinstance(resultado, dict) and len(resultado) == 10, (
        f"Esperava um dicionário com os 10 clientes, mas veio {resultado!r}."
    )
    assert api.max_em_andamento <= 3, (
        f"Com limite 3, chegaram a rodar {api.max_em_andamento} consultas ao mesmo tempo. Use asyncio.Semaphore(limite)."
    )
    assert api.max_em_andamento == 3, (
        f"Com limite 3, no máximo {api.max_em_andamento} consulta(s) rodaram juntas — deveriam ser 3 ao mesmo tempo."
    )


def test_enriquecer_nomes_repetidos():
    from suporte.enriquecimento import enriquecer_todos

    api = ApiFalsa(espera=0.01)
    nomes = ["Loja Bella Moda", "Padaria Pão Quente", "Loja Bella Moda", "Loja Bella Moda"]
    resultado, _ = rodar(enriquecer_todos, nomes, api, 5)
    assert isinstance(resultado, dict) and set(resultado) == {"Loja Bella Moda", "Padaria Pão Quente"}, (
        f"O resultado deveria ter os 2 clientes distintos, mas veio {resultado!r}."
    )
    assert sorted(api.chamadas) == ["Loja Bella Moda", "Padaria Pão Quente"], (
        f"Cada cliente deveria ser consultado uma vez só, mas as consultas foram {api.chamadas}."
    )


def test_enriquecer_limite_invalido_e_lista_vazia():
    from suporte.enriquecimento import enriquecer_todos

    api = ApiFalsa(espera=0.01)
    with pytest.raises(ValueError):
        asyncio.run(enriquecer_todos(["Cliente"], api, 0))
        pytest.fail("limite=0 deveria gerar ValueError.")
    resultado, _ = rodar(enriquecer_todos, [], api, 3)
    assert resultado == {}, f"Com a lista vazia o resultado deveria ser {{}}, mas veio {resultado!r}."
