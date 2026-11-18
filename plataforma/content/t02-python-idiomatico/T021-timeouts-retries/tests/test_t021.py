import asyncio
import time

import pytest


class Instavel:
    """Função sem argumentos que levanta os erros da lista, um por chamada, e depois devolve `valor`."""

    def __init__(self, erros, valor="ok"):
        self.erros = list(erros)
        self.valor = valor
        self.chamadas = 0
        self.instantes = []

    async def __call__(self):
        self.chamadas += 1
        self.instantes.append(time.perf_counter())
        await asyncio.sleep(0)
        if self.erros:
            raise self.erros.pop(0)
        return self.valor


def rodar(corrotina):
    return asyncio.run(corrotina)


def test_retry_sucesso_de_primeira():
    from suporte.resiliencia import com_retry

    api = Instavel([], valor={"cliente": "Padaria Pão Quente"})
    resultado = rodar(com_retry(api))
    assert resultado == {"cliente": "Padaria Pão Quente"}, f"com_retry deveria devolver o resultado, mas devolveu {resultado!r}."
    assert api.chamadas == 1, f"Deu certo de primeira, então deveria haver 1 chamada, mas houve {api.chamadas}."


def test_retry_falha_e_depois_funciona():
    from suporte.resiliencia import ErroTemporario, com_retry

    assert issubclass(ErroTemporario, Exception), "ErroTemporario deveria herdar de Exception."
    api = Instavel([ConnectionError("caiu"), ErroTemporario("instável")], valor="dados")
    resultado = rodar(com_retry(api, tentativas=3, timeout=1.0, espera_base=0.01))
    assert resultado == "dados", f"Na 3ª tentativa deu certo, então deveria devolver 'dados', mas devolveu {resultado!r}."
    assert api.chamadas == 3, f"Deveria haver 3 chamadas (2 falhas + 1 sucesso), mas houve {api.chamadas}."


def test_retry_esgota_tentativas():
    from suporte.resiliencia import com_retry

    api = Instavel([ConnectionError("falha 1"), ConnectionError("falha 2"), ConnectionError("falha 3")])
    with pytest.raises(ConnectionError) as erro:
        rodar(com_retry(api, tentativas=3, timeout=1.0, espera_base=0.01))
        pytest.fail("Todas as 3 tentativas falharam, então com_retry deveria levantar ConnectionError.")
    assert str(erro.value) == "falha 3", (
        f"Deveria subir a exceção da ÚLTIMA tentativa ('falha 3'), mas subiu {erro.value!r}."
    )
    assert api.chamadas == 3, f"Com tentativas=3 deveria haver exatamente 3 chamadas, mas houve {api.chamadas}."
    with pytest.raises(ValueError):
        rodar(com_retry(Instavel([]), tentativas=0))
        pytest.fail("tentativas=0 deveria gerar ValueError.")


def test_retry_timeout():
    from suporte.resiliencia import com_retry

    chamadas = 0

    async def travada():
        nonlocal chamadas
        chamadas += 1
        await asyncio.sleep(30)
        return "nunca"

    inicio = time.perf_counter()
    with pytest.raises(TimeoutError):
        rodar(com_retry(travada, tentativas=2, timeout=0.1, espera_base=0.01))
        pytest.fail("A função travou nas 2 tentativas, então com_retry deveria levantar TimeoutError.")
    segundos = time.perf_counter() - inicio
    assert chamadas == 2, f"Um timeout também deveria ser repetido: esperava 2 chamadas, mas houve {chamadas}."
    assert segundos < 5, f"Com timeout=0.1 o retry deveria desistir rápido, mas levou {segundos:.1f} s. Use asyncio.wait_for."


def test_retry_nao_repete_outros_erros():
    from suporte.resiliencia import com_retry

    api = Instavel([ValueError("dado inválido")], valor="não deveria chegar aqui")
    with pytest.raises(ValueError):
        rodar(com_retry(api, tentativas=3, timeout=1.0, espera_base=0.01))
        pytest.fail("Um ValueError deveria subir na hora, mas com_retry não levantou nada.")
    assert api.chamadas == 1, (
        f"ValueError não é temporário: deveria haver 1 chamada só, mas houve {api.chamadas}."
    )


def test_retry_backoff_exponencial():
    from suporte.resiliencia import ErroTemporario, com_retry

    api = Instavel([ErroTemporario("1"), ErroTemporario("2"), ErroTemporario("3")], valor="ok")
    resultado = rodar(com_retry(api, tentativas=4, timeout=1.0, espera_base=0.1))
    assert resultado == "ok" and api.chamadas == 4, (
        f"Deveria dar certo na 4ª tentativa, mas o resultado foi {resultado!r} com {api.chamadas} chamada(s)."
    )
    intervalos = [depois - antes for antes, depois in zip(api.instantes, api.instantes[1:], strict=False)]
    esperados = [0.1, 0.2, 0.4]
    texto = ", ".join(f"{s:.2f} s" for s in intervalos)
    for medido, esperado in zip(intervalos, esperados, strict=False):
        # folga generosa para cima (máquina ocupada), mas ainda pega 2**(n+1): 0,8 s > 0,7 s
        assert esperado - 0.03 <= medido < esperado * 1.5 + 0.1, (
            f"Entre as tentativas deveria esperar 0,1 s, 0,2 s e 0,4 s (espera_base * 2**n), mas esperou {texto}."
        )
