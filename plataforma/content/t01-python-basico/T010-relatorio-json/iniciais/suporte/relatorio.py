# T010 — Relatório diário em JSON
# Dica: importe o módulo json e as funções que você já escreveu, por exemplo:
#   from suporte.metricas import calcular_taxa_resolucao
#   from suporte.filtros import contar_abertos
#   from suporte.contagens import contar_por_categoria


def gerar_relatorio(tickets):
    """Devolve um dicionário com as chaves:

    "total", "abertos", "por_categoria", "por_prioridade" e "taxa_resolucao".
    taxa_resolucao = porcentagem de tickets fechados (1 casa decimal).
    """
    pass


def salvar_relatorio(relatorio, caminho):
    """Grava `relatorio` em `caminho` como JSON (utf-8, ensure_ascii=False, indent=2)."""
    pass
