import csv
import inspect
from collections import Counter
from pathlib import Path

import pytest

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]
STATUS = ["aberto", "fechado", "em_andamento", "fechado", "fechado", "aberto", "fechado"]


def escrever_csv(pasta, quantidade):
    caminho = pasta / "tickets.csv"
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        for i in range(1, quantidade + 1):
            escritor.writerow(
                {
                    "id": i,
                    "cliente": "Padaria Pão Quente",
                    "categoria": "tecnico",
                    "prioridade": "media",
                    "status": STATUS[(i - 1) % len(STATUS)],
                    "canal": "email",
                    "aberto_em": "2026-11-03T08:00",
                    "fechado_em": "",
                    "assunto": "Erro 500 ao salvar relatório",
                }
            )
    return str(caminho)


def lotes_de(ler_em_lotes, caminho, tamanho):
    lotes = list(ler_em_lotes(caminho, tamanho))
    assert all(isinstance(lote, list) for lote in lotes), "Cada lote deveria ser uma lista de dicionários."
    return lotes


def test_ler_em_lotes_e_gerador(tmp_path):
    from suporte.streaming import ler_em_lotes

    assert inspect.isgeneratorfunction(ler_em_lotes), (
        "`ler_em_lotes` deveria ser uma função geradora — ela precisa usar `yield` para entregar cada lote."
    )
    inexistente = str(tmp_path / "nao_existe.csv")
    try:
        lotes = ler_em_lotes(inexistente, 10)
    except FileNotFoundError:
        pytest.fail("Chamar ler_em_lotes não deveria abrir o arquivo ainda — só quando o primeiro lote é pedido.")
    with pytest.raises(FileNotFoundError):
        next(lotes)
        pytest.fail("Pedir o primeiro lote de um arquivo inexistente deveria gerar FileNotFoundError.")


def test_ler_em_lotes_tamanhos(tmp_path):
    from suporte.streaming import ler_em_lotes

    lotes = lotes_de(ler_em_lotes, escrever_csv(tmp_path, 7), 3)
    tamanhos = [len(lote) for lote in lotes]
    assert tamanhos == [3, 3, 1], f"7 linhas com tamanho=3 deveriam virar lotes de [3, 3, 1], mas vieram {tamanhos}."
    ids = [linha["id"] for lote in lotes for linha in lote]
    assert ids == [str(i) for i in range(1, 8)], (
        f"As linhas deveriam sair na ordem do arquivo, sem conversão (ids '1' a '7'), mas vieram {ids}."
    )
    assert lotes[0][0]["cliente"] == "Padaria Pão Quente", (
        f"O cliente veio {lotes[0][0]['cliente']!r} — o arquivo foi aberto com encoding=\"utf-8\"?"
    )


def test_ler_em_lotes_sem_lote_vazio(tmp_path):
    from suporte.streaming import ler_em_lotes

    tamanhos = [len(lote) for lote in lotes_de(ler_em_lotes, escrever_csv(tmp_path, 6), 3)]
    assert tamanhos == [3, 3], f"6 linhas com tamanho=3 deveriam virar lotes de [3, 3], mas vieram {tamanhos}."
    vazio = lotes_de(ler_em_lotes, escrever_csv(tmp_path, 0), 5)
    assert vazio == [], f"Um arquivo só com o cabeçalho não deveria gerar nenhum lote, mas gerou {vazio!r}."


def test_ler_em_lotes_tamanho_invalido(tmp_path):
    from suporte.streaming import ler_em_lotes

    caminho = escrever_csv(tmp_path, 3)
    for tamanho in [0, -1]:
        with pytest.raises(ValueError):
            list(ler_em_lotes(caminho, tamanho))
            pytest.fail(f"tamanho={tamanho} deveria gerar ValueError.")


class UmaVezSo:
    """Iterável que só pode ser percorrido uma vez (como um gerador)."""

    def __init__(self, itens):
        self.itens = itens
        self.usos = 0

    def __iter__(self):
        self.usos += 1
        if self.usos > 1:
            raise AssertionError("contar_por_status percorreu as linhas mais de uma vez — com um gerador isso falha.")
        return iter(self.itens)


def test_contar_por_status_percorre_uma_vez():
    from suporte.streaming import contar_por_status

    linhas = [{"status": s} for s in ["aberto", "fechado", "aberto", "em_andamento", "fechado", "fechado"]]
    recebido = contar_por_status(UmaVezSo(linhas))
    esperado = {"aberto": 2, "fechado": 3, "em_andamento": 1}
    assert recebido == esperado, f"Esperava {esperado}, mas veio {recebido!r}."
    gerador = (linha for linha in linhas[:2])
    recebido = contar_por_status(gerador)
    assert recebido == {"aberto": 1, "fechado": 1}, (
        f"Com um gerador de 2 linhas esperava {{'aberto': 1, 'fechado': 1}}, mas veio {recebido!r}."
    )
    assert contar_por_status([]) == {}, "Sem linhas, o resultado deveria ser {}."


def test_contar_com_lotes_dados_reais():
    from suporte.streaming import contar_por_status, ler_em_lotes

    origem = Path("data") / "tickets.csv"
    assert origem.exists(), "Não encontrei data/tickets.csv na pasta do projeto."
    with open(origem, encoding="utf-8", newline="") as arquivo:
        esperado = dict(Counter(linha["status"] for linha in csv.DictReader(arquivo)))
    lotes = ler_em_lotes(str(origem), 50)
    recebido = contar_por_status(linha for lote in lotes for linha in lote)
    assert recebido == esperado, f"Os status de data/tickets.csv deveriam ser {esperado}, mas vieram {recebido!r}."
