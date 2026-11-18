import csv
import json
import os
import subprocess
import sys
from pathlib import Path

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


def linha(id_, categoria="tecnico", prioridade="media", status="aberto"):
    return {
        "id": id_,
        "cliente": "Padaria Pão Quente",
        "categoria": categoria,
        "prioridade": prioridade,
        "status": status,
        "canal": "email",
        "aberto_em": "2026-11-03T08:00",
        "fechado_em": "2026-11-03T10:00" if status == "fechado" else "",
        "assunto": "Erro 500 ao salvar relatório",
    }


def escrever_csv(pasta, linhas):
    caminho = pasta / "tickets.csv"
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        escritor.writerows(linhas)
    return str(caminho)


def csv_exemplo(pasta):
    """O exemplo do ticket: 4 linhas, 1 com id inválido; das 3 válidas, 1 está fechada."""
    return escrever_csv(
        pasta,
        [
            linha("1", "tecnico", "alta", "aberto"),
            linha("abc", "conta", "baixa", "aberto"),
            linha("2", "cobranca", "baixa", "fechado"),
            linha("3", "tecnico", "urgente", "em_andamento"),
        ],
    )


def test_cli_gera_arquivo_json(tmp_path):
    from suporte.__main__ import main

    saida = tmp_path / "saida.json"
    codigo = main(["relatorio", csv_exemplo(tmp_path), "--saida", str(saida)])
    assert codigo == 0, f"main deveria devolver 0 quando dá tudo certo, mas devolveu {codigo!r}."
    assert saida.exists(), "O arquivo indicado em --saida não foi criado."
    relatorio = json.loads(saida.read_text(encoding="utf-8"))
    esperado = {
        "total": 3,
        "abertos": 2,
        "por_categoria": {"tecnico": 2, "cobranca": 1},
        "por_prioridade": {"alta": 1, "baixa": 1, "urgente": 1},
        "taxa_resolucao": 33.3,
    }
    assert relatorio == esperado, f"O JSON gerado deveria ser {esperado}, mas foi {relatorio!r}."


def test_cli_resumo_impresso(tmp_path, capsys):
    from suporte.__main__ import main

    saida = str(tmp_path / "saida.json")
    main(["relatorio", csv_exemplo(tmp_path), "--saida", saida])
    impresso = capsys.readouterr().out.strip().splitlines()
    esperado = [
        f"Relatório salvo em {saida}",
        "Total de tickets: 3",
        "Abertos: 2",
        "Taxa de resolução: 33.3%",
        "Linhas descartadas: 1",
    ]
    assert impresso == esperado, (
        "O resumo impresso não está igual ao pedido.\nEsperado:\n" + "\n".join(esperado)
        + "\nRecebido:\n" + "\n".join(impresso)
    )


def test_cli_limpa_dados_sujos(tmp_path, capsys):
    from suporte.__main__ import main

    caminho = escrever_csv(
        tmp_path,
        [
            linha("1", " TECNICO ", " ALTA ", "fechado"),
            linha("", "conta", "baixa"),
            linha("2", "", "baixa"),
            linha("3", "entrega", "altíssima"),
            linha("4", "  Entrega", "media", "aberto"),
        ],
    )
    saida = tmp_path / "saida.json"
    codigo = main(["relatorio", caminho, "--saida", str(saida)])
    assert codigo == 0, f"main deveria devolver 0, mas devolveu {codigo!r}."
    assert saida.exists(), "O arquivo indicado em --saida não foi criado."
    relatorio = json.loads(saida.read_text(encoding="utf-8"))
    assert relatorio.get("total") == 2, (
        f"Só 2 linhas são válidas depois da limpeza, mas o relatório tem total {relatorio.get('total')!r}."
    )
    assert relatorio.get("por_categoria") == {"tecnico": 1, "entrega": 1}, (
        "As categorias deveriam estar limpas ({'tecnico': 1, 'entrega': 1}), "
        f"mas vieram {relatorio.get('por_categoria')!r}."
    )
    impresso = capsys.readouterr().out
    assert "Linhas descartadas: 3" in impresso, (
        f"O resumo deveria informar 'Linhas descartadas: 3'. Saída recebida:\n{impresso}"
    )


def test_cli_arquivo_inexistente(tmp_path, capsys):
    from suporte.__main__ import main

    inexistente = str(tmp_path / "nao_existe.csv")
    saida = tmp_path / "saida.json"
    codigo = main(["relatorio", inexistente, "--saida", str(saida)])
    capturado = capsys.readouterr()
    assert codigo == 1, f"Com um CSV inexistente main deveria devolver 1, mas devolveu {codigo!r}."
    esperado = f"Erro: arquivo não encontrado: {inexistente}"
    assert esperado in capturado.err, (
        f"Esperava a mensagem {esperado!r} no stderr, mas o stderr foi {capturado.err!r}."
    )
    assert capturado.out.strip() == "", f"Nada deveria ser impresso no stdout, mas saiu {capturado.out!r}."
    assert not saida.exists(), "O arquivo de saída não deveria ser criado quando o CSV não existe."


def test_cli_python_m_com_dados_reais(tmp_path):
    origem = Path("data") / "tickets.csv"
    assert origem.exists(), "Não encontrei data/tickets.csv na pasta do projeto."
    with open(origem, encoding="utf-8", newline="") as arquivo:
        linhas = list(csv.DictReader(arquivo))
    total = len(linhas)
    abertos = sum(1 for t in linhas if t["status"] != "fechado")
    taxa = round((total - abertos) / total * 100, 1)

    saida = tmp_path / "relatorio.json"
    ambiente = dict(os.environ, PYTHONIOENCODING="utf-8")
    processo = subprocess.run(
        [sys.executable, "-m", "suporte", "relatorio", str(origem), "--saida", str(saida)],
        check=False,
        capture_output=True,
        env=ambiente,
        timeout=30,
    )
    stdout = processo.stdout.decode("utf-8", errors="replace")
    stderr = processo.stderr.decode("utf-8", errors="replace")
    assert processo.returncode == 0, (
        f"`python -m suporte relatorio data/tickets.csv --saida ...` terminou com código {processo.returncode}.\n"
        f"stderr:\n{stderr[-1500:]}"
    )
    assert saida.exists(), f"O comando não criou o arquivo de saída. stdout:\n{stdout}"
    relatorio = json.loads(saida.read_text(encoding="utf-8"))
    for chave, valor in [("total", total), ("abertos", abertos), ("taxa_resolucao", taxa)]:
        assert relatorio.get(chave) == valor, (
            f"Com data/tickets.csv, \"{chave}\" deveria ser {valor}, mas o JSON tem {relatorio.get(chave)!r}."
        )
    assert f"Total de tickets: {total}" in stdout, (
        f"O resumo deveria conter 'Total de tickets: {total}'. stdout recebido:\n{stdout}"
    )
