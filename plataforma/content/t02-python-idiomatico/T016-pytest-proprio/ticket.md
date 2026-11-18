## Contexto

> "A regra de prioridade do T003 decide quem é atendido primeiro — se ela quebrar, um cliente VIP com sistema parado fica na fila atrás de uma dúvida de senha. Até hoje ela só foi testada pelos testes ocultos do Tech Lead Bot. Quero testes **nossos**, dentro do projeto, que qualquer pessoa roda com um comando. E quero saber se eles são bons de verdade." — Marina, Tech Lead de IA

Relembrando a regra (arquivo `suporte/prioridade.py`, função `classificar_prioridade(horas_aberto, cliente_vip)`):

| Situação | Resultado |
|---|---|
| cliente VIP **e** aberto há **mais de** 2 horas | `"urgente"` |
| senão, aberto há **mais de** 24 horas | `"alta"` |
| senão, aberto há **mais de** 8 horas | `"media"` |
| qualquer outro caso | `"baixa"` |

### pytest em 1 minuto

O **pytest** procura arquivos `test_*.py` e, dentro deles, funções que começam com `test_`. Cada função é um teste; dentro dela você usa `assert` comum. Se o `assert` falhar, o pytest mostra o valor recebido.

```python
from suporte.prioridade import classificar_prioridade


def test_cliente_comum_recente_e_baixa():
    assert classificar_prioridade(1, False) == "baixa"
```

Para testar vários casos com a mesma estrutura, use `@pytest.mark.parametrize` (precisa de `import pytest`):

```python
import pytest


@pytest.mark.parametrize(("horas", "esperado"), [(1, "baixa"), (10, "media")])
def test_cliente_comum(horas, esperado):
    assert classificar_prioridade(horas, False) == esperado
```

### Como seus testes serão avaliados: testes de mutação 🧬

Não basta os testes passarem — um arquivo com `assert True` também passa. O Tech Lead Bot vai criar **mutantes**: cópias da regra com um bug pequeno de propósito (um `>` trocado por `>=`, uma condição removida...). Para cada mutante, ele roda **os seus testes**:

- se algum teste seu **falhar**, o mutante foi **pego** ✅ — seus testes protegem contra aquele bug;
- se todos passarem, o mutante **sobreviveu** ❌ — existe um bug que seus testes não percebem.

São 5 mutantes escondidos. A dica para pegar todos: teste os **valores-limite** (exatamente na fronteira de cada regra e logo depois dela) e as combinações com `cliente_vip`.

> 💡 **Vindo do C#:** o pytest é o **xUnit** do Python, só que sem cerimônia: nada de classe, `[Fact]` ou `Assert.Equal` — qualquer função `test_*` é um `[Fact]` e o `assert` puro faz o papel do `Assert.Equal` (com mensagem detalhada de graça). O `@pytest.mark.parametrize` é o `[Theory]` + `[InlineData(...)]`. E teste de mutação existe no .NET também: é o que o **Stryker.NET** faz.

## O que fazer

Escreva o arquivo `tests/test_prioridade.py` (a pasta `tests` fica na raiz do projeto, ao lado de `suporte/`):

1. importe a função: `from suporte.prioridade import classificar_prioridade`;
2. escreva **pelo menos 5 funções de teste** (nomes começando com `test_`; uma função com `parametrize` conta como uma);
3. os testes devem **passar** com a regra correta do T003;
4. e devem **pegar os 5 mutantes**.

Não mexa em `suporte/prioridade.py` — o Bot usa a regra original dele, não o seu arquivo.

> ⚠️ Teste o **comportamento** (o que a função devolve), não o código-fonte. Para cada fronteira (2h no VIP, 8h, 24h), pergunte: "o que acontece exatamente no limite? e um pouquinho depois?"

## Como testar no seu computador

Na pasta `suporte-inteligente`, rode:

```bash
python -m pytest tests/test_prioridade.py -v
```

O `-v` mostra cada teste com `PASSED`/`FAILED`. Quer brincar de mutante? Troque um `>` por `>=` em `suporte/prioridade.py`, rode de novo e veja se algum teste seu falha (depois desfaça a mudança!).
