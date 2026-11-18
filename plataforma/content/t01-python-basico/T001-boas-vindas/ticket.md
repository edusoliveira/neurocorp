## Contexto

Toda manhã a equipe de suporte abre o terminal e roda um script que dá bom dia e mostra quantos tickets chegaram no dia anterior. O script antigo se perdeu na migração de servidor 😅 — precisamos de um novo.

## O que fazer

No arquivo `suporte/boas_vindas.py`, crie três variáveis:

| Variável | Tipo | Valor |
|---|---|---|
| `empresa` | texto (`str`) | `"NeuroCorp"` |
| `tickets_ontem` | inteiro (`int`) | `42` |
| `equipe` | lista de textos | os nomes de 3 pessoas (quaisquer nomes) |

Depois, **use as variáveis** (não escreva os valores direto no texto!) para imprimir esta mensagem:

```
Bom dia, equipe NeuroCorp! Ontem recebemos 42 tickets. Hoje no plantão: 3 pessoas.
```

> 💡 O "3" deve vir do tamanho da lista `equipe` — use `len()`.

## Como testar no seu computador

Abra o terminal do VS Code na pasta `suporte-inteligente` e rode:

```bash
python suporte/boas_vindas.py
```
