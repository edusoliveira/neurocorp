## Contexto

> "Olha só alguns assuntos que chegaram ontem: `'   APP NÃO ABRE  '`, `'erro    500 ao salvar'`, `'Sistema PARADO'`. Fica impossível de ler a fila! Também quero um alerta automático: se o assunto tiver palavras como 'parado' ou 'urgente', o ticket precisa chamar a atenção." — Júlia, Coordenadora de Suporte

Textos em Python (`str`) têm vários **métodos** prontos: `.strip()`, `.lower()`, `.upper()`, `.capitalize()`, `.split()`... e o operador `in` diz se um pedaço de texto aparece dentro de outro.

## O que fazer

No arquivo `suporte/texto.py`, complete as duas funções.

### `normalizar_assunto(texto)`

Devolve o texto padronizado:

1. sem espaços no começo e no fim;
2. com os espaços repetidos no meio trocados por **um único** espaço;
3. com a **primeira letra maiúscula** e todo o resto **minúsculo**.

| Chamada | Resultado |
|---|---|
| `normalizar_assunto("  Esqueci minha senha  ")` | `"Esqueci minha senha"` |
| `normalizar_assunto("erro    500 ao   salvar")` | `"Erro 500 ao salvar"` |
| `normalizar_assunto("APP NÃO ABRE")` | `"App não abre"` |
| `normalizar_assunto("   pedido    ATRASADO   ")` | `"Pedido atrasado"` |
| `normalizar_assunto("")` | `""` |

> 💡 `texto.split()` (sem nada dentro dos parênteses) quebra o texto nos espaços e **ignora** espaços repetidos. Depois, `" ".join(lista)` junta as palavras de volta com um espaço só.

### `parece_urgente(texto)`

Devolve `True` se o texto contém **pelo menos uma** destas palavras-chave, e `False` caso contrário:

```python
PALAVRAS_URGENTES = ["urgente", "parado", "fora do ar", "não funciona", "bloqueada"]
```

A comparação **não liga para maiúsculas/minúsculas**: `"SISTEMA PARADO"` é urgente. A palavra-chave pode aparecer em qualquer parte do texto (inclusive dentro de outra palavra — basta usar `in`).

| Chamada | Resultado |
|---|---|
| `parece_urgente("Sistema parado, não funciona nada")` | `True` |
| `parece_urgente("SITE FORA DO AR")` | `True` |
| `parece_urgente("Conta Bloqueada após várias tentativas")` | `True` |
| `parece_urgente("URGENTE: boleto")` | `True` |
| `parece_urgente("Esqueci minha senha")` | `False` |
| `parece_urgente("")` | `False` |

A função deve devolver exatamente `True` ou `False` (booleanos), não textos.

## Como testar no seu computador

Crie um arquivo `testar_texto.py` na pasta `suporte-inteligente` com:

```python
from suporte.texto import normalizar_assunto, parece_urgente

print(repr(normalizar_assunto("   pedido    ATRASADO   ")))  # 'Pedido atrasado'
print(parece_urgente("SITE FORA DO AR"))                     # True
print(parece_urgente("Esqueci minha senha"))                 # False
```

E rode no terminal:

```bash
python testar_texto.py
```
