## Contexto

> "Para cada cliente dos tickets, a gente consulta a API do CRM (plano, gerente da conta, se é VIP). Cada consulta demora uns 200 ms, quase tudo **esperando a rede**. Com 16 clientes, um por vez, são mais de 3 segundos; com os 5 mil clientes do contrato novo, quase 17 minutos. Quero as consultas em paralelo — mas a API do CRM bloqueia quem faz mais de 5 chamadas ao mesmo tempo." — Rafael, Product Manager

Quando o programa passa a maior parte do tempo **esperando** (rede, disco, API), o `asyncio` deixa várias esperas acontecerem ao mesmo tempo numa única thread:

```python
import asyncio


async def consultar(nome: str) -> dict:     # "async def" cria uma corrotina
    await asyncio.sleep(0.2)                 # "await" = espere isto, e enquanto isso rode outras coisas
    return {"cliente": nome}


async def principal() -> None:
    # gather dispara as três e espera todas: leva ~0,2 s, não 0,6 s
    resultados = await asyncio.gather(consultar("A"), consultar("B"), consultar("C"))
    print(resultados)                        # na mesma ordem dos argumentos


asyncio.run(principal())                     # ponto de entrada: roda o loop de eventos
```

Para **limitar** quantas rodam ao mesmo tempo, usa-se um **semáforo**: um contador de "vagas". Quem entra no `async with semaforo:` ocupa uma vaga; se não há vaga, espera alguém sair.

```python
semaforo = asyncio.Semaphore(5)    # no máximo 5 ao mesmo tempo

async def consultar_com_vaga(nome: str) -> dict:
    async with semaforo:
        return await consultar(nome)
```

Nos type hints, uma função que recebe um texto e devolve algo que se pode aguardar (`await`) é `Callable[[str], Awaitable[dict[str, Any]]]` (`Callable` e `Awaitable` vêm de `collections.abc`).

> 💡 **Vindo do C#:** é o mesmo modelo que você já conhece: `async def` ≈ `async Task<T>`, `await` ≈ `await`, `asyncio.gather(...)` ≈ `await Task.WhenAll(...)` e `asyncio.Semaphore` ≈ `SemaphoreSlim` (com `async with` no lugar de `await WaitAsync()` + `try/finally Release()`). Duas diferenças: chamar uma corrotina **não** a inicia (ela só roda quando é aguardada ou passada ao `gather` — diferente de uma `Task` "quente"), e o programa precisa de um ponto de entrada explícito, o `asyncio.run(...)`.

> 🤖 **Por que isso importa:** chamar a API de um modelo de linguagem (LLM) é exatamente isso — uma chamada lenta de rede, com limite de requisições simultâneas. O padrão `gather` + `Semaphore` deste ticket é o mesmo que vamos usar para classificar milhares de tickets com IA.

## O que fazer

Crie o arquivo `suporte/enriquecimento.py` com a função:

```python
async def enriquecer_todos(
    nomes: list[str],
    consultar: Callable[[str], Awaitable[dict[str, Any]]],
    limite: int,
) -> dict[str, dict[str, Any]]:
```

- `nomes`: os nomes dos clientes;
- `consultar`: uma função **assíncrona** que recebe um nome e devolve um dicionário com os dados do cliente (nos testes é uma API de mentira; você só chama `await consultar(nome)`);
- `limite`: quantas consultas podem estar em andamento **ao mesmo tempo**.

Regras:

1. devolva um dicionário `{nome: resultado de consultar(nome)}`;
2. as consultas devem rodar **concorrentemente** (com `asyncio.gather`), mas **nunca mais de `limite` ao mesmo tempo** (com `asyncio.Semaphore(limite)`);
3. **nomes repetidos** são consultados **uma vez só** (dica: `dict.fromkeys(nomes)` remove repetidos mantendo a ordem);
4. lista vazia → `{}`;
5. `limite` menor que 1 → `ValueError`;
6. se alguma consulta levantar uma exceção, deixe ela subir (o tratamento de falhas é o próximo ticket).

> 💡 Crie o semáforo **dentro** da função (cada chamada tem o seu) e uma corrotina interna que usa o `async with semaforo:` em volta do `await consultar(nome)`. Ela também precisa de type hints.

## Como testar no seu computador

Crie um arquivo `testar_async.py` na pasta `suporte-inteligente` com:

```python
import asyncio
import time

from suporte.enriquecimento import enriquecer_todos


async def api_lenta(nome: str) -> dict:
    await asyncio.sleep(0.2)
    return {"cliente": nome, "plano": "pro"}


nomes = [f"Cliente {i}" for i in range(20)]
for limite in [1, 5, 20]:
    inicio = time.perf_counter()
    resultado = asyncio.run(enriquecer_todos(nomes, api_lenta, limite))
    print(f"limite {limite:>2}: {len(resultado)} clientes em {time.perf_counter() - inicio:.2f} s")
```

E rode no terminal:

```bash
python testar_async.py
```

Com limite 1 deve levar uns 4 s; com limite 5, ~0,8 s; com limite 20, ~0,2 s.
