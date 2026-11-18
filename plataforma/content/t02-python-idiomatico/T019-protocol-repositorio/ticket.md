## Contexto

> "Hoje cada função abre o CSV por conta própria. Quando os tickets forem para um banco de dados, vamos ter que caçar `open(...)` pelo código inteiro. Quero o **padrão repositório**: um objeto que sabe listar, buscar e salvar tickets, e regras de negócio que recebem *qualquer* repositório. Para os testes, um repositório em memória; para hoje, um em CSV; amanhã, um no banco." — Marina, Tech Lead de IA

Um **`Protocol`** (do módulo `typing`) descreve um **contrato**: os métodos que um objeto precisa ter. A diferença para uma classe base comum é que **ninguém precisa herdar dele** — qualquer classe que tenha os métodos certos já "cumpre" o protocolo. Isso se chama **tipagem estrutural** (ou *duck typing* com tipos: "se anda como pato e grasna como pato...").

```python
from typing import Protocol


class TemNome(Protocol):
    def nome(self) -> str: ...      # o "..." é literal: só a assinatura, sem corpo


class Cliente:                      # não herda de TemNome!
    def nome(self) -> str:
        return "Padaria Pão Quente"


def saudar(algo: TemNome) -> str:
    return f"Olá, {algo.nome()}"


saudar(Cliente())   # o verificador de tipos aceita: Cliente tem o método nome()
```

> 💡 **Vindo do C#:** o `Protocol` é uma **`interface`**, com uma diferença enorme: no C# a classe precisa declarar `class RepositorioCsv : IRepositorioTickets`; no Python, não — basta ter os métodos com as assinaturas certas (tipagem **estrutural**, como as interfaces do Go ou do TypeScript). Na prática, `tickets_urgentes_abertos(repo: RepositorioTickets)` é a mesma ideia de receber um `IRepositorioTickets` por injeção de dependência — sem container, é só passar o objeto.

## O que fazer

Crie o arquivo `suporte/repositorio.py`. Use o `Ticket` (com os enums) de `suporte.modelos`.

### 1. O contrato: `class RepositorioTickets(Protocol)`

```python
def listar(self) -> list[Ticket]: ...
def buscar(self, id_ticket: int) -> Ticket | None: ...
def salvar(self, ticket: Ticket) -> None: ...
```

Os corpos são só `...` — o protocolo não implementa nada.

### 2. `class RepositorioEmMemoria`

- `RepositorioEmMemoria(tickets)` recebe uma lista inicial de tickets (o parâmetro é opcional: `RepositorioEmMemoria()` começa vazio);
- `listar()` devolve uma **nova lista** com os tickets, na ordem em que foram inseridos;
- `buscar(id_ticket)` devolve o ticket com aquele `id`, ou `None`;
- `salvar(ticket)`: se já existe um ticket com o mesmo `id`, ele é **substituído** (na mesma posição); senão, é adicionado no fim.

> 💡 Um `dict[int, Ticket]` (id → ticket) resolve tudo: o dicionário mantém a ordem de inserção, e atribuir numa chave que já existe mantém a posição.

### 3. `class RepositorioCsv`

- `RepositorioCsv(caminho)` recebe o caminho do CSV (`str` ou `Path`), com as colunas de sempre;
- `listar()` lê o arquivo (UTF-8) e converte cada linha com `Ticket.de_linha`; se o arquivo **não existe**, devolve `[]`;
- `buscar(id_ticket)` devolve o ticket com aquele `id`, ou `None`;
- `salvar(ticket)` faz o mesmo que no repositório em memória (substitui ou adiciona no fim) e **regrava o arquivo inteiro** com `csv.DictWriter`, cabeçalho incluído. Se o arquivo não existia, ele é criado.

Para gravar, cada `Ticket` vira de novo uma linha de texto: `id` com `str(...)`, os enums pelo valor (`str(ticket.prioridade)` dá `"alta"`), as datas com `.isoformat(timespec="minutes")` (`"2026-11-03T08:00"`) e `fechado_em` `None` vira `""`. Vale criar uma função auxiliar para isso.

Os dados não ficam guardados no objeto: duas instâncias de `RepositorioCsv` com o mesmo caminho enxergam as mesmas mudanças, porque tudo passa pelo arquivo.

> 💡 O `Ticket` é imutável (`frozen=True`). Para "alterar" um ticket, crie uma cópia com um campo diferente: `dataclasses.replace(ticket, status=Status.FECHADO)`.

### 4. `tickets_urgentes_abertos(repo: RepositorioTickets) -> list[Ticket]`

Uma função (fora das classes) que usa **só** os métodos do protocolo e devolve os tickets com prioridade `URGENTE` que estão abertos (`esta_aberto`), do mais antigo para o mais novo (`aberto_em`).

Ela precisa funcionar com **qualquer** objeto que tenha os três métodos — os testes passam até uma classe que eles mesmos criaram, que não herda de nada.

## Como testar no seu computador

Crie um arquivo `testar_repositorio.py` na pasta `suporte-inteligente` com:

```python
import dataclasses
import shutil

from suporte.modelos import Status
from suporte.repositorio import RepositorioCsv, RepositorioEmMemoria, tickets_urgentes_abertos

shutil.copy("data/tickets.csv", "copia_tickets.csv")   # não mexa no arquivo original!
repo = RepositorioCsv("copia_tickets.csv")
urgentes = tickets_urgentes_abertos(repo)
print(len(urgentes), "urgentes abertos")

repo.salvar(dataclasses.replace(urgentes[0], status=Status.FECHADO))
print(len(tickets_urgentes_abertos(RepositorioCsv("copia_tickets.csv"))), "depois de fechar um")

memoria = RepositorioEmMemoria(repo.listar())
print(len(tickets_urgentes_abertos(memoria)), "no repositório em memória")
```

E rode no terminal:

```bash
python testar_repositorio.py
```
