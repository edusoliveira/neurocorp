## Contexto

> "O time de operações quer gerar o relatório diário sem abrir editor nem escrever script: só um comando no terminal, que pode até ser agendado para rodar sozinho toda manhã. Você já tem todas as peças — leitura com limpeza, contagens, taxa, JSON. O desafio é montar a ferramenta final, robusta, com mensagens claras quando algo dá errado. Este é o seu desafio de promoção: **sem dicas do Tech Lead Bot**." — Carlos, CTO

Quando uma pasta de pacote (como `suporte/`) tem um arquivo `__main__.py`, ela pode ser executada com `python -m suporte`. Os argumentos digitados depois do comando chegam ao programa e podem ser lidos com o módulo `argparse`.

## O que fazer

Crie o arquivo `suporte/__main__.py` com uma função `main(argv=None)` que devolve um **número inteiro** (o código de saída do programa: `0` = deu certo, `1` = deu erro). No fim do arquivo, deixe:

```python
if __name__ == "__main__":
    raise SystemExit(main())
```

### O comando

```bash
python -m suporte relatorio <caminho_do_csv> --saida <caminho_do_json>
```

- `relatorio` é o subcomando (por enquanto o único);
- `<caminho_do_csv>` é obrigatório;
- `--saida` é obrigatório e diz onde gravar o JSON.

Use `argparse` e passe `argv` para o `parse_args(argv)`, assim os testes podem chamar `main(["relatorio", "data/tickets.csv", "--saida", "saida.json"])` direto, sem terminal. (Quando `argv` é `None`, o argparse lê os argumentos reais do terminal.)

### Quando dá certo

1. Carregue o CSV com `carregar_tickets_limpos` (T009) — linhas inválidas são descartadas;
2. gere o relatório com `gerar_relatorio` (T010), usando só os tickets válidos;
3. grave com `salvar_relatorio` (T010) no caminho de `--saida`;
4. imprima (no `stdout`, com `print`) **exatamente** estas 5 linhas:

```
Relatório salvo em <caminho_do_json>
Total de tickets: <total>
Abertos: <abertos>
Taxa de resolução: <taxa_resolucao>%
Linhas descartadas: <quantidade_descartada>
```

- `<caminho_do_json>` é o texto passado em `--saida`, do jeito que foi digitado;
- `<total>`, `<abertos>` e `<taxa_resolucao>` vêm do relatório; a taxa aparece como o Python imprime um float (ex.: `62.5%`, `0.0%`);
- `<quantidade_descartada>` vem de `carregar_tickets_limpos`.

5. devolva `0`.

Exemplo, com um CSV de 4 linhas em que 1 tem id inválido e, das 3 válidas, 1 está fechada:

```
Relatório salvo em saida.json
Total de tickets: 3
Abertos: 2
Taxa de resolução: 33.3%
Linhas descartadas: 1
```

### Quando o CSV não existe

Se o arquivo `<caminho_do_csv>` não existir:

- imprima no **stderr** (`print(..., file=sys.stderr)`) a mensagem `Erro: arquivo não encontrado: <caminho_do_csv>`;
- **não** crie o arquivo de saída e não imprima nada no stdout;
- devolva `1` — sem deixar aparecer um traceback.

### Como será avaliado

Os testes chamam `main([...])` diretamente com arquivos CSV temporários, e também rodam o comando de verdade (`python -m suporte relatorio data/tickets.csv --saida ...`) a partir da pasta `suporte-inteligente`, conferindo o JSON gerado com o arquivo `data/tickets.csv` real.

## Como testar no seu computador

Na pasta `suporte-inteligente`, rode:

```bash
python -m suporte relatorio data/tickets.csv --saida relatorio.json
python -m suporte relatorio data/tickets_sujos.csv --saida relatorio_sujos.json
python -m suporte relatorio nao_existe.csv --saida x.json
```

O primeiro deve mostrar `Linhas descartadas: 0`, o segundo `Linhas descartadas: 4`, e o terceiro a mensagem de erro.
