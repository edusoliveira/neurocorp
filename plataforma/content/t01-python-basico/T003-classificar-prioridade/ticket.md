## Contexto

> "Semana passada um cliente VIP ficou 5 horas esperando porque o ticket dele estava marcado como 'baixa'. Isso não pode acontecer de novo! Combinei com a diretoria uma regra simples, baseada em quanto tempo o ticket está aberto e se o cliente é VIP." — Júlia, Coordenadora de Suporte

Para decidir entre vários caminhos, o Python usa `if`, `elif` e `else`. Ele testa as condições **de cima para baixo** e para na primeira que for verdadeira — por isso a ordem das regras importa!

## O que fazer

No arquivo `suporte/prioridade.py`, complete a função `classificar_prioridade(horas_aberto, cliente_vip)`:

- `horas_aberto` é um número (pode ter casas decimais, como `2.5`) com quantas horas o ticket está aberto;
- `cliente_vip` é `True` ou `False`.

A função devolve um destes textos: `"urgente"`, `"alta"`, `"media"` ou `"baixa"` (tudo minúsculo e sem acento). Aplique as regras **nesta ordem**:

| Ordem | Regra | Resultado |
|---|---|---|
| 1 | cliente VIP **e** mais de 2 horas (`horas_aberto > 2`) | `"urgente"` |
| 2 | mais de 24 horas (`horas_aberto > 24`) | `"alta"` |
| 3 | mais de 8 horas (`horas_aberto > 8`) | `"media"` |
| 4 | qualquer outro caso | `"baixa"` |

Repare que é **mais de** (`>`), e não "a partir de". Exemplos, incluindo os limites exatos:

| Chamada | Resultado | Por quê |
|---|---|---|
| `classificar_prioridade(1, False)` | `"baixa"` | nenhuma regra se aplica |
| `classificar_prioridade(8, False)` | `"baixa"` | 8 não é **mais** de 8 |
| `classificar_prioridade(8.5, False)` | `"media"` | regra 3 |
| `classificar_prioridade(24, False)` | `"media"` | 24 não é **mais** de 24 |
| `classificar_prioridade(30, False)` | `"alta"` | regra 2 |
| `classificar_prioridade(2, True)` | `"baixa"` | VIP, mas 2 não é **mais** de 2 |
| `classificar_prioridade(2.5, True)` | `"urgente"` | regra 1 |
| `classificar_prioridade(30, True)` | `"urgente"` | regra 1 vem antes da regra 2 |
| `classificar_prioridade(1, True)` | `"baixa"` | VIP, mas só 1 hora |

## Como testar no seu computador

Crie um arquivo `testar_prioridade.py` na pasta `suporte-inteligente` com:

```python
from suporte.prioridade import classificar_prioridade

print(classificar_prioridade(8.5, False))  # media
print(classificar_prioridade(30, True))    # urgente
print(classificar_prioridade(2, True))     # baixa
```

E rode no terminal:

```bash
python testar_prioridade.py
```
