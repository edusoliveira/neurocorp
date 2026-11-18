## Contexto

> "O cliente novo exporta arquivos com milhões de tickets. O `carregar_tickets` do T007 monta uma lista com **todas** as linhas antes de devolver — com esse arquivo, o servidor fica sem memória. Precisamos processar o arquivo **aos pedaços**: ler um lote, processar, descartar, ler o próximo. E mais pra frente vamos mandar os tickets para um modelo de IA justamente em lotes." — Rafael, Product Manager

Um **gerador** é uma função que usa `yield` em vez de `return`. Ela não roda de uma vez: cada `yield` entrega um valor e **pausa** a função até alguém pedir o próximo.

```python
def contar_ate(n):
    print("começou!")
    for i in range(1, n + 1):
        yield i


numeros = contar_ate(3)   # nada é impresso ainda! a função nem começou
next(numeros)             # imprime "começou!" e devolve 1
next(numeros)             # 2
list(numeros)             # [3] — o que sobrou
```

Isso se chama **avaliação preguiçosa** (*lazy*): só um item existe na memória por vez. O `for` funciona com geradores do mesmo jeito que com listas — mas um gerador só pode ser percorrido **uma vez**.

Nos type hints, uma função geradora devolve `Iterator[Tipo]`, e quem aceita "qualquer coisa que dá para percorrer com `for`" (lista, gerador, tupla...) recebe `Iterable[Tipo]` — os dois vêm de `collections.abc`.

> 💡 **Vindo do C#:** `yield` é exatamente o `yield return`, e `Iterator[T]` / `Iterable[T]` correspondem a `IEnumerator<T>` / `IEnumerable<T>`. A avaliação adiada é a mesma do LINQ: nada roda até alguém enumerar. Uma diferença importante: no C# um `IEnumerable` geralmente pode ser enumerado de novo (re-executa o método); no Python um gerador **se esgota** depois do primeiro uso.

## O que fazer

Crie o arquivo `suporte/streaming.py` com duas funções.

### 1. `ler_em_lotes(caminho: str | Path, tamanho: int) -> Iterator[list[dict[str, str]]]`

Uma **função geradora** (com `yield`) que lê o CSV em `caminho` (UTF-8, `newline=""`, com `csv.DictReader`) e entrega listas de até `tamanho` linhas:

- cada linha é o dicionário do `DictReader`, **sem conversão** (tudo texto);
- os lotes saem na ordem do arquivo; todos têm exatamente `tamanho` linhas, menos o último, que pode ser menor;
- **nunca** entrega um lote vazio (um arquivo só com o cabeçalho não gera nenhum lote);
- se `tamanho` for menor que 1, levante `ValueError`.

Exemplo com um arquivo de 7 tickets e `tamanho=3`: os lotes têm 3, 3 e 1 linhas.

Por ser um gerador, **nada acontece quando a função é chamada** — o arquivo só é aberto (e o `ValueError` só aparece) quando o primeiro lote é pedido, por exemplo com `next(...)`, `list(...)` ou num `for`. Os testes conferem isso: chamar `ler_em_lotes("nao_existe.csv", 10)` não pode dar erro; o `FileNotFoundError` só aparece no primeiro `next`.

> 💡 Você pode montar os lotes na mão (uma lista que enche até `tamanho`, `yield`, recomeça) ou usar `itertools.batched(iteravel, n)` (Python 3.12+), que agrupa de `n` em `n` em tuplas. As duas formas valem.

### 2. `contar_por_status(linhas: Iterable[dict[str, str]]) -> dict[str, int]`

Recebe **qualquer iterável** de linhas (uma lista, um gerador...) e devolve `{status: quantidade}`. Percorra as linhas **uma vez só** (lembre: um gerador não pode ser percorrido duas vezes).

Juntando as duas, dá para contar um arquivo gigante sem nunca ter mais de um lote na memória:

```python
linhas = (linha for lote in ler_em_lotes("data/tickets.csv", 50) for linha in lote)
contar_por_status(linhas)   # {'fechado': ..., 'aberto': ..., 'em_andamento': ...}
```

(Os parênteses em volta criam uma **expressão geradora** — igual a uma list comprehension, mas preguiçosa.)

> ⚠️ Nada de `readlines()` ou de carregar o arquivo inteiro numa lista.

## Como testar no seu computador

Crie um arquivo `testar_streaming.py` na pasta `suporte-inteligente` com:

```python
from suporte.streaming import contar_por_status, ler_em_lotes

lotes = ler_em_lotes("data/tickets.csv", 100)
print(lotes)                       # <generator object ...> — ainda não leu nada
for lote in lotes:
    print(len(lote), "linhas")     # 100, 100, 40

linhas = (linha for lote in ler_em_lotes("data/tickets.csv", 50) for linha in lote)
print(contar_por_status(linhas))
```

E rode no terminal:

```bash
python testar_streaming.py
```
