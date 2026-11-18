## Contexto

> "Toda manhã queremos um resumo dos tickets que já chegue **enriquecido** com os dados de cada cliente no CRM. As peças estão todas prontas: a validação com Pydantic, o `Ticket` com enums, o enriquecimento concorrente e o retry. O desafio é juntar tudo num pipeline robusto: dados ruins não podem derrubar nada, a API instável não pode derrubar nada, e o resultado tem que ser um objeto tipado que o painel consiga consumir. Este é o seu desafio de promoção: **sem dicas do Tech Lead Bot**." — Carlos, CTO

> 💡 **Vindo do C#:** pense num serviço de aplicação `async Task<Resumo> ProcessarAsync(string caminho, Func<string, Task<Cliente>> consultar, int limite = 5)` que orquestra os componentes que você já tem — validação (FluentValidation), domínio (records + enums), chamadas externas com `Task.WhenAll` + `SemaphoreSlim` e uma política do Polly — e devolve um DTO. Mesma arquitetura, outra sintaxe.

## O que fazer

Crie o arquivo `suporte/pipeline.py` com:

### 1. `class Resumo(BaseModel)`

| Campo | Tipo | Significado |
|---|---|---|
| `total_validos` | `int` | quantos tickets passaram na validação |
| `total_descartados` | `int` | quantas linhas do CSV foram recusadas |
| `por_prioridade` | `dict[str, int]` | quantos tickets **válidos** de cada prioridade — sempre com as 4 chaves `"baixa"`, `"media"`, `"alta"`, `"urgente"`, nesta ordem (0 quando não há nenhum) |
| `clientes_enriquecidos` | `int` | quantos clientes distintos foram consultados **com sucesso** |
| `erros` | `list[str]` | as mensagens de erro (veja abaixo) |

### 2. `processar`

```python
async def processar(
    caminho: Path | str,
    consultar: Callable[[str], Awaitable[dict[str, Any]]],
    limite: int = 5,
) -> Resumo:
```

1. Leia o CSV em `caminho` (UTF-8, `csv.DictReader`). Se o arquivo não existe, deixe o `FileNotFoundError` subir.
2. Valide as linhas com `validar_linhas` (T015). As linhas recusadas contam em `total_descartados`, e as mensagens dela (`"linha <n>: <campos>"`) entram em `erros`, na mesma ordem.
3. Converta os válidos para `Ticket` (T014) e conte `por_prioridade`.
4. Consulte cada **cliente distinto** dos tickets válidos usando `enriquecer_todos` (T020) com o `limite` recebido — cada cliente é consultado uma vez só.
5. Cada consulta passa pelo `com_retry` (T021) com os valores padrão (3 tentativas, timeout de 1 s, espera base de 0,1 s): falhas temporárias são repetidas.
6. Se a consulta de um cliente **ainda falhar** depois do `com_retry` (falha temporária esgotada, ou qualquer outra exceção), o pipeline **não pode quebrar**: o cliente não conta em `clientes_enriquecidos` e entra em `erros` a mensagem `cliente <nome>: <nome da classe da exceção>`, por exemplo `"cliente Loja Bella Moda: ConnectionError"`. Essas mensagens vêm **depois** das de validação, na ordem em que os clientes aparecem pela primeira vez no arquivo.
7. Devolva o `Resumo`.

Exemplo: um CSV com 6 linhas, em que a 2ª tem id `"abc"` e a 5ª prioridade `"altíssima"`, com 3 clientes distintos entre as válidas, e uma API que falha de vez para um deles:

```python
Resumo(
    total_validos=4,
    total_descartados=2,
    por_prioridade={"baixa": 1, "media": 0, "alta": 2, "urgente": 1},
    clientes_enriquecidos=2,
    erros=["linha 2: id", "linha 5: prioridade", "cliente Loja Bella Moda: ConnectionError"],
)
```

> ⚠️ Todo o arquivo precisa de type hints completos — inclusive funções internas.

### Como será avaliado

Os testes chamam `asyncio.run(processar(...))` com arquivos CSV temporários e com o `data/tickets_sujos.csv` real, passando APIs de mentira: umas respondem na hora, outras demoram, falham algumas vezes antes de funcionar, ou falham sempre. Eles também medem quantas consultas rodam ao mesmo tempo.

## Como testar no seu computador

Crie um arquivo `testar_pipeline.py` na pasta `suporte-inteligente` com:

```python
import asyncio
import random

from suporte.pipeline import processar
from suporte.resiliencia import ErroTemporario


async def crm_de_mentira(nome: str) -> dict:
    await asyncio.sleep(random.uniform(0.05, 0.3))
    if random.random() < 0.3:
        raise ErroTemporario("CRM instável")
    return {"cliente": nome, "plano": random.choice(["basico", "pro", "enterprise"])}


resumo = asyncio.run(processar("data/tickets_sujos.csv", crm_de_mentira, limite=4))
print(resumo.model_dump_json(indent=2))
```

E rode no terminal (algumas vezes — a API de mentira é aleatória):

```bash
python testar_pipeline.py
```
