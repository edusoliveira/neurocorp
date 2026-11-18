"""Gera os dados fictícios de tickets de suporte da NeuroCorp.

Uso: python gerar_dados.py <pasta_destino>
Cria <pasta_destino>/tickets.csv (limpo) e <pasta_destino>/tickets_sujos.csv (com problemas).
Os dados são determinísticos (seed fixa), então todo mundo tem o mesmo arquivo.
"""

from __future__ import annotations

import csv
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

COLUNAS = [
    "id",
    "cliente",
    "categoria",
    "prioridade",
    "status",
    "canal",
    "aberto_em",
    "fechado_em",
    "assunto",
]

CATEGORIAS = {
    "cobranca": [
        "Cobrança em duplicidade no cartão",
        "Boleto não foi gerado",
        "Quero cancelar minha assinatura",
        "Valor da fatura veio errado",
        "Reembolso ainda não caiu",
    ],
    "tecnico": [
        "App não abre depois da atualização",
        "Sistema parado, não funciona nada",
        "Erro 500 ao salvar relatório",
        "Integração com a API está lenta",
        "Não consigo exportar para Excel",
    ],
    "conta": [
        "Esqueci minha senha",
        "Quero trocar o e-mail da conta",
        "Conta bloqueada após várias tentativas",
        "Como adicionar um novo usuário?",
        "Preciso mudar o plano da empresa",
    ],
    "entrega": [
        "Pedido atrasado há 5 dias",
        "Produto chegou com defeito",
        "Código de rastreio não funciona",
        "Entrega feita no endereço errado",
        "Quero trocar o produto",
    ],
}

PRIORIDADES = ["baixa", "media", "alta", "urgente"]
PESOS_PRIORIDADE = [35, 35, 20, 10]
CANAIS = ["email", "chat", "telefone"]
CLIENTES = [
    "Padaria Pão Quente", "Loja Bella Moda", "TechNova Sistemas", "Clínica Vida Plena",
    "Mercado Bom Preço", "Academia Corpo Ativo", "Escola Saber Mais", "Pet Shop Amigo Fiel",
    "Construtora Alicerce", "Restaurante Sabor Caseiro", "Farmácia Saúde Já", "Auto Peças Rápido",
    "Livraria Página 1", "Hotel Recanto Azul", "Studio Foto Arte", "Ótica Visão Clara",
]


def gerar_tickets(quantidade: int = 240) -> list[dict]:
    aleatorio = random.Random(42)
    inicio = datetime(2026, 11, 3, 8, 0)
    tickets = []
    for numero in range(1, quantidade + 1):
        categoria = aleatorio.choice(list(CATEGORIAS))
        aberto = inicio + timedelta(minutes=aleatorio.randint(0, 60 * 24 * 7))
        status = aleatorio.choices(["aberto", "em_andamento", "fechado"], [25, 15, 60])[0]
        fechado = ""
        if status == "fechado":
            fechado = (aberto + timedelta(minutes=aleatorio.randint(15, 60 * 30))).isoformat(timespec="minutes")
        tickets.append(
            {
                "id": numero,
                "cliente": aleatorio.choice(CLIENTES),
                "categoria": categoria,
                "prioridade": aleatorio.choices(PRIORIDADES, PESOS_PRIORIDADE)[0],
                "status": status,
                "canal": aleatorio.choice(CANAIS),
                "aberto_em": aberto.isoformat(timespec="minutes"),
                "fechado_em": fechado,
                "assunto": aleatorio.choice(CATEGORIAS[categoria]),
            }
        )
    tickets.sort(key=lambda t: t["aberto_em"])
    for novo_id, ticket in enumerate(tickets, start=1):
        ticket["id"] = novo_id
    return tickets


def sujar(tickets: list[dict]) -> list[dict]:
    """Copia alguns tickets e estraga de propósito (para o ticket de dados sujos)."""
    sujos = [dict(t) for t in tickets[:40]]
    sujos[3]["id"] = "abc"
    sujos[7]["categoria"] = ""
    sujos[11]["prioridade"] = "altíssima"
    sujos[15]["assunto"] = "   pedido    ATRASADO   "
    sujos[19]["id"] = ""
    sujos[23]["prioridade"] = " ALTA "
    sujos[27]["categoria"] = "  Tecnico "
    return sujos


def salvar(caminho: Path, linhas: list[dict]) -> None:
    with caminho.open("w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        escritor.writerows(linhas)


def main() -> None:
    destino = Path(sys.argv[1] if len(sys.argv) > 1 else "data")
    destino.mkdir(parents=True, exist_ok=True)
    tickets = gerar_tickets()
    salvar(destino / "tickets.csv", tickets)
    salvar(destino / "tickets_sujos.csv", sujar(tickets))
    print(f"Gerados {len(tickets)} tickets em {destino / 'tickets.csv'}")


if __name__ == "__main__":
    main()
