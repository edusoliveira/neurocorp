## Contexto

> "Medimos a API do CRM por uma semana: 3% das chamadas falham com erro de conexão e 1% simplesmente trava, sem nunca responder. Quase sempre, tentar de novo funciona. Quero uma peça reutilizável que envolva **qualquer** chamada assíncrona com timeout e novas tentativas — e que não fique martelando a API: entre uma tentativa e outra, espera um pouco mais a cada vez." — Marina, Tech Lead de IA

Três ideias novas:

**Timeout com `asyncio.wait_for`** — espera uma corrotina por no máximo N segundos; se passar disso, cancela e levanta `TimeoutError`:

```python
await asyncio.wait_for(consultar("Padaria"), timeout=1.0)
```

**Backoff exponencial** — esperar cada vez mais entre as tentativas: 0,1 s, 0,2 s, 0,4 s... (`espera_base * 2**n`). Assim, se o serviço está sobrecarregado, a gente alivia em vez de piorar.

**Só repetir o que é temporário** — erro de conexão e timeout costumam passar sozinhos; um `ValueError` (dado errado) vai falhar igual na segunda vez, então repetir só desperdiça tempo.

E um detalhe de tipos: `com_retry` funciona com funções que devolvem **qualquer** tipo, e devolve o **mesmo** tipo. Isso é um **genérico**, e no Python 3.12+ se escreve com colchetes depois do nome da função:

```python
async def com_retry[T](funcao: Callable[[], Awaitable[T]], ...) -> T:
```

> 💡 **Vindo do C#:** `async def com_retry[T](...) -> T` é o `async Task<T> ComRetry<T>(Func<Task<T>> funcao, ...)`. O `asyncio.wait_for(..., timeout)` faz o papel do `task.WaitAsync(TimeSpan)` (ou de um `CancellationTokenSource` com `CancelAfter`). E o que você vai construir aqui é, em miniatura, uma política de retry do **Polly** (`WaitAndRetryAsync` com backoff exponencial, tratando só exceções transitórias). `ErroTemporario(Exception)` é uma exceção customizada como `class ErroTemporario : Exception`.

## O que fazer

Crie o arquivo `suporte/resiliencia.py` com:

### 1. `class ErroTemporario(Exception)`

Uma exceção para os serviços sinalizarem "falhei, mas tente de novo". O corpo pode ser só uma docstring. Ela já vem pronta no arquivo inicial — o comentário `# noqa: N818` desliga, só nessa linha, a regra do ruff que pede que exceções terminem em `Error` (aqui os nomes são em português).

### 2. `com_retry`

```python
async def com_retry[T](
    funcao: Callable[[], Awaitable[T]],
    tentativas: int = 3,
    timeout: float = 1.0,
    espera_base: float = 0.1,
) -> T:
```

- `funcao` é uma função **sem argumentos** que devolve algo aguardável. Chame `funcao()` **de novo a cada tentativa** (uma corrotina só pode ser aguardada uma vez!). Para passar argumentos, quem chama usa `lambda` ou `functools.partial`: `await com_retry(lambda: consultar("Padaria"))`.
- Cada tentativa é aguardada com `asyncio.wait_for(funcao(), timeout)`.
- Se a tentativa der certo, devolva o resultado.
- Se ela levantar `TimeoutError`, `ConnectionError` ou `ErroTemporario`:
  - se ainda sobram tentativas, espere `espera_base * 2**n` segundos (com `await asyncio.sleep(...)`) e tente de novo — `n` começa em 0: depois da 1ª falha espera `espera_base`, depois da 2ª, `espera_base * 2`, depois da 3ª, `espera_base * 4`...;
  - se era a última tentativa, **levante a própria exceção** dessa última tentativa (um `raise` sozinho dentro do `except` faz isso). Não espere depois da última.
- Qualquer **outra** exceção sobe **imediatamente**, sem nova tentativa.
- `tentativas` menor que 1 → `ValueError`.

Exemplo, com uma função que falha 2 vezes e depois funciona, `tentativas=3`, `espera_base=0.1`:

```
tentativa 1: ConnectionError  -> espera 0,1 s
tentativa 2: ErroTemporario   -> espera 0,2 s
tentativa 3: ok               -> devolve o resultado
```

> 💡 Agrupe as exceções que valem nova tentativa numa tupla, ex.: `ERROS_TEMPORARIOS = (TimeoutError, ConnectionError, ErroTemporario)`, e use `except ERROS_TEMPORARIOS:`.

## Como testar no seu computador

Crie um arquivo `testar_retry.py` na pasta `suporte-inteligente` com:

```python
import asyncio

from suporte.resiliencia import ErroTemporario, com_retry

falhas = 2


async def api_instavel() -> str:
    global falhas
    if falhas > 0:
        falhas -= 1
        print("falhou!")
        raise ErroTemporario("CRM fora do ar")
    return "dados do cliente"


async def api_travada() -> str:
    await asyncio.sleep(60)
    return "nunca chega aqui"


print(asyncio.run(com_retry(api_instavel)))
try:
    asyncio.run(com_retry(api_travada, tentativas=2, timeout=0.5))
except TimeoutError:
    print("desistiu depois de 2 timeouts")
```

E rode no terminal:

```bash
python testar_retry.py
```
