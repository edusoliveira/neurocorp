## Contexto

> "Combinamos com os clientes um **SLA**: nenhum ticket pode ficar aberto mais do que X horas. Só que hoje ninguém sabe quais tickets estão estourando o prazo. Quero duas coisas: a fila em ordem de chegada (quem chegou primeiro é atendido primeiro) e a lista de quem já passou do limite." — Júlia, Coordenadora de Suporte

No CSV, as datas são textos no formato ISO, como `"2026-11-03T08:12"` (ano-mês-dia, a letra `T`, hora:minuto). Para fazer contas com elas, converta para `datetime`:

```python
from datetime import datetime, timedelta

aberto = datetime.fromisoformat("2026-11-03T08:00")
agora = datetime(2026, 11, 4, 10, 0)
espera = agora - aberto                 # isso é um timedelta
print(espera)                           # 1 day, 2:00:00
print(espera > timedelta(hours=24))     # True
print(espera.total_seconds() / 3600)    # 26.0 (horas)
```

## O que fazer

No arquivo `suporte/sla.py`, complete as duas funções. Os tickets são dicionários como os que `carregar_tickets` devolve (o campo `aberto_em` é texto ISO).

### `ordenar_por_antiguidade(tickets)`

Devolve uma **nova lista** com os mesmos tickets, do **mais antigo** (menor `aberto_em`) para o **mais recente**.

- **Não altere** a lista recebida: `sorted(...)` cria uma lista nova; já `lista.sort()` muda a original.
- Use `key=` para dizer por qual campo ordenar, por exemplo `sorted(tickets, key=lambda t: datetime.fromisoformat(t["aberto_em"]))`.

| `aberto_em` dos tickets recebidos (ids 1, 2, 3, 4) | Ordem devolvida (ids) |
|---|---|
| `2026-11-04T09:00`, `2026-11-03T15:30`, `2026-11-05T08:00`, `2026-11-03T08:10` | `4, 2, 1, 3` |

### `tickets_fora_do_sla(tickets, agora, limite_horas)`

- `agora` é um `datetime` (o momento da consulta);
- `limite_horas` é um número de horas (por exemplo `24`).

Devolve uma lista com os tickets que:

1. **não estão fechados** (`status` diferente de `"fechado"`), **e**
2. estão abertos há **mais de** `limite_horas` horas, ou seja, `agora - aberto_em` é **maior** que o limite.

Um ticket aberto há **exatamente** `limite_horas` horas **ainda não** está fora do SLA. A lista devolvida mantém a **mesma ordem** da lista recebida. Se nenhum ticket estourar o prazo, devolva `[]`.

Exemplo com `agora = datetime(2026, 11, 4, 10, 0)` e `limite_horas = 24`:

| id | status | aberto_em | Tempo aberto | Fora do SLA? |
|---|---|---|---|---|
| 1 | aberto | `2026-11-03T08:00` | 26 h | ✅ sim |
| 2 | aberto | `2026-11-04T09:00` | 1 h | não |
| 3 | fechado | `2026-11-01T08:00` | 74 h | não (está fechado) |
| 4 | em_andamento | `2026-11-02T10:00` | 48 h | ✅ sim |
| 5 | aberto | `2026-11-03T10:00` | exatamente 24 h | não (não é **mais** de 24) |

Resultado: os tickets de id `1` e `4`, nessa ordem.

## Como testar no seu computador

Crie um arquivo `testar_sla.py` na pasta `suporte-inteligente` com:

```python
from datetime import datetime

from suporte.leitura import carregar_tickets
from suporte.sla import ordenar_por_antiguidade, tickets_fora_do_sla

tickets = carregar_tickets("data/tickets.csv")
fila = ordenar_por_antiguidade(tickets)
print("Mais antigo:", fila[0]["id"], fila[0]["aberto_em"])

atrasados = tickets_fora_do_sla(tickets, datetime(2026, 11, 10, 18, 0), 24)
print(len(atrasados), "tickets fora do SLA")
```

E rode no terminal:

```bash
python testar_sla.py
```
