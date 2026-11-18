import json


def criar_tickets():
    dados = [
        ("tecnico", "alta", "aberto"),
        ("cobranca", "baixa", "fechado"),
        ("tecnico", "alta", "em_andamento"),
        ("entrega", "urgente", "fechado"),
    ]
    return [
        {
            "id": i,
            "cliente": "Cliente Teste",
            "categoria": categoria,
            "prioridade": prioridade,
            "status": status,
            "canal": "email",
            "aberto_em": "2026-11-03T08:00",
            "fechado_em": "",
            "assunto": "Assunto qualquer",
        }
        for i, (categoria, prioridade, status) in enumerate(dados, start=1)
    ]


def gerar(gerar_relatorio, tickets):
    relatorio = gerar_relatorio(tickets)
    assert isinstance(relatorio, dict), f"gerar_relatorio deveria devolver um dicionário, mas devolveu {relatorio!r}."
    return relatorio


def test_relatorio_totais():
    from suporte.relatorio import gerar_relatorio

    relatorio = gerar(gerar_relatorio, criar_tickets())
    assert relatorio.get("total") == 4, f"\"total\" deveria ser 4, mas veio {relatorio.get('total')!r}."
    assert relatorio.get("abertos") == 2, (
        f"\"abertos\" deveria ser 2 (um 'aberto' e um 'em_andamento'), mas veio {relatorio.get('abertos')!r}."
    )


def test_relatorio_contagens():
    from suporte.relatorio import gerar_relatorio

    relatorio = gerar(gerar_relatorio, criar_tickets())
    esperado = {"tecnico": 2, "cobranca": 1, "entrega": 1}
    assert relatorio.get("por_categoria") == esperado, (
        f"\"por_categoria\" deveria ser {esperado}, mas veio {relatorio.get('por_categoria')!r}."
    )
    esperado = {"alta": 2, "baixa": 1, "urgente": 1}
    assert relatorio.get("por_prioridade") == esperado, (
        f"\"por_prioridade\" deveria ser {esperado}, mas veio {relatorio.get('por_prioridade')!r}."
    )


def test_relatorio_taxa_e_lista_vazia():
    from suporte.relatorio import gerar_relatorio

    relatorio = gerar(gerar_relatorio, criar_tickets())
    assert relatorio.get("taxa_resolucao") == 50.0, (
        f"\"taxa_resolucao\" deveria ser 50.0 (2 fechados de 4), mas veio {relatorio.get('taxa_resolucao')!r}."
    )
    assert set(relatorio) == {"total", "abertos", "por_categoria", "por_prioridade", "taxa_resolucao"}, (
        f"O relatório deveria ter exatamente as 5 chaves do ticket, mas tem {sorted(relatorio)}."
    )

    vazio = gerar(gerar_relatorio, [])
    esperado = {"total": 0, "abertos": 0, "por_categoria": {}, "por_prioridade": {}, "taxa_resolucao": 0.0}
    assert vazio == esperado, f"Com a lista vazia o relatório deveria ser {esperado}, mas veio {vazio!r}."


def test_salvar_relatorio_json(tmp_path):
    from suporte.relatorio import salvar_relatorio

    relatorio = {"total": 3, "abertos": 1, "por_categoria": {"conta": 3}, "taxa_resolucao": 66.7}
    caminho = tmp_path / "relatorio.json"
    salvar_relatorio(relatorio, str(caminho))
    assert caminho.exists(), "salvar_relatorio não criou o arquivo no caminho recebido."
    lido = json.loads(caminho.read_text(encoding="utf-8"))
    assert lido == relatorio, f"O JSON gravado deveria conter {relatorio}, mas contém {lido!r}."


def test_salvar_relatorio_formato(tmp_path):
    from suporte.relatorio import salvar_relatorio

    relatorio = {"cliente_destaque": "Padaria Pão Quente", "total": 2}
    caminho = tmp_path / "relatorio.json"
    salvar_relatorio(relatorio, str(caminho))
    assert caminho.exists(), "salvar_relatorio não criou o arquivo no caminho recebido."
    texto = caminho.read_text(encoding="utf-8", errors="replace")
    assert "Pão" in texto, (
        "Os acentos deveriam aparecer legíveis no arquivo (\"Pão\"). "
        f"O arquivo ficou assim: {texto!r}. Use ensure_ascii=False e encoding=\"utf-8\"."
    )
    esperado = json.dumps(relatorio, ensure_ascii=False, indent=2)
    assert texto.strip() == esperado, (
        f"O JSON deveria estar indentado com 2 espaços (indent=2). Esperado:\n{esperado}\nRecebido:\n{texto}"
    )
