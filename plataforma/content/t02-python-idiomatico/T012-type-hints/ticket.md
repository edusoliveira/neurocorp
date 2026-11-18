## Contexto

> "O código da Trilha 1 funciona, mas quem abre `filtros.py` pela primeira vez não sabe se `tickets` é uma lista, um dicionário ou um DataFrame. Daqui pra frente todo código novo da NeuroCorp tem **type hints**. Vamos começar anotando os três módulos mais usados — sem mudar nenhum comportamento." — Marina, Tech Lead de IA

**Type hints** (anotações de tipo) dizem qual o tipo esperado de cada parâmetro e do retorno:

```python
def calcular_pendentes(recebidos: int, resolvidos: int) -> int:
    return recebidos - resolvidos
```

O Python **não** confere os tipos ao rodar — eles servem para o editor (autocompletar, avisos), para ferramentas como o mypy/pyright e para quem lê o código. Mas eles ficam guardados na função e dá para consultá-los com `typing.get_type_hints(funcao)` — é assim que os testes deste ticket conferem o seu trabalho.

Tipos úteis (Python 3.12+, sem precisar importar nada do `typing`, exceto `Any`):

| Anotação | Significa |
|---|---|
| `int`, `float`, `str`, `bool` | os tipos simples |
| `list[str]` | lista de textos |
| `dict[str, int]` | dicionário com chaves texto e valores inteiros |
| `str \| None` | um texto **ou** `None` |
| `Any` (`from typing import Any`) | "qualquer coisa" — o verificador de tipos não reclama de nada |

> 💡 **Vindo do C#:** é como sair do `var`/`dynamic` para assinaturas explícitas: `int CalcularPendentes(int recebidos, int resolvidos)`. A diferença é que no Python os tipos **não são verificados pelo compilador nem em tempo de execução** — quem verifica é o editor ou uma ferramenta separada (mypy/pyright). `str | None` é o `string?` (nullable), `list[str]` é o `List<string>`, `dict[str, int]` é o `Dictionary<string, int>` e `dict[str, Any]` é o `Dictionary<string, object>`.

## O que fazer

Adicione as anotações abaixo nos arquivos que você escreveu na Trilha 1. **Não mude o que as funções fazem** — os testes também conferem que o comportamento continua igual.

Os tickets ainda são dicionários com valores de tipos variados (o `id` é `int`, o resto é `str`), então anote cada ticket como `dict[str, Any]` (lembre do `from typing import Any` no topo do arquivo).

### `suporte/metricas.py`

```python
def calcular_pendentes(recebidos: int, resolvidos: int) -> int: ...
def calcular_taxa_resolucao(recebidos: int, resolvidos: int) -> float: ...
```

### `suporte/filtros.py`

```python
def contar_abertos(tickets: list[dict[str, Any]]) -> int: ...
def filtrar_por_prioridade(tickets: list[dict[str, Any]], prioridade: str) -> list[dict[str, Any]]: ...
```

### `suporte/contagens.py`

```python
def contar_por_categoria(tickets: list[dict[str, Any]]) -> dict[str, int]: ...
def categoria_mais_frequente(tickets: list[dict[str, Any]]) -> str | None: ...
```

`categoria_mais_frequente` devolve `None` quando a lista está vazia — por isso o retorno é `str | None`, e não só `str`.

Dicas de estilo (não são cobradas pelos testes, mas a Marina vai gostar):

- Variáveis que começam vazias ficam mais claras anotadas: `contagem: dict[str, int] = {}`, `campea: str | None = None`.
- Use os tipos nativos em minúsculas (`list`, `dict`) — `List`/`Dict`/`Optional` do módulo `typing` são o jeito antigo.

> ⚠️ Toda função desses três arquivos precisa ter tipo em **todos** os parâmetros e no retorno — o Tech Lead Bot confere isso.

## Como testar no seu computador

Crie um arquivo `testar_tipos.py` na pasta `suporte-inteligente` com:

```python
import typing

from suporte.contagens import categoria_mais_frequente, contar_por_categoria
from suporte.metricas import calcular_taxa_resolucao

print(typing.get_type_hints(calcular_taxa_resolucao))
# {'recebidos': <class 'int'>, 'resolvidos': <class 'int'>, 'return': <class 'float'>}
print(typing.get_type_hints(categoria_mais_frequente))
print(contar_por_categoria([{"categoria": "conta"}, {"categoria": "conta"}]))  # {'conta': 2}
```

E rode no terminal:

```bash
python testar_tipos.py
```

Passe o mouse em cima das funções no VS Code: agora o editor mostra os tipos.
