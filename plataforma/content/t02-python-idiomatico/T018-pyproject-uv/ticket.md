## Contexto

> "Hoje o projeto não diz em lugar nenhum que precisa do Pydantic, que os testes rodam com pytest, nem qual versão do Python usar. Cada pessoa descobre na tentativa e erro. No Python moderno, tudo isso fica num arquivo só, o `pyproject.toml`, e quem cuida do ambiente é o **uv**." — Carlos, CTO

O **`pyproject.toml`** é o arquivo padrão que descreve um projeto Python: nome, versão, versão do Python, dependências e a configuração das ferramentas (ruff, pytest...). Ele é escrito em **TOML**, um formato de configuração simples:

```toml
[tabela]                 # uma seção
chave = "texto"
numero = 120
lista = ["a", "b"]

[tabela.subtabela]       # seção dentro de seção
outra = true
```

O **uv** é o gerenciador de projetos Python mais usado hoje: cria o ambiente virtual, instala as dependências (muito rápido) e mantém o `pyproject.toml` atualizado por você.

> 💡 **Vindo do C#:** o `pyproject.toml` é o seu **`.csproj`**: `[project]` são as propriedades (`<AssemblyName>`, `<Version>`, `<TargetFramework>` ↔ `requires-python`), `dependencies` são os `<PackageReference>`, e o grupo `dev` é como marcar pacotes de desenvolvimento (`PrivateAssets="all"`). O **uv** faz o papel do `dotnet` CLI + NuGet: `uv add pydantic` ≈ `dotnet add package`, `uv sync` ≈ `dotnet restore`, `uv run` ≈ `dotnet run`. E o `uv.lock` que ele gera é o `packages.lock.json`.

## O que fazer

Crie o arquivo **`pyproject.toml` na raiz do projeto** (na pasta `suporte-inteligente`, ao lado de `suporte/` e `data/`).

### Opção A — com o uv (recomendado)

1. Instale o uv (uma vez só): `pip install uv` ou, no Windows, `winget install astral-sh.uv`.
2. Na pasta `suporte-inteligente`, apague o `pyproject.toml` inicial (ele só tem um comentário) e rode:

```bash
uv init --bare --name suporte-inteligente
uv add pydantic
uv add --dev pytest ruff
```

- `uv init --bare` cria só o `pyproject.toml` (sem arquivos de exemplo);
- `uv add pydantic` coloca o pydantic em `dependencies` e instala num `.venv` do projeto;
- `uv add --dev` coloca pytest e ruff no grupo `dev`, em `[dependency-groups]`.

3. Abra o arquivo e complete à mão o que falta (veja a lista abaixo): `[tool.ruff]` e `[project.scripts]`.

### Opção B — à mão

Escreva o arquivo direto no editor seguindo a lista abaixo. Vale igual.

### O que o arquivo precisa ter

| Onde | O quê |
|---|---|
| `[project]` | `name = "suporte-inteligente"` |
| `[project]` | `version` (um texto, ex.: `"0.1.0"`) |
| `[project]` | `requires-python` no formato `">=3.12"` — pode ser uma versão mais nova (o `uv init` costuma escrever a sua, ex.: `">=3.14"`) |
| `[project]` | `dependencies` contendo `pydantic` (com ou sem versão, ex.: `"pydantic>=2.7"`) |
| `[dependency-groups]` | `dev` contendo `pytest` e `ruff` |
| `[tool.ruff]` | `line-length` com um número inteiro (ex.: `120`) |
| `[project.scripts]` | `suporte = "suporte.__main__:main"` |

A seção `[project.scripts]` declara um **comando** chamado `suporte` que executa a função `main` do `suporte/__main__.py` (a do T011). Ele vira um comando de terminal de verdade quando o projeto é instalado como pacote — vamos fazer isso mais pra frente; por enquanto continue usando `python -m suporte` (ou `uv run python -m suporte`).

> ⚠️ Os testes leem o arquivo com o `tomllib` da biblioteca padrão. Um erro de sintaxe no TOML (aspas faltando, por exemplo) faz todos falharem — confira a mensagem.

## Como testar no seu computador

Na pasta `suporte-inteligente`, rode:

```bash
python -c "import tomllib; print(tomllib.load(open('pyproject.toml', 'rb'))['project'])"
```

Se instalou o uv, teste também:

```bash
uv run python -m pytest tests/test_prioridade.py
uv run ruff check suporte
```
