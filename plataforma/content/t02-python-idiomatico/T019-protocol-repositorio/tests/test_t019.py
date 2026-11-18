import csv
import dataclasses
import typing

COLUNAS = ["id", "cliente", "categoria", "prioridade", "status", "canal", "aberto_em", "fechado_em", "assunto"]


def linha(id_, prioridade="media", status="aberto", aberto_em="2026-11-03T08:00", cliente="Padaria Pão Quente"):
    return {
        "id": str(id_),
        "cliente": cliente,
        "categoria": "tecnico",
        "prioridade": prioridade,
        "status": status,
        "canal": "email",
        "aberto_em": aberto_em,
        "fechado_em": "2026-11-03T18:45" if status == "fechado" else "",
        "assunto": "Sistema parado, não funciona nada",
    }


def ticket(id_, **kwargs):
    from suporte.modelos import Ticket

    return Ticket.de_linha(linha(id_, **kwargs))


def escrever_csv(caminho, linhas):
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        escritor.writerows(linhas)
    return caminho


def ids(tickets):
    assert isinstance(tickets, list), f"Esperava uma lista de tickets, mas veio {tickets!r}."
    return [t.id for t in tickets]


def test_protocolo_repositorio():
    from suporte.repositorio import RepositorioTickets

    assert typing.is_protocol(RepositorioTickets), "`RepositorioTickets` deveria herdar de typing.Protocol."
    membros = typing.get_protocol_members(RepositorioTickets)
    assert membros == {"listar", "buscar", "salvar"}, (
        f"O protocolo deveria ter exatamente os métodos listar, buscar e salvar, mas tem {sorted(membros)}."
    )


def test_memoria_listar_e_buscar():
    from suporte.repositorio import RepositorioEmMemoria

    repo = RepositorioEmMemoria([ticket(3), ticket(1), ticket(2)])
    assert ids(repo.listar()) == [3, 1, 2], f"listar() deveria devolver os ids [3, 1, 2], mas veio {repo.listar()!r}."
    encontrado = repo.buscar(1)
    assert encontrado is not None and encontrado.id == 1, f"buscar(1) deveria achar o ticket 1, mas veio {encontrado!r}."
    assert repo.buscar(99) is None, f"buscar(99) deveria devolver None, mas veio {repo.buscar(99)!r}."
    lista = repo.listar()
    lista.clear()
    assert len(repo.listar()) == 3, "listar() deveria devolver uma lista nova: limpar a lista devolvida apagou os tickets."
    vazio = RepositorioEmMemoria()
    assert vazio.listar() == [], f"RepositorioEmMemoria() deveria começar vazio, mas listou {vazio.listar()!r}."


def test_memoria_salvar_insere_e_atualiza():
    from suporte.modelos import Status
    from suporte.repositorio import RepositorioEmMemoria

    repo = RepositorioEmMemoria([ticket(1), ticket(2)])
    repo.salvar(ticket(3))
    assert ids(repo.listar()) == [1, 2, 3], f"Depois de salvar o ticket 3, os ids deveriam ser [1, 2, 3]: {repo.listar()!r}."
    fechado = dataclasses.replace(repo.buscar(1), status=Status.FECHADO)
    repo.salvar(fechado)
    assert ids(repo.listar()) == [1, 2, 3], (
        f"Salvar um ticket que já existe deveria substituí-lo na mesma posição, mas os ids ficaram {ids(repo.listar())}."
    )
    assert repo.buscar(1).status is Status.FECHADO, "Depois de salvar, buscar(1) deveria trazer o ticket atualizado."


def test_csv_listar_e_buscar(tmp_path):
    from suporte.modelos import Prioridade, Ticket
    from suporte.repositorio import RepositorioCsv

    caminho = escrever_csv(tmp_path / "tickets.csv", [linha(1), linha(2, prioridade="urgente"), linha(3, status="fechado")])
    repo = RepositorioCsv(caminho)
    tickets = repo.listar()
    assert ids(tickets) == [1, 2, 3], f"listar() deveria ler os ids [1, 2, 3] do arquivo, mas veio {tickets!r}."
    assert all(isinstance(t, Ticket) for t in tickets), "listar() deveria devolver objetos Ticket (use Ticket.de_linha)."
    assert tickets[1].prioridade is Prioridade.URGENTE, f"O ticket 2 deveria ser URGENTE, mas veio {tickets[1]!r}."
    assert tickets[0].cliente == "Padaria Pão Quente", f"Acentos estragados: {tickets[0].cliente!r} (use UTF-8)."
    assert repo.buscar(3) is not None and repo.buscar(3).id == 3, "buscar(3) deveria achar o ticket 3."
    assert repo.buscar(42) is None, "buscar(42) deveria devolver None."
    assert RepositorioCsv(str(caminho)).listar() == tickets, "RepositorioCsv deveria aceitar o caminho como texto também."


def test_csv_salvar_persiste(tmp_path):
    from suporte.modelos import Status
    from suporte.repositorio import RepositorioCsv

    caminho = escrever_csv(tmp_path / "tickets.csv", [linha(1), linha(2, aberto_em="2026-11-04T09:30")])
    repo = RepositorioCsv(caminho)
    repo.salvar(dataclasses.replace(repo.buscar(1), status=Status.FECHADO))
    repo.salvar(ticket(7, prioridade="urgente", cliente="Ótica Visão Clara"))

    outro = RepositorioCsv(caminho).listar()
    assert ids(outro) == [1, 2, 7], (
        f"Outra instância lendo o mesmo arquivo deveria ver os ids [1, 2, 7], mas viu {ids(outro)}."
    )
    assert outro[0].status is Status.FECHADO, "A atualização do ticket 1 não foi gravada no arquivo."
    assert outro[1] == ticket(2, aberto_em="2026-11-04T09:30"), (
        f"O ticket 2 não deveria mudar ao ser regravado, mas ficou {outro[1]!r}."
    )
    assert outro[2].cliente == "Ótica Visão Clara", f"O ticket novo voltou com cliente {outro[2].cliente!r}."
    with open(caminho, encoding="utf-8", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)
        linhas = list(leitor)
    assert leitor.fieldnames == COLUNAS, f"O arquivo regravado deveria ter o cabeçalho {COLUNAS}, mas tem {leitor.fieldnames}."
    assert linhas[0]["status"] == "fechado" and linhas[1]["fechado_em"] == "", (
        f"Os valores deveriam ser gravados como texto ('fechado', fechado_em vazio), mas o arquivo tem {linhas[:2]}."
    )
    assert linhas[0]["aberto_em"] == "2026-11-03T08:00", (
        f"As datas deveriam ser gravadas como '2026-11-03T08:00', mas o arquivo tem {linhas[0]['aberto_em']!r}."
    )


def test_csv_arquivo_inexistente(tmp_path):
    from suporte.repositorio import RepositorioCsv

    caminho = tmp_path / "novo.csv"
    repo = RepositorioCsv(caminho)
    assert repo.listar() == [], f"Com o arquivo inexistente, listar() deveria devolver [], mas veio {repo.listar()!r}."
    assert repo.buscar(1) is None, "Com o arquivo inexistente, buscar(1) deveria devolver None."
    repo.salvar(ticket(5))
    assert caminho.exists(), "salvar() deveria criar o arquivo quando ele não existe."
    assert ids(RepositorioCsv(caminho).listar()) == [5], "O ticket salvo no arquivo novo não foi encontrado."


class RepositorioDeMentira:
    """Não herda de nada: só tem os três métodos (tipagem estrutural)."""

    def __init__(self, tickets):
        self.tickets = tickets
        self.chamadas = []

    def listar(self):
        self.chamadas.append("listar")
        return list(self.tickets)

    def buscar(self, id_ticket):
        self.chamadas.append("buscar")
        return next((t for t in self.tickets if t.id == id_ticket), None)

    def salvar(self, ticket):
        raise AssertionError("tickets_urgentes_abertos não deveria salvar nada.")


def test_urgentes_com_qualquer_repositorio():
    from suporte.repositorio import RepositorioEmMemoria, tickets_urgentes_abertos

    tickets = [
        ticket(1, prioridade="urgente", aberto_em="2026-11-05T10:00"),
        ticket(2, prioridade="alta"),
        ticket(3, prioridade="urgente", status="fechado"),
        ticket(4, prioridade="urgente", status="em_andamento", aberto_em="2026-11-03T07:00"),
        ticket(5, prioridade="urgente", aberto_em="2026-11-04T12:00"),
    ]
    falso = RepositorioDeMentira(tickets)
    resultado = tickets_urgentes_abertos(falso)
    assert ids(resultado) == [4, 5, 1], (
        f"Os urgentes abertos, do mais antigo para o mais novo, deveriam ser [4, 5, 1], mas vieram {ids(resultado)}."
    )
    assert "listar" in falso.chamadas, "A função deveria pegar os tickets chamando repo.listar()."
    memoria = tickets_urgentes_abertos(RepositorioEmMemoria(tickets))
    assert ids(memoria) == [4, 5, 1], f"Com o RepositorioEmMemoria o resultado deveria ser [4, 5, 1], mas veio {memoria!r}."
