# 🧠 NeuroCorp — simulador de trabalho como Engenheiro(a) de IA

Você foi contratado(a) como **Estagiário(a) de IA** na NeuroCorp. O time te passa tickets, você resolve no VS Code, o **Tech Lead Bot** revisa seu código como num pull request, e cada trilha concluída é uma **promoção**. No fim, você terá construído o **Suporte Inteligente**: classificação de tickets, RAG e um agente de atendimento.

Tudo roda no seu computador, **de graça**, sem API paga.

```
neurocorp/
├── plataforma/            ← o site (Next.js). Você não precisa mexer aqui.
├── suporte-inteligente/   ← SEU repositório. Abra esta pasta no VS Code.
└── .venv/                 ← Python com pytest e ruff (criado pelo setup)
```

## Primeira vez

Pré-requisitos: **Node.js 20+**, **Python 3.11+** e **Git**.

```bash
cd plataforma
npm install
npm run setup
```

O `setup` cria o `.venv`, gera os dados fictícios em `suporte-inteligente/data/` e inicializa o Git do seu repositório. Pode rodar de novo sem medo, porque ele nunca sobrescreve o seu código.

## Dia a dia

1. Suba o site: `cd plataforma` e depois `npm run dev`. Abra **http://localhost:3000**.
2. No **Quadro**, arraste o próximo ticket para **Fazendo** (ou abra o ticket e clique em **Começar**). Os arquivos iniciais aparecem em `suporte-inteligente/`.
3. Abra `suporte-inteligente/` no VS Code (o link na página do ticket abre direto) e programe.
4. Clique em **Submeter para revisão** (ou `Ctrl+Enter`). Você também pode arrastar o card para **Revisão**, ou soltar seus arquivos `.py` na página.
5. Leia o code review. Os comentários aparecem **na linha do seu código**, com dicas progressivas.
6. Quando for aprovado, você ganha XP, libera a solução de referência e faz o commit sugerido.

Atalhos: `G` e depois `I` / `Q` / `T` / `C` levam a Início, Quadro, Trilhas e Carreira.

### XP e carreira

| Item | XP |
|---|---|
| Ticket aprovado | XP do ticket (50 a 300) |
| Aprovado de primeira | +20 |
| Sem nenhum aviso do linter | +10 |
| Sem abrir dicas | +10 |

O XP é contado só na primeira aprovação. O último ticket de cada trilha é um **Desafio de promoção**: nele o bot não dá dicas.

## Como a correção funciona

Ao submeter, o site copia sua pasta para um diretório temporário e roda quatro etapas:

1. **Análise estática** (`grader-py/analisar.py`): sintaxe, funções definidas e regras do ticket, como "não use pandas" ou "use `csv`".
2. **Testes ocultos** (pytest) da pasta `tests/` do ticket.
3. **Linter** (ruff), com mensagens traduzidas. Ele dá sugestões, mas não reprova.
4. **Tech Lead Bot** (`lib/server/revisor.ts`): junta tudo num review com comentários por linha e dicas do `hints.yaml`.

Seu código nunca é alterado pela correção.

## Trilhas

As trilhas seguem o plano de estudos por fases. Os detalhes (tópicos e projetos) estão em `plataforma/content/roadmap.yaml` e no mapa de trilhas do site.

| # | Trilha | Fase | Período | Promoção | Status |
|---|---|---|---|---|---|
| 1 | Python Básico (11 tickets) | 0 · Base Python | nov/2026 | Desenvolvedor(a) Júnior | ✅ pronta |
| 2 | Python Idiomático | 0 · Base Python | nov – dez/2026 | Desenvolvedor(a) Júnior II | em breve |
| 3 | Dados, API e Docker (Projeto 0) | 0 · Base Python | dez/2026 | Eng. de IA Júnior | em breve |
| 4 | LLMs por Dentro | 1 | dez/2026 | Eng. de IA Júnior II | em breve |
| 5 | APIs, Prompts e Contexto (Projeto 1) | 2 | jan – fev/2027 | Eng. de IA Pleno I | em breve |
| 6 | RAG de Produção (Projeto 2) | 3 | mar – abr/2027 | Eng. de IA Pleno II | em breve |
| 7 | Agentes e MCP | 4 | mai/2027 | Eng. de IA Pleno III | em breve |
| 8 | Segurança, Avaliação e Observabilidade (Projeto 3) | 5 | jun/2027 | Eng. de IA Sênior I | em breve |
| ◆ | **Marco: começar a se candidatar** | | fim de jun/2027 | | |
| 9 | Produção e Plataforma (Projeto final) | 6 | jul – ago/2027 | Eng. de IA Sênior II | em breve |
| 10 | Aprofundamento | 7 | set/2027 em diante | Arquiteto(a) de IA | em breve |

## Criando tickets e trilhas novas

O site lê tudo de `plataforma/content/`. Para adicionar uma trilha, crie uma pasta com `trilha.yaml` e remova a trilha correspondente de `content/roadmap.yaml`. Cada ticket é uma pasta:

```
content/t02-python-intermediario/
├── trilha.yaml                  # id, ordem, titulo, descricao, cargoAoConcluir, cor, tickets: [...]
└── T012-classe-ticket/
    ├── meta.yaml                # id, titulo, tipo, prioridade, solicitante, xp, arquivos, criterios, checagens...
    ├── ticket.md                # Contexto / O que fazer / Como testar
    ├── hints.yaml               # nome_do_teste: { titulo, dicas: [...], alvo: {arquivo, funcao} }
    ├── tests/test_t012.py       # testes ocultos (importe a função DENTRO de cada teste)
    ├── iniciais/suporte/...     # arquivos que o aluno recebe ao começar
    └── solucao/suporte/...      # solução de referência
```

Use `content/t01-python-basico/T001-boas-vindas/` como modelo. Depois valide:

```bash
npm run checar   # a solução tem que passar em tudo e os arquivos iniciais têm que falhar em tudo
```

## Comandos (dentro de `plataforma/`)

| Comando | O que faz |
|---|---|
| `npm run dev` | sobe o site em http://localhost:3000 |
| `npm run setup` | prepara `.venv` e `suporte-inteligente/` |
| `npm run checar` | valida o conteúdo de todas as trilhas |
| `npm test` | testes do Tech Lead Bot (Vitest) |

O progresso (XP, tickets e histórico de revisões) fica em `suporte-inteligente/.neurocorp/`, dentro do **seu** repositório. Por isso ele vai junto em cada `git push`. Para recomeçar, use **Carreira → Reiniciar progresso**: isso não apaga o seu código.

## Continuar em outro computador

Antes de trocar de máquina, dentro de `suporte-inteligente`:

```bash
git add -A && git commit -m "progresso" && git push
```

No outro computador (precisa de Node.js 20+, Python 3.11+ e Git):

```bash
git clone https://github.com/edusoliveira/neurocorp.git
cd neurocorp
git clone https://github.com/edusoliveira/suporte-inteligente.git
cd plataforma
npm install
npm run setup
npm run dev
```

Ao voltar para a máquina anterior, rode `git pull` nas duas pastas antes de continuar.
