# NeuroCorp · plataforma

O site do simulador (Next.js + Tailwind + shadcn/ui + Motion). A documentação completa está no [README da raiz](../README.md).

```bash
npm install
npm run setup   # primeira vez
npm run dev     # http://localhost:3000
```

Mapa rápido do código:

- `content/`: trilhas, tickets, personas e roadmap (YAML + Markdown + testes Python)
- `grader-py/`: plugin do pytest e análise AST usados na correção
- `lib/server/`: conteúdo, progresso (JSON em `.data/`), corretor e revisor
- `app/`: páginas (`/`, `/quadro`, `/ticket/[id]`, `/review/[id]`, `/trilhas`, `/carreira`) e rotas `/api/*`
- `components/app/`: Kanban, review com comentários inline, celebração, sidebar
