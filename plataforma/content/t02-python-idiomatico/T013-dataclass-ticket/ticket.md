## Contexto

> "Com dicionário, `ticket["aberto_em"]` é um texto, `ticket["id"]` às vezes é texto e às vezes é int, e um erro de digitação como `ticket["prioridadee"]` só aparece quando o programa quebra. Quero um **modelo** `Ticket`: cada campo com nome e tipo fixos, as datas já como `datetime`, e um jeito único de criar o ticket a partir de uma linha do CSV." — Marina, Tech Lead de IA

Uma **dataclass** é uma classe que o Python completa sozinho: a partir dos campos anotados, o `@dataclass` gera o `__init__`, o `__repr__` (para imprimir bonito) e o `__eq__` (comparar dois tickets campo a campo).

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Ponto:
    x: int
    y: int


p = Ponto(1, 2)
print(p)            # Ponto(x=1, y=2)
p == Ponto(1, 2)    # True
p.x = 5             # dataclasses.FrozenInstanceError — frozen=True deixa o objeto imutável
```

Três ferramentas novas de classe:

- **`@property`**: um método que é lido como atributo, sem parênteses (`ticket.esta_aberto`).
- **método normal**: recebe `self` e pode receber parâmetros (`ticket.horas_aberto(agora)`).
- **`@classmethod`**: recebe a própria classe (`cls`) em vez de uma instância — perfeito para **construtores alternativos** como `Ticket.de_linha(linha)`.

> 💡 **Vindo do C#:** `@dataclass(frozen=True)` é o equivalente do `record` (ou `record class`) com propriedades `init`-only: igualdade por valor, `ToString()` pronto e imutabilidade. `@property` é a propriedade com `get` (`public bool EstaAberto => Status != "fechado";`). `@classmethod de_linha` faz o papel de um método de fábrica `static Ticket FromRow(...)` — com a vantagem de receber `cls`, então funciona também em subclasses. E `datetime | None` é o `DateTime?`.

## O que fazer

Crie a classe `Ticket` no arquivo `suporte/modelos.py`.

### 1. Os campos

`Ticket` deve ser uma `@dataclass(frozen=True)` (imutável) com exatamente estes campos, **nesta ordem** (a mesma das colunas do CSV):

| Campo | Tipo |
|---|---|
| `id` | `int` |
| `cliente` | `str` |
| `categoria` | `str` |
| `prioridade` | `str` |
| `status` | `str` |
| `canal` | `str` |
| `aberto_em` | `datetime` |
| `fechado_em` | `datetime \| None` |
| `assunto` | `str` |

(`datetime` vem de `from datetime import datetime`.)

### 2. `esta_aberto` (property)

`ticket.esta_aberto` devolve `True` se o `status` for diferente de `"fechado"` (a mesma regra do `contar_abertos` do T005), senão `False`.

### 3. `horas_aberto(agora: datetime) -> float`

Devolve há quantas horas o ticket está (ou ficou) aberto, como `float`, **sem arredondar**:

- se o ticket tem `fechado_em`: as horas entre `aberto_em` e `fechado_em` (o `agora` é ignorado);
- se `fechado_em` é `None`: as horas entre `aberto_em` e `agora`.

Exemplo: aberto às 08:00 e fechado às 10:30 → `2.5`. Dica: a diferença entre dois `datetime` é um `timedelta`, e `timedelta.total_seconds() / 3600` dá as horas.

### 4. `de_linha(linha: dict[str, str])` (classmethod)

Recebe uma linha do CSV (como as do `csv.DictReader`: tudo texto) e devolve um `Ticket`:

| Campo | Conversão |
|---|---|
| `id` | `int(...)` |
| `aberto_em` | `datetime.fromisoformat(...)` |
| `fechado_em` | `None` se vier `""`; senão `datetime.fromisoformat(...)` |
| demais campos | ficam como vieram |

Se o `id` ou alguma data for inválido, deixe o `ValueError` do Python subir — a limpeza de dados sujos fica para outro ticket.

```python
linha = {"id": "7", "cliente": "Padaria Pão Quente", "categoria": "cobranca", "prioridade": "alta",
         "status": "fechado", "canal": "email", "aberto_em": "2026-11-03T08:00",
         "fechado_em": "2026-11-03T10:30", "assunto": "Boleto não foi gerado"}
ticket = Ticket.de_linha(linha)
ticket.id                          # 7
ticket.esta_aberto                 # False
ticket.horas_aberto(datetime.now())  # 2.5
```

> 💡 Para o tipo de retorno de `de_linha`, use `Self` (`from typing import Self`): `def de_linha(cls, linha: dict[str, str]) -> Self:`. Ele significa "uma instância desta classe".

> ⚠️ Todos os métodos precisam de anotações de tipo nos parâmetros (exceto `self`/`cls`) e no retorno.

## Como testar no seu computador

Crie um arquivo `testar_modelos.py` na pasta `suporte-inteligente` com:

```python
import csv
from datetime import datetime

from suporte.modelos import Ticket

with open("data/tickets.csv", encoding="utf-8", newline="") as arquivo:
    tickets = [Ticket.de_linha(linha) for linha in csv.DictReader(arquivo)]

print(tickets[0])
print(sum(1 for t in tickets if t.esta_aberto), "abertos")
print(round(tickets[0].horas_aberto(datetime(2026, 11, 10, 18, 0)), 1), "horas")
```

E rode no terminal:

```bash
python testar_modelos.py
```
