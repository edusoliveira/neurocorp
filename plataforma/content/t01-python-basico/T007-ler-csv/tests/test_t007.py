import csv

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]

LINHAS = [
    ["1", "Padaria Pão Quente", "cobranca", "alta", "aberto", "email", "2026-11-03T08:12", "", "Boleto não foi gerado"],
    ["2", "Loja Bella Moda", "tecnico", "urgente", "fechado", "chat", "2026-11-03T09:40", "2026-11-03T11:02",
     "Sistema parado, não funciona nada"],
    ["3", "Ótica Visão Clara", "conta", "baixa", "em_andamento", "telefone", "2026-11-03T10:05", "",
     "Esqueci minha senha"],
]


def escrever_csv(pasta, linhas):
    caminho = pasta / "tickets.csv"
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.writer(arquivo)
        escritor.writerow(COLUNAS)
        escritor.writerows(linhas)
    return str(caminho)


def test_carregar_todas_as_linhas(tmp_path):
    from suporte.leitura import carregar_tickets

    tickets = carregar_tickets(escrever_csv(tmp_path, LINHAS))
    assert isinstance(tickets, list), f"A função deveria devolver uma lista, mas devolveu {tickets!r}."
    assert len(tickets) == 3, f"O CSV tem 3 tickets, mas a função devolveu {len(tickets)}."
    assert all(isinstance(t, dict) for t in tickets), "Cada item da lista deveria ser um dicionário."
    assert set(tickets[0]) == set(COLUNAS), (
        f"Cada dicionário deveria ter as chaves {COLUNAS}, mas o primeiro tem {list(tickets[0])}."
    )
    assert tickets[1]["assunto"] == "Sistema parado, não funciona nada", (
        f"O assunto do 2º ticket veio errado: {tickets[1]['assunto']!r}."
    )
    assert tickets[0]["fechado_em"] == "", (
        f"`fechado_em` vazio deveria continuar \"\", mas veio {tickets[0]['fechado_em']!r}."
    )


def test_carregar_id_inteiro(tmp_path):
    from suporte.leitura import carregar_tickets

    tickets = carregar_tickets(escrever_csv(tmp_path, LINHAS))
    ids = [t["id"] for t in tickets] if tickets else None
    assert ids == [1, 2, 3] and all(type(i) is int for i in ids), (
        f"Os ids deveriam ser os inteiros [1, 2, 3], mas vieram {ids!r}."
    )
    assert tickets[0]["status"] == "aberto", (
        f"Os outros campos devem continuar texto: status veio {tickets[0]['status']!r}."
    )


def test_carregar_acentos_utf8(tmp_path):
    from suporte.leitura import carregar_tickets

    tickets = carregar_tickets(escrever_csv(tmp_path, LINHAS))
    clientes = [t["cliente"] for t in tickets] if tickets else None
    esperado = ["Padaria Pão Quente", "Loja Bella Moda", "Ótica Visão Clara"]
    assert clientes == esperado, (
        f"Os nomes dos clientes deveriam ser {esperado}, mas vieram {clientes!r}. "
        "Você abriu o arquivo com encoding=\"utf-8\"?"
    )


def test_carregar_so_cabecalho(tmp_path):
    from suporte.leitura import carregar_tickets

    tickets = carregar_tickets(escrever_csv(tmp_path, []))
    assert tickets == [], f"Um CSV só com o cabeçalho deveria virar [], mas a função devolveu {tickets!r}."
