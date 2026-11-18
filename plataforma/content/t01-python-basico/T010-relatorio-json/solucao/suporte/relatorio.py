import json

from suporte.contagens import contar_por_categoria
from suporte.filtros import contar_abertos
from suporte.metricas import calcular_taxa_resolucao


def contar_por_prioridade(tickets):
    """Devolve um dicionário {prioridade: quantidade de tickets}."""
    contagem = {}
    for ticket in tickets:
        prioridade = ticket["prioridade"]
        contagem[prioridade] = contagem.get(prioridade, 0) + 1
    return contagem


def gerar_relatorio(tickets):
    """Devolve o resumo dos tickets em um dicionário."""
    total = len(tickets)
    abertos = contar_abertos(tickets)
    fechados = total - abertos
    return {
        "total": total,
        "abertos": abertos,
        "por_categoria": contar_por_categoria(tickets),
        "por_prioridade": contar_por_prioridade(tickets),
        "taxa_resolucao": calcular_taxa_resolucao(total, fechados),
    }


def salvar_relatorio(relatorio, caminho):
    """Grava `relatorio` em `caminho` como JSON."""
    with open(caminho, "w", encoding="utf-8") as arquivo:
        json.dump(relatorio, arquivo, ensure_ascii=False, indent=2)
