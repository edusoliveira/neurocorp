# T011 — Desafio de promoção: o relatório na linha de comando
# Uso: python -m suporte relatorio <caminho_do_csv> --saida <caminho_do_json>


def main(argv=None):
    """Executa a linha de comando e devolve o código de saída (0 = sucesso, 1 = erro).

    - lê os argumentos com argparse (parse_args(argv));
    - carrega o CSV com carregar_tickets_limpos, gera e salva o relatório;
    - imprime o resumo de 5 linhas pedido no ticket;
    - se o CSV não existir: mensagem no stderr e devolve 1.
    """
    pass


if __name__ == "__main__":
    raise SystemExit(main())
