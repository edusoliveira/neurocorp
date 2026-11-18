## Contexto

> "De manhã eu preciso de duas respostas rápidas: quantos tickets ainda estão abertos, e quais são os urgentes pra eu distribuir primeiro. Hoje eu conto na mão olhando a planilha!" — Júlia, Coordenadora de Suporte

Cada ticket é representado por um **dicionário** com as mesmas colunas do arquivo `data/tickets.csv`. Uma lista de tickets é, então, uma **lista de dicionários**:

```python
tickets = [
    {"id": 1, "cliente": "Padaria Pão Quente", "categoria": "cobranca", "prioridade": "alta",
     "status": "aberto", "canal": "email", "aberto_em": "2026-11-03T08:12",
     "fechado_em": "", "assunto": "Boleto não foi gerado"},
    {"id": 2, "cliente": "Loja Bella Moda", "categoria": "tecnico", "prioridade": "urgente",
     "status": "fechado", "canal": "chat", "aberto_em": "2026-11-03T09:40",
     "fechado_em": "2026-11-03T11:02", "assunto": "Sistema parado, não funciona nada"},
]

tickets[0]["status"]   # "aberto"
```

O campo `status` pode ser `"aberto"`, `"em_andamento"` ou `"fechado"`.

## O que fazer

No arquivo `suporte/filtros.py`, complete as duas funções usando **laços `for`**.

### `contar_abertos(tickets)`

Devolve um número inteiro: quantos tickets **não estão fechados**, ou seja, cujo `status` é diferente de `"fechado"` (`"aberto"` e `"em_andamento"` contam os dois).

| Status dos tickets na lista | Resultado |
|---|---|
| `aberto`, `fechado`, `em_andamento`, `fechado`, `aberto` | `3` |
| `fechado`, `fechado` | `0` |
| lista vazia `[]` | `0` |

### `filtrar_por_prioridade(tickets, prioridade)`

Devolve uma **nova lista** só com os tickets (os dicionários inteiros) cujo campo `"prioridade"` é igual ao texto `prioridade` recebido, **na mesma ordem** em que aparecem na lista original.

- Se nenhum ticket tiver aquela prioridade, devolva uma lista vazia `[]`.
- **Não altere** a lista recebida (não remova itens dela): crie uma lista nova e use `.append()`.

| Prioridades na lista (ids 1 a 5) | Chamada | Resultado (ids) |
|---|---|---|
| `alta`, `baixa`, `urgente`, `alta`, `media` | `filtrar_por_prioridade(tickets, "alta")` | tickets `1` e `4` |
| mesma lista | `filtrar_por_prioridade(tickets, "urgente")` | ticket `3` |
| `baixa`, `media` | `filtrar_por_prioridade(tickets, "urgente")` | `[]` |

## Como testar no seu computador

Crie um arquivo `testar_filtros.py` na pasta `suporte-inteligente` com:

```python
from suporte.filtros import contar_abertos, filtrar_por_prioridade

tickets = [
    {"id": 1, "prioridade": "alta", "status": "aberto"},
    {"id": 2, "prioridade": "baixa", "status": "fechado"},
    {"id": 3, "prioridade": "alta", "status": "em_andamento"},
]

print(contar_abertos(tickets))                   # 2
print(filtrar_por_prioridade(tickets, "alta"))   # tickets 1 e 3
```

E rode no terminal:

```bash
python testar_filtros.py
```
