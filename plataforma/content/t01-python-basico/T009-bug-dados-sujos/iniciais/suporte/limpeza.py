# T009 — Bug: o relatório quebra com o arquivo de dados sujos
# Dica: você vai precisar de `import csv` e pode reaproveitar
# `from suporte.texto import normalizar_assunto`.

PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"]


def carregar_tickets_limpos(caminho):
    """Lê o CSV, limpa o que dá e descarta as linhas sem salvação.

    Limpeza: id -> int; categoria e prioridade sem espaços nas pontas e minúsculas;
             assunto normalizado (como normalizar_assunto do T004).
    Descarta a linha se: o id não é inteiro, a categoria fica vazia
             ou a prioridade não está em PRIORIDADES_VALIDAS.

    Devolve a tupla (validos, quantidade_descartada).
    Exemplo: carregar_tickets_limpos("data/tickets_sujos.csv") -> (lista com 36 tickets, 4)
    """
    pass
