## Contexto

> "Na reunião de planejamento me perguntaram: 'qual área gera mais chamados?'. Eu não sabia responder! Quero uma contagem por categoria e, de cara, qual é a campeã." — Rafael, Product Manager

Um **dicionário** guarda pares `chave: valor`. Ele é perfeito para contar coisas: a chave é o que está sendo contado e o valor é quantas vezes apareceu.

```python
contagem = {}
contagem["cobranca"] = 1
contagem["cobranca"] = contagem["cobranca"] + 1
print(contagem)            # {'cobranca': 2}
print(contagem.get("tecnico", 0))   # 0  (get devolve o valor padrão se a chave não existe)
```

## O que fazer

No arquivo `suporte/contagens.py`, complete as duas funções. Os tickets são uma lista de dicionários, como no ticket anterior; aqui importa só a chave `"categoria"` (`"cobranca"`, `"tecnico"`, `"conta"` ou `"entrega"`).

> ⚠️ Não use `collections.Counter` — a ideia é praticar dicionários na mão.

### `contar_por_categoria(tickets)`

Devolve um dicionário em que cada chave é uma categoria que **aparece** na lista e o valor é quantos tickets ela tem. Categorias que não aparecem **não** entram no dicionário.

| Categorias dos tickets | Resultado |
|---|---|
| `tecnico`, `cobranca`, `tecnico`, `entrega`, `tecnico` | `{"tecnico": 3, "cobranca": 1, "entrega": 1}` |
| lista vazia `[]` | `{}` |

### `categoria_mais_frequente(tickets)`

Devolve o **nome** da categoria com mais tickets.

- **Empate:** se duas ou mais categorias tiverem a mesma quantidade máxima, devolva a que vem **primeiro em ordem alfabética**.
- **Lista vazia:** devolva `None`.

| Categorias dos tickets | Resultado |
|---|---|
| `tecnico`, `cobranca`, `tecnico`, `entrega`, `tecnico` | `"tecnico"` |
| `entrega`, `conta`, `entrega`, `conta` | `"conta"` (empate 2 x 2; "conta" vem antes de "entrega") |
| lista vazia `[]` | `None` |

> 💡 Você pode reaproveitar `contar_por_categoria` dentro de `categoria_mais_frequente`. Para o empate, percorra as categorias em ordem alfabética com `sorted(contagem)` e só troque a campeã quando encontrar uma quantidade **maior** (não maior ou igual).

## Como testar no seu computador

Crie um arquivo `testar_contagens.py` na pasta `suporte-inteligente` com:

```python
from suporte.contagens import contar_por_categoria, categoria_mais_frequente

tickets = [{"categoria": "entrega"}, {"categoria": "conta"},
           {"categoria": "entrega"}, {"categoria": "conta"}]

print(contar_por_categoria(tickets))       # {'entrega': 2, 'conta': 2}
print(categoria_mais_frequente(tickets))   # conta
print(categoria_mais_frequente([]))        # None
```

E rode no terminal:

```bash
python testar_contagens.py
```
