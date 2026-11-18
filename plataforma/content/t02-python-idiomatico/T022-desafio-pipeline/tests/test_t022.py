import asyncio
import csv
from collections import Counter
from pathlib import Path

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


def linha(id_, cliente, prioridade="media"):
    return {
        "id": id_,
        "cliente": cliente,
        "categoria": "tecnico",
        "prioridade": prioridade,
        "status": "aberto",
        "canal": "chat",
        "aberto_em": "2026-11-03T08:00",
        "fechado_em": "",
        "assunto": "Integração com a API está lenta",
    }


def escrever_csv(pasta, linhas):
    caminho = pasta / "tickets.csv"
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        escritor.writerows(linhas)
    return caminho


def csv_exemplo(pasta):
    """O exemplo do ticket: 6 linhas, a 2ª com id inválido e a 5ª com prioridade inválida."""
    return escrever_csv(
        pasta,
        [
            linha("1", "Padaria Pão Quente", "alta"),
            linha("abc", "Hotel Recanto Azul", "baixa"),
            linha("3", "Loja Bella Moda", "urgente"),
            linha("4", "Padaria Pão Quente", "alta"),
            linha("5", "Studio Foto Arte", "altíssima"),
            linha("6", "TechNova Sistemas", "baixa"),
        ],
    )


class CrmFalso:
    """API de mentira. `falhas` = {cliente: [exceções a levantar, em ordem]}; depois delas, responde."""

    def __init__(self, falhas=None, espera=0.01, sempre_falha=None):
        self.falhas = {nome: list(erros) for nome, erros in (falhas or {}).items()}
        self.sempre_falha = sempre_falha or {}
        self.espera = espera
        self.chamadas = Counter()
        self.em_andamento = 0
        self.max_em_andamento = 0

    async def __call__(self, nome):
        self.chamadas[nome] += 1
        self.em_andamento += 1
        self.max_em_andamento = max(self.max_em_andamento, self.em_andamento)
        try:
            await asyncio.sleep(self.espera)
        finally:
            self.em_andamento -= 1
        if nome in self.sempre_falha:
            raise self.sempre_falha[nome]("falhou de novo")
        if self.falhas.get(nome):
            raise self.falhas[nome].pop(0)
        return {"cliente": nome, "plano": "pro"}


def processar_sync(caminho, crm, **kwargs):
    from suporte.pipeline import Resumo, processar

    resumo = asyncio.run(processar(caminho, crm, **kwargs))
    assert isinstance(resumo, Resumo), f"processar deveria devolver um Resumo, mas devolveu {resumo!r}."
    return resumo


def test_resumo_e_modelo_pydantic():
    from pydantic import BaseModel

    from suporte.pipeline import Resumo

    assert issubclass(Resumo, BaseModel), "Resumo deveria herdar de pydantic.BaseModel."
    esperado = {
        "total_validos": int,
        "total_descartados": int,
        "por_prioridade": dict[str, int],
        "clientes_enriquecidos": int,
        "erros": list[str],
    }
    recebido = {nome: campo.annotation for nome, campo in Resumo.model_fields.items()}
    assert recebido == esperado, f"Os campos do Resumo deveriam ser {esperado}, mas são {recebido}."


def test_processar_csv_pequeno(tmp_path):
    resumo = processar_sync(csv_exemplo(tmp_path), CrmFalso())
    assert (resumo.total_validos, resumo.total_descartados) == (4, 2), (
        f"Esperava 4 válidos e 2 descartados, mas veio {resumo.total_validos} e {resumo.total_descartados}."
    )
    esperado = {"baixa": 1, "media": 0, "alta": 2, "urgente": 1}
    assert resumo.por_prioridade == esperado, f"por_prioridade deveria ser {esperado}, mas veio {resumo.por_prioridade}."
    assert list(resumo.por_prioridade) == ["baixa", "media", "alta", "urgente"], (
        f"As chaves de por_prioridade deveriam vir na ordem baixa, media, alta, urgente: {list(resumo.por_prioridade)}."
    )
    assert resumo.clientes_enriquecidos == 3, (
        f"Os tickets válidos têm 3 clientes distintos, mas clientes_enriquecidos é {resumo.clientes_enriquecidos}."
    )
    assert len(resumo.erros) == 2 and resumo.erros[0].startswith("linha 2:") and resumo.erros[1].startswith("linha 5:"), (
        f"erros deveria ter as mensagens de validação das linhas 2 e 5, mas veio {resumo.erros}."
    )


def test_processar_consulta_cada_cliente_uma_vez(tmp_path):
    crm = CrmFalso()
    processar_sync(csv_exemplo(tmp_path), crm)
    esperado = {"Padaria Pão Quente": 1, "Loja Bella Moda": 1, "TechNova Sistemas": 1}
    assert dict(crm.chamadas) == esperado, (
        f"Cada cliente distinto dos tickets VÁLIDOS deveria ser consultado uma vez: esperava {esperado}, "
        f"mas as consultas foram {dict(crm.chamadas)}."
    )


def test_processar_falhas_de_clientes(tmp_path):
    from suporte.resiliencia import ErroTemporario

    caminho = escrever_csv(
        tmp_path,
        [
            linha("1", "Padaria Pão Quente"),
            linha("2", "Loja Bella Moda"),
            linha("3", "TechNova Sistemas"),
            linha("4", "Ótica Visão Clara"),
            linha("5", "Loja Bella Moda"),
        ],
    )
    crm = CrmFalso(
        falhas={"Padaria Pão Quente": [ConnectionError("caiu"), ErroTemporario("instável")]},
        sempre_falha={"Loja Bella Moda": ConnectionError, "TechNova Sistemas": ValueError},
    )
    resumo = processar_sync(caminho, crm)
    assert resumo.clientes_enriquecidos == 2, (
        "Padaria (deu certo na 3ª tentativa) e Ótica deveriam contar como enriquecidos (2), "
        f"mas clientes_enriquecidos é {resumo.clientes_enriquecidos}."
    )
    esperado = ["cliente Loja Bella Moda: ConnectionError", "cliente TechNova Sistemas: ValueError"]
    assert resumo.erros == esperado, f"erros deveria ser {esperado}, mas veio {resumo.erros}."
    assert crm.chamadas["Padaria Pão Quente"] == 3 and crm.chamadas["Loja Bella Moda"] == 3, (
        f"Falhas temporárias deveriam ser repetidas até 3 vezes (com_retry), mas as chamadas foram {dict(crm.chamadas)}."
    )
    assert crm.chamadas["TechNova Sistemas"] == 1, (
        f"ValueError não é temporário e não deveria ser repetido, mas as chamadas foram {dict(crm.chamadas)}."
    )


def test_processar_respeita_limite(tmp_path):
    clientes = ["Padaria Pão Quente", "Loja Bella Moda", "TechNova Sistemas", "Ótica Visão Clara", "Hotel Recanto Azul",
                "Studio Foto Arte"]
    caminho = escrever_csv(tmp_path, [linha(str(i), nome) for i, nome in enumerate(clientes, start=1)])
    crm = CrmFalso(espera=0.1)
    resumo = processar_sync(caminho, crm, limite=2)
    assert resumo.clientes_enriquecidos == 6, f"Os 6 clientes deveriam ser enriquecidos, mas foram {resumo.clientes_enriquecidos}."
    assert crm.max_em_andamento <= 2, (
        f"Com limite=2, chegaram a rodar {crm.max_em_andamento} consultas ao mesmo tempo."
    )
    assert crm.max_em_andamento == 2, (
        f"Com limite=2, as consultas deveriam rodar 2 de cada vez, mas no máximo {crm.max_em_andamento} rodou."
    )


def test_processar_dados_sujos():
    from suporte.limpeza import carregar_tickets_limpos

    origem = Path("data") / "tickets_sujos.csv"
    assert origem.exists(), "Não encontrei data/tickets_sujos.csv na pasta do projeto."
    crm = CrmFalso(espera=0.005)
    resumo = processar_sync(origem, crm)
    validos, descartados = carregar_tickets_limpos(str(origem))
    assert (resumo.total_validos, resumo.total_descartados) == (36, 4), (
        f"Esperava 36 válidos e 4 descartados, mas veio {resumo.total_validos} e {resumo.total_descartados}."
    )
    contagem = Counter(t["prioridade"] for t in validos)
    esperado = {p: contagem.get(p, 0) for p in ["baixa", "media", "alta", "urgente"]}
    assert resumo.por_prioridade == esperado, f"por_prioridade deveria ser {esperado}, mas veio {resumo.por_prioridade}."
    distintos = {t["cliente"] for t in validos}
    assert resumo.clientes_enriquecidos == len(distintos), (
        f"Os válidos têm {len(distintos)} clientes distintos, mas clientes_enriquecidos é {resumo.clientes_enriquecidos}."
    )
    assert set(crm.chamadas) == distintos and max(crm.chamadas.values()) == 1, (
        "Cada cliente distinto deveria ser consultado exatamente uma vez."
    )
    assert len(resumo.erros) == 4 and all(e.startswith("linha ") for e in resumo.erros), (
        f"Deveria haver 4 erros de validação, mas vieram {resumo.erros}."
    )
