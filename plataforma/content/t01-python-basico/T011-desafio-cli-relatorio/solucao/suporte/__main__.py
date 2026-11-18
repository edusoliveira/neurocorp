import argparse
import sys

from suporte.limpeza import carregar_tickets_limpos
from suporte.relatorio import gerar_relatorio, salvar_relatorio


def criar_parser():
    parser = argparse.ArgumentParser(prog="python -m suporte", description="Ferramentas do Suporte Inteligente.")
    subcomandos = parser.add_subparsers(dest="comando", required=True)
    relatorio = subcomandos.add_parser("relatorio", help="Gera o relatório diário em JSON.")
    relatorio.add_argument("csv", help="caminho do arquivo CSV de tickets")
    relatorio.add_argument("--saida", required=True, help="caminho do arquivo JSON a ser gravado")
    return parser


def main(argv=None):
    """Executa a linha de comando e devolve o código de saída (0 = sucesso, 1 = erro)."""
    argumentos = criar_parser().parse_args(argv)

    try:
        tickets, descartados = carregar_tickets_limpos(argumentos.csv)
    except FileNotFoundError:
        print(f"Erro: arquivo não encontrado: {argumentos.csv}", file=sys.stderr)
        return 1

    relatorio = gerar_relatorio(tickets)
    salvar_relatorio(relatorio, argumentos.saida)

    print(f"Relatório salvo em {argumentos.saida}")
    print(f"Total de tickets: {relatorio['total']}")
    print(f"Abertos: {relatorio['abertos']}")
    print(f"Taxa de resolução: {relatorio['taxa_resolucao']}%")
    print(f"Linhas descartadas: {descartados}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
