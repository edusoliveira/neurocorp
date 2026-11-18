## Contexto

> "O time de dados montou um painel web que mostra os números do suporte, mas ele precisa receber um arquivo **JSON** com o resumo do dia. Olhando o código de vocês, já existe função pra contar abertos, contar por categoria, calcular a taxa de resolução... É só juntar tudo!" — Rafael, Product Manager

Cada arquivo `.py` dentro de `suporte/` é um **módulo**. Você pode usar uma função de outro módulo com `import`:

```python
from suporte.metricas import calcular_taxa_resolucao
from suporte.filtros import contar_abertos
from suporte.contagens import contar_por_categoria
```

**JSON** é um formato de texto muito usado para trocar dados entre sistemas. Um dicionário Python vira JSON quase do mesmo jeito que aparece no código, com o módulo `json`.

## O que fazer

No arquivo `suporte/relatorio.py`, complete as duas funções.

### `gerar_relatorio(tickets)`

Recebe uma lista de tickets (dicionários, como os de `carregar_tickets`) e devolve um **dicionário** com exatamente estas 5 chaves:

| Chave | Valor | Dica |
|---|---|---|
| `"total"` | quantidade de tickets na lista | `len(...)` |
| `"abertos"` | quantos têm `status` diferente de `"fechado"` | reaproveite `contar_abertos` (T005) |
| `"por_categoria"` | dicionário `{categoria: quantidade}` | reaproveite `contar_por_categoria` (T006) |
| `"por_prioridade"` | dicionário `{prioridade: quantidade}`, só com as prioridades que aparecem | mesma ideia do T006, com a chave `"prioridade"` |
| `"taxa_resolucao"` | porcentagem de tickets **fechados** sobre o total, com 1 casa decimal | reaproveite `calcular_taxa_resolucao` (T002); fechados = total − abertos |

Exemplo com 4 tickets:

| categoria | prioridade | status |
|---|---|---|
| tecnico | alta | aberto |
| cobranca | baixa | fechado |
| tecnico | alta | em_andamento |
| entrega | urgente | fechado |

```python
{
    "total": 4,
    "abertos": 2,
    "por_categoria": {"tecnico": 2, "cobranca": 1, "entrega": 1},
    "por_prioridade": {"alta": 2, "baixa": 1, "urgente": 1},
    "taxa_resolucao": 50.0,
}
```

Com a lista vazia `[]`, o resultado é `{"total": 0, "abertos": 0, "por_categoria": {}, "por_prioridade": {}, "taxa_resolucao": 0.0}`.

### `salvar_relatorio(relatorio, caminho)`

Grava o dicionário `relatorio` no arquivo `caminho` em formato JSON:

- abra o arquivo para escrita com `encoding="utf-8"`;
- use `json.dump(relatorio, arquivo, ensure_ascii=False, indent=2)`.
  - `ensure_ascii=False` mantém os acentos legíveis (`"Pão"` em vez de `"Pão"`);
  - `indent=2` deixa o arquivo indentado com 2 espaços, fácil de ler.

A função não precisa devolver nada.

## Como testar no seu computador

Crie um arquivo `testar_relatorio.py` na pasta `suporte-inteligente` com:

```python
from suporte.leitura import carregar_tickets
from suporte.relatorio import gerar_relatorio, salvar_relatorio

tickets = carregar_tickets("data/tickets.csv")
relatorio = gerar_relatorio(tickets)
print(relatorio)
salvar_relatorio(relatorio, "relatorio.json")
```

Rode no terminal e depois abra o arquivo `relatorio.json` no VS Code:

```bash
python testar_relatorio.py
```
