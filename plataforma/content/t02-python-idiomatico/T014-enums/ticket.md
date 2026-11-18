## Contexto

> "No `Ticket`, `prioridade` e `status` ainda são `str` — então qualquer texto passa: `"Alta "`, `"fehcado"`, `"altíssima"`... E toda vez que alguém precisa ordenar a fila por urgência, reinventa a ordem `baixa < media < alta < urgente`. Quero esses valores fechados num lugar só, com a ordem de urgência junto." — Júlia, Coordenadora de Suporte

Um **Enum** é um conjunto fechado de valores com nome. O `StrEnum` (Python 3.11+) é um enum cujos membros **também são textos** — por isso continuam funcionando com CSV, JSON e comparações com `str`:

```python
from enum import StrEnum


class Canal(StrEnum):
    EMAIL = "email"
    CHAT = "chat"


Canal("chat")             # Canal.CHAT  — converte o texto no membro
Canal("chat") is Canal.CHAT   # True — cada membro existe uma vez só
Canal.CHAT == "chat"      # True — é um str!
Canal("fax")              # ValueError: 'fax' is not a valid Canal
[c.value for c in Canal]  # ['email', 'chat'] — dá para percorrer
```

Enums também podem ter métodos e properties, como qualquer classe.

> 💡 **Vindo do C#:** é o `enum` do C#, mas cada membro carrega um **valor texto** em vez de um `int` (pense num `enum` + `[EnumMember(Value = "alta")]` já embutido). `Prioridade("alta")` faz o papel do `Enum.Parse<Prioridade>("alta")` — e também lança exceção (`ValueError`) para valor inválido. A diferença boa: no Python você pode pendurar uma `@property` direto no enum, sem precisar de extension method.

## O que fazer

Edite o seu `suporte/modelos.py` (o do T013). O que já existe continua valendo.

### 1. Os enums

Crie, **antes** da classe `Ticket`:

```python
class Prioridade(StrEnum):   # BAIXA = "baixa", MEDIA = "media", ALTA = "alta", URGENTE = "urgente"
class Status(StrEnum):       # ABERTO = "aberto", EM_ANDAMENTO = "em_andamento", FECHADO = "fechado"
```

Os membros devem ser declarados **nesta ordem**.

### 2. `Prioridade.peso`

Uma `@property` que devolve um `int` com o peso de urgência: `baixa` = 1, `media` = 2, `alta` = 3, `urgente` = 4.

```python
Prioridade.ALTA.peso   # 3
```

### 3. O `Ticket` passa a usar os enums

- os campos ficam `prioridade: Prioridade` e `status: Status`;
- `de_linha` converte os textos: `Prioridade(linha["prioridade"])` e `Status(linha["status"])`. Um valor desconhecido (ex.: `"altíssima"`, `"pendente"`) gera `ValueError` — é exatamente o que o próprio enum já faz, não precisa de `try`;
- `esta_aberto` continua igual por fora (compare com `Status.FECHADO`);
- `horas_aberto` e o resto não mudam.

### 4. `ordenar_por_urgencia(tickets: list[Ticket]) -> list[Ticket]`

Uma função (fora da classe) que devolve uma **nova lista** ordenada:

1. da prioridade mais urgente para a menos urgente (maior `peso` primeiro);
2. em caso de empate, do ticket mais antigo (`aberto_em` menor) para o mais novo.

> 💡 `sorted` aceita uma `key` que devolve uma **tupla** — ele compara o primeiro item, e só no empate olha o segundo. Para inverter só o primeiro critério, use o peso negativo: `key=lambda t: (-t.prioridade.peso, t.aberto_em)`.

## Como testar no seu computador

Crie um arquivo `testar_enums.py` na pasta `suporte-inteligente` com:

```python
import csv

from suporte.modelos import Prioridade, Ticket, ordenar_por_urgencia

print(list(Prioridade), Prioridade.URGENTE.peso)

with open("data/tickets.csv", encoding="utf-8", newline="") as arquivo:
    tickets = [Ticket.de_linha(linha) for linha in csv.DictReader(arquivo)]

for ticket in ordenar_por_urgencia(tickets)[:5]:
    print(ticket.prioridade, ticket.aberto_em, ticket.assunto)
```

E rode no terminal:

```bash
python testar_enums.py
```
