## Contexto

> "O sistema antigo exportou o arquivo `data/tickets_sujos.csv` e quando a gente tentou carregar, o programa parou com `ValueError: invalid literal for int() with base 10: 'abc'`. Olhei o arquivo e tem de tudo: id que não é número, id vazio, categoria em branco, prioridade 'altíssima', ' ALTA ' com espaço e maiúscula, '  Tecnico '... Não dá pra consertar na mão toda semana. Quero que o código limpe o que dá pra limpar, jogue fora o que não tem salvação e me diga **quantas linhas foram descartadas**." — Júlia, Coordenadora de Suporte

Quando uma conversão pode falhar, usamos `try`/`except` para **tratar o erro** em vez de deixar o programa quebrar:

```python
try:
    numero = int("abc")
except ValueError:
    print("Não é um número!")   # o programa continua rodando
```

## O que fazer

Crie a função `carregar_tickets_limpos(caminho)` no arquivo `suporte/limpeza.py`. Ela lê o CSV (mesmas colunas de sempre, UTF-8, com `csv.DictReader`) e trata **cada linha** assim:

**1. Limpeza** (a linha continua válida):

| Campo | O que fazer | Exemplo |
|---|---|---|
| `id` | converter para `int` | `"7"` → `7` |
| `categoria` | tirar espaços das pontas e deixar minúscula | `"  Tecnico "` → `"tecnico"` |
| `prioridade` | tirar espaços das pontas e deixar minúscula | `" ALTA "` → `"alta"` |
| `assunto` | normalizar como no ticket T004 (você pode importar `normalizar_assunto` de `suporte.texto`) | `"   pedido    ATRASADO   "` → `"Pedido atrasado"` |
| demais campos | ficam exatamente como vieram (texto) | |

**2. Descarte** — a linha é jogada fora (e entra na contagem de descartadas) se:

| Problema | Exemplos |
|---|---|
| o `id` não pode ser convertido para inteiro | `"abc"`, `""` |
| a `categoria` fica vazia depois da limpeza | `""`, `"   "` |
| a `prioridade`, depois da limpeza, não é `"baixa"`, `"media"`, `"alta"` ou `"urgente"` | `"altíssima"`, `""` |

Se a linha tiver mais de um problema, ela conta **uma vez só** como descartada.

**3. Retorno** — a função devolve uma **tupla** com duas coisas: `(validos, quantidade_descartada)`

- `validos`: lista de dicionários (já limpos), na mesma ordem do arquivo;
- `quantidade_descartada`: número inteiro de linhas descartadas.

```python
validos, descartados = carregar_tickets_limpos("data/tickets_sujos.csv")
print(len(validos), descartados)   # 36 4
```

> 💡 Para o id, use `try: id_ticket = int(linha["id"])` com `except ValueError:` somando 1 aos descartados e usando `continue` para pular para a próxima linha.

## Como testar no seu computador

Crie um arquivo `testar_limpeza.py` na pasta `suporte-inteligente` com:

```python
from suporte.limpeza import carregar_tickets_limpos

validos, descartados = carregar_tickets_limpos("data/tickets_sujos.csv")
print(len(validos), "válidos,", descartados, "descartados")   # 36 válidos, 4 descartados
print(sorted({t["prioridade"] for t in validos}))             # ['alta', 'baixa', 'media', 'urgente']
```

E rode no terminal:

```bash
python testar_limpeza.py
```
