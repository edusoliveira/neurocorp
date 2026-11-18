## Contexto

> "O `carregar_tickets_limpos` do T009 descarta as linhas ruins, mas só devolve **quantas** foram. Quando eu reclamo com o time que exporta o arquivo, eles perguntam: 'qual linha? qual campo?' e eu não sei responder. Além disso, as regras de limpeza estão misturadas no meio do laço de leitura. Quero as regras declaradas num lugar só e uma mensagem por linha descartada." — Júlia, Coordenadora de Suporte

O **Pydantic** é a biblioteca de validação mais usada do Python (está por trás do FastAPI e de quase todo SDK de LLM). Você declara um modelo com campos tipados, e ele **converte e valida** os dados de entrada:

```python
from pydantic import BaseModel, ValidationError, field_validator


class Pedido(BaseModel):
    numero: int
    cliente: str

    @field_validator("cliente", mode="before")
    @classmethod
    def limpar(cls, valor: object) -> object:
        return valor.strip() if isinstance(valor, str) else valor


Pedido.model_validate({"numero": "12", "cliente": "  Ana "})  # numero=12 cliente='Ana' — "12" virou int!
try:
    Pedido.model_validate({"numero": "abc", "cliente": "Ana"})
except ValidationError as erro:
    print(erro.errors()[0]["loc"])  # ('numero',) — o campo que falhou
```

- O Pydantic **converte** quando faz sentido (`"12"` → `12`, `"2026-11-03T08:00"` → `datetime`, `"alta"` → `Prioridade.ALTA`) e gera `ValidationError` quando não dá.
- `@field_validator("campo")` roda **depois** da conversão (recebe o valor já no tipo do campo). Com `mode="before"`, roda **antes** (recebe o valor cru, aqui sempre texto). O validador devolve o valor (talvez modificado) ou levanta `ValueError` para recusar.
- `@field_validator` vem junto com `@classmethod`, nessa ordem (o `field_validator` em cima).
- `erro.errors()` é uma lista de dicionários; em cada um, `"loc"` é uma tupla cujo primeiro item é o nome do campo com problema.

> 💡 **Vindo do C#:** pense em um DTO com **DataAnnotations** (`[Required]`, `[Range]`) + **FluentValidation** + o model binding do ASP.NET, tudo numa classe só: os tipos dos campos fazem a conversão (como o model binder), e os `@field_validator` são as regras customizadas (como `RuleFor(x => x.Id).GreaterThan(0)`). O `ValidationError` é o `ModelState` inválido, com a lista de erros por campo.

O Pydantic já está instalado no ambiente do corretor (e você pode instalar no seu com `pip install pydantic`).

## O que fazer

Crie o arquivo `suporte/schemas.py`.

### 1. `class TicketEntrada(BaseModel)`

Um modelo que valida **uma linha crua do CSV** (um `dict[str, str]`, como as do `csv.DictReader`). Campos, nesta ordem:

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `int` | precisa ser um inteiro **positivo** (`"abc"`, `""`, `"0"`, `"-3"` são inválidos) |
| `cliente` | `str` | como veio |
| `categoria` | `str` | sem espaços nas pontas e minúscula; **não pode ficar vazia** |
| `prioridade` | `Prioridade` (do T014) | sem espaços nas pontas e minúscula **antes** de converter (`" ALTA "` → `Prioridade.ALTA`); valor desconhecido é inválido |
| `status` | `Status` (do T014) | valor desconhecido é inválido |
| `canal` | `str` | como veio |
| `aberto_em` | `datetime` | o Pydantic converte sozinho |
| `fechado_em` | `datetime \| None` | texto vazio vira `None` (padrão `None`) |
| `assunto` | `str` | normalizado com `normalizar_assunto` do T004 (`"   pedido    ATRASADO   "` → `"Pedido atrasado"`) |

Use `@field_validator` para as regras (sozinho, o Pydantic não sabe que o `id` precisa ser positivo, nem que `""` é `None`, nem limpar textos).

### 2. `para_ticket(self) -> Ticket`

Um método de `TicketEntrada` que devolve o `Ticket` (dataclass do T014) com os mesmos valores. Dica: `self.model_dump()` devolve um dicionário com os campos, e `Ticket(**dicionario)` cria o ticket a partir dele.

### 3. `validar_linhas(linhas: list[dict[str, str]]) -> tuple[list[TicketEntrada], list[str]]`

Uma função (fora da classe) que valida cada linha e devolve a tupla `(validos, erros)`:

- `validos`: os `TicketEntrada` das linhas válidas, na ordem original;
- `erros`: **uma mensagem por linha inválida**, no formato

```
linha <n>: <campos com problema, separados por ", ">
```

onde `<n>` é a posição da linha na lista, **começando em 1** (o cabeçalho do CSV não conta). Exemplos: `"linha 4: id"`, `"linha 12: prioridade"`, `"linha 7: id, categoria"`.

Os nomes dos campos vêm do `ValidationError`: para cada item de `erro.errors()`, o campo é `item["loc"][0]`.

```python
import csv
from suporte.schemas import validar_linhas

with open("data/tickets_sujos.csv", encoding="utf-8", newline="") as arquivo:
    validos, erros = validar_linhas(list(csv.DictReader(arquivo)))
print(len(validos), erros)   # 36 ['linha 4: id', 'linha 8: categoria', 'linha 12: prioridade', 'linha 20: id']
```

> ✅ O resultado precisa bater com o T009: os mesmos 36 tickets válidos e 4 descartados.

## Como testar no seu computador

Crie um arquivo `testar_schemas.py` na pasta `suporte-inteligente` com:

```python
import csv

from suporte.schemas import TicketEntrada, validar_linhas

with open("data/tickets_sujos.csv", encoding="utf-8", newline="") as arquivo:
    linhas = list(csv.DictReader(arquivo))

print(TicketEntrada.model_validate(linhas[0]))
validos, erros = validar_linhas(linhas)
print(len(validos), "válidos")
for erro in erros:
    print(erro)
print(validos[0].para_ticket())
```

E rode no terminal:

```bash
python testar_schemas.py
```
