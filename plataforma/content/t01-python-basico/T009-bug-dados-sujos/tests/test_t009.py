import csv

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


def linha(id_="1", categoria="cobranca", prioridade="media", assunto="Boleto não foi gerado", cliente="Padaria Pão Quente"):
    return {
        "id": id_,
        "cliente": cliente,
        "categoria": categoria,
        "prioridade": prioridade,
        "status": "aberto",
        "canal": "email",
        "aberto_em": "2026-11-03T08:12",
        "fechado_em": "",
        "assunto": assunto,
    }


def escrever_csv(pasta, linhas):
    caminho = pasta / "tickets_sujos.csv"
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        escritor.writerows(linhas)
    return str(caminho)


def carregar(carregar_tickets_limpos, pasta, linhas):
    resultado = carregar_tickets_limpos(escrever_csv(pasta, linhas))
    assert isinstance(resultado, tuple) and len(resultado) == 2, (
        f"A função deveria devolver uma tupla (validos, quantidade_descartada), mas devolveu {resultado!r}."
    )
    return resultado


def test_limpos_linhas_validas(tmp_path):
    from suporte.limpeza import carregar_tickets_limpos

    linhas = [linha("1"), linha("2", categoria="tecnico", prioridade="urgente")]
    validos, descartados = carregar(carregar_tickets_limpos, tmp_path, linhas)
    assert descartados == 0, f"Nenhuma linha tinha problema, mas a função descartou {descartados!r}."
    assert len(validos) == 2, f"Esperava 2 tickets válidos, mas vieram {len(validos)}."
    esperado = linha("1")
    esperado["id"] = 1
    assert validos[0] == esperado, f"O primeiro ticket deveria ser {esperado}, mas veio {validos[0]}."
    assert type(validos[1]["id"]) is int and validos[1]["id"] == 2, (
        f"O id do segundo ticket deveria ser o inteiro 2, mas veio {validos[1]['id']!r}."
    )


def test_limpos_normaliza_campos(tmp_path):
    from suporte.limpeza import carregar_tickets_limpos

    validos, descartados = carregar(
        carregar_tickets_limpos,
        tmp_path,
        [
            linha("1", prioridade=" ALTA "),
            linha("2", categoria="  Tecnico "),
            linha("3", assunto="   pedido    ATRASADO   "),
        ],
    )
    assert descartados == 0, (
        f"Essas linhas só precisavam de limpeza, nenhuma deveria ser descartada (recebi {descartados!r})."
    )
    assert len(validos) == 3, f"Esperava 3 tickets válidos, mas vieram {len(validos)}."
    assert validos[0]["prioridade"] == "alta", (
        f"A prioridade ' ALTA ' deveria virar 'alta', mas virou {validos[0]['prioridade']!r}."
    )
    assert validos[1]["categoria"] == "tecnico", (
        f"A categoria '  Tecnico ' deveria virar 'tecnico', mas virou {validos[1]['categoria']!r}."
    )
    assert validos[2]["assunto"] == "Pedido atrasado", (
        f"O assunto '   pedido    ATRASADO   ' deveria virar 'Pedido atrasado', mas virou {validos[2]['assunto']!r}."
    )


def test_limpos_descarta_id_invalido(tmp_path):
    from suporte.limpeza import carregar_tickets_limpos

    validos, descartados = carregar(carregar_tickets_limpos, tmp_path, [linha("abc"), linha("5"), linha("")])
    ids = [t["id"] for t in validos]
    assert ids == [5], f"Só o ticket de id 5 é válido, mas os válidos vieram com ids {ids}."
    assert descartados == 2, f"Os ids 'abc' e '' deveriam ser descartados (2), mas a contagem foi {descartados!r}."


def test_limpos_descarta_categoria_e_prioridade(tmp_path):
    from suporte.limpeza import carregar_tickets_limpos

    validos, descartados = carregar(
        carregar_tickets_limpos,
        tmp_path,
        [
            linha("1", categoria=""),
            linha("2", categoria="   "),
            linha("3", prioridade="altíssima"),
            linha("4", prioridade=""),
            linha("5", categoria="", prioridade="altíssima"),
            linha("6"),
        ],
    )
    ids = [t["id"] for t in validos]
    assert ids == [6], f"Só o ticket 6 é válido, mas os válidos vieram com ids {ids}."
    assert descartados == 5, (
        f"5 linhas tinham problema (a linha 5 tem dois, mas conta uma vez só); a contagem foi {descartados!r}."
    )


def test_limpos_arquivo_misturado(tmp_path):
    from suporte.limpeza import carregar_tickets_limpos

    linhas = [linha(str(i)) for i in range(1, 11)]
    linhas[1]["id"] = "abc"
    linhas[2]["categoria"] = ""
    linhas[3]["prioridade"] = "altíssima"
    linhas[4]["assunto"] = "   pedido    ATRASADO   "
    linhas[5]["id"] = ""
    linhas[6]["prioridade"] = " ALTA "
    linhas[7]["categoria"] = "  Tecnico "

    validos, descartados = carregar(carregar_tickets_limpos, tmp_path, linhas)
    ids = [t["id"] for t in validos]
    assert ids == [1, 5, 7, 8, 9, 10], f"Os ids válidos deveriam ser [1, 5, 7, 8, 9, 10], mas vieram {ids}."
    assert descartados == 4, f"Deveriam ser 4 linhas descartadas, mas a contagem foi {descartados!r}."
    assert validos[0]["cliente"] == "Padaria Pão Quente", (
        f"O nome do cliente veio {validos[0]['cliente']!r} — o arquivo foi lido com encoding=\"utf-8\"?"
    )
