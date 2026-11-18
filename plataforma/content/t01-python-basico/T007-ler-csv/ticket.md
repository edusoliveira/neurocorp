## Contexto

> "As funções que você escreveu até aqui são ótimas, mas elas recebem listas que a gente monta na mão. Os tickets de verdade ficam no arquivo `data/tickets.csv`, exportado do sistema de atendimento todo dia. Precisamos de uma função que leia esse arquivo e devolva a lista de tickets no formato que as outras funções já entendem." — Marina, Tech Lead de IA

Um CSV é um arquivo de texto em que cada linha é um registro e as colunas são separadas por vírgula. A primeira linha é o **cabeçalho**:

```
id,cliente,categoria,prioridade,status,canal,aberto_em,fechado_em,assunto
1,Padaria Pão Quente,cobranca,alta,aberto,email,2026-11-03T08:12,,Boleto não foi gerado
2,Loja Bella Moda,tecnico,urgente,fechado,chat,2026-11-03T09:40,2026-11-03T11:02,"Sistema parado, não funciona nada"
```

O módulo `csv` da biblioteca padrão tem o `csv.DictReader`, que lê cada linha e devolve um **dicionário** usando o cabeçalho como chaves.

## O que fazer

No arquivo `suporte/leitura.py`, complete a função `carregar_tickets(caminho)`:

1. Abra o arquivo em `caminho` (um texto com o caminho do arquivo) com `open(caminho, encoding="utf-8", newline="")` dentro de um `with`.
2. Use `csv.DictReader` para ler as linhas.
3. Para cada linha, converta o campo `"id"` para **inteiro** com `int(...)`. Todos os outros campos continuam como **texto**, do jeito que vieram (inclusive `fechado_em` vazio, que fica `""`).
4. Devolva uma **lista de dicionários**, na mesma ordem das linhas do arquivo.

Exemplo, com o arquivo acima:

```python
tickets = carregar_tickets("data/tickets.csv")
tickets[0]["id"]          # 1   (int, não "1")
tickets[0]["cliente"]     # "Padaria Pão Quente"
tickets[0]["fechado_em"]  # ""
tickets[1]["assunto"]     # "Sistema parado, não funciona nada"
```

Casos especiais:

| Situação | Resultado |
|---|---|
| Arquivo com acentos (`"Pão"`, `"não"`) | os acentos aparecem corretos — por isso o `encoding="utf-8"` é obrigatório (no Windows, sem ele, o Python usa outra codificação e os acentos viram `Ã£`) |
| Arquivo só com o cabeçalho, sem tickets | `[]` |

> ⚠️ Não use `pandas` neste ticket — é para praticar o módulo `csv`.

## Como testar no seu computador

Crie um arquivo `testar_leitura.py` na pasta `suporte-inteligente` com:

```python
from suporte.leitura import carregar_tickets

tickets = carregar_tickets("data/tickets.csv")
print(len(tickets), "tickets carregados")
print(tickets[0])
print(type(tickets[0]["id"]))   # <class 'int'>
```

E rode no terminal:

```bash
python testar_leitura.py
```
