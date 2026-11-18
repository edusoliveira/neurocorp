## Contexto

> "Toda manhã eu pergunto: quantos tickets ainda estão pendentes? Qual foi a nossa taxa de resolução? E toda manhã alguém abre a calculadora do celular 🙃. Quero isso em código, num lugar só, pra gente reaproveitar em todo canto." — Rafael, Product Manager

Funções são a forma de dar um **nome** a um pedaço de código e reaproveitar ele quantas vezes quiser. Elas recebem valores (**parâmetros**) e devolvem um resultado com `return`.

## O que fazer

No arquivo `suporte/metricas.py`, complete as duas funções.

### `calcular_pendentes(recebidos, resolvidos)`

Recebe dois números inteiros e **devolve** (com `return`, não com `print`!) quantos tickets ainda estão pendentes, ou seja, `recebidos - resolvidos`.

| Chamada | Resultado |
|---|---|
| `calcular_pendentes(42, 30)` | `12` |
| `calcular_pendentes(10, 10)` | `0` |
| `calcular_pendentes(5, 0)` | `5` |

### `calcular_taxa_resolucao(recebidos, resolvidos)`

Devolve a **porcentagem** de tickets resolvidos: `resolvidos / recebidos * 100`, **arredondada para 1 casa decimal** com `round(valor, 1)`.

Atenção a um caso especial: se `recebidos` for `0`, a divisão quebraria o programa (`ZeroDivisionError`). Nesse caso, devolva `0.0`.

| Chamada | Resultado |
|---|---|
| `calcular_taxa_resolucao(40, 30)` | `75.0` |
| `calcular_taxa_resolucao(8, 8)` | `100.0` |
| `calcular_taxa_resolucao(10, 0)` | `0.0` |
| `calcular_taxa_resolucao(3, 1)` | `33.3` |
| `calcular_taxa_resolucao(3, 2)` | `66.7` |
| `calcular_taxa_resolucao(0, 0)` | `0.0` |

> 💡 Use um `if` para tratar o caso `recebidos == 0` **antes** de fazer a divisão.

## Como testar no seu computador

Crie um arquivo `testar_metricas.py` na pasta `suporte-inteligente` com:

```python
from suporte.metricas import calcular_pendentes, calcular_taxa_resolucao

print(calcular_pendentes(42, 30))         # 12
print(calcular_taxa_resolucao(3, 1))      # 33.3
print(calcular_taxa_resolucao(0, 0))      # 0.0
```

E rode no terminal:

```bash
python testar_metricas.py
```
