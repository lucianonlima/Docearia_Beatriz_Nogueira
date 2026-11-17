"""Backend da Doceria Casa Amora (Flask).

Rodar:  pip install flask   e depois   python app.py
Estrutura esperada:
    app.py
    templates/index.html   (o arquivo doceria.html renomeado)
    data/                  (criada automaticamente)
"""
import json
import re
from datetime import datetime
from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, render_template, request

BASE = Path(__file__).parent
DATA = BASE / "data"
DATA.mkdir(exist_ok=True)
REVIEWS_FILE = DATA / "avaliacoes.json"
ORDERS_FILE = DATA / "pedidos.json"

WHATSAPP = "5515999999999"  # troque pelo número da doceria (DDI + DDD + número)

PRODUTOS = [
    {"id": 1, "nome": "Brigadeiro gourmet (6 un.)", "categoria": "Brigadeiros", "preco": 24.0, "emoji": "🍫", "descricao": "Chocolate belga, feito na panela."},
    {"id": 2, "nome": "Beijinho de coco (6 un.)", "categoria": "Brigadeiros", "preco": 22.0, "emoji": "🥥", "descricao": "Coco fresco e cravo."},
    {"id": 3, "nome": "Bolo de pote de ninho", "categoria": "Bolos de pote", "preco": 14.0, "emoji": "🍯", "descricao": "Massa branca, creme de leite ninho e morango."},
    {"id": 4, "nome": "Bolo de pote de cenoura", "categoria": "Bolos de pote", "preco": 13.0, "emoji": "🥕", "descricao": "Cobertura de brigadeiro cremoso."},
    {"id": 5, "nome": "Torta de limão (fatia)", "categoria": "Tortas", "preco": 16.0, "emoji": "🍋", "descricao": "Base crocante e merengue maçaricado."},
    {"id": 6, "nome": "Cheesecake de frutas vermelhas", "categoria": "Tortas", "preco": 18.0, "emoji": "🍓", "descricao": "Calda caseira de morango e amora."},
    {"id": 7, "nome": "Cookies recheados (4 un.)", "categoria": "Biscoitos", "preco": 26.0, "emoji": "🍪", "descricao": "Gotas de chocolate e recheio de avelã."},
    {"id": 8, "nome": "Caixa de macarons (8 un.)", "categoria": "Biscoitos", "preco": 48.0, "emoji": "🧁", "descricao": "Sabores variados, sem corante artificial."},
]
POR_ID = {p["id"]: p for p in PRODUTOS}

AVALIACOES_INICIAIS = [
    {"nome": "Marina", "nota": 5, "texto": "O brigadeiro gourmet é o melhor que já comi. Chegou fresquinho!"},
    {"nome": "Carlos", "nota": 5, "texto": "Torta de limão perfeita, equilibrada e com merengue bem leve."},
    {"nome": "Paula", "nota": 4, "texto": "Bolo de pote delicioso, só achei que podia ter mais recheio."},
]

RESPOSTAS_CHAT = [
    (r"card[aá]pio|produto|doce|op[cç][oõ]es", "Temos brigadeiros, bolos de pote, tortas, cookies e macarons. Veja tudo na seção Cardápio."),
    (r"pre[cç]o|valor|quanto|custa", "Os preços vão de R$ 13 (bolo de pote) a R$ 48 (caixa de macarons)."),
    (r"hor[aá]rio|abre|fecha|funciona", "Abrimos de terça a domingo, das 9h às 19h."),
    (r"entreg|frete|retirar|buscar", "Você pode retirar na loja ou receber em casa. Escolha ao finalizar o pedido."),
    (r"pag|pix|cart[aã]o|dinheiro", "Aceitamos Pix, cartão e dinheiro. O pagamento é combinado pelo WhatsApp."),
    (r"encomenda|festa|anivers[aá]rio|evento", "Fazemos encomendas para festas com 3 dias de antecedência. Envie quantidade e data pelo WhatsApp."),
    (r"vegan|gl[uú]ten|lactose|alerg", "Temos opções sem lactose sob encomenda. Para alergias, fale conosco antes de pedir."),
    (r"\boi\b|ol[aá]|bom dia|boa tarde|boa noite", "Olá! Posso ajudar com cardápio, preços, horário, entrega ou encomendas."),
]

app = Flask(__name__)
lock = Lock()


def ler(arquivo, padrao):
    if not arquivo.exists():
        arquivo.write_text(json.dumps(padrao, ensure_ascii=False, indent=2), encoding="utf-8")
    return json.loads(arquivo.read_text(encoding="utf-8"))


def gravar(arquivo, dados):
    arquivo.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/produtos")
def listar_produtos():
    return jsonify(PRODUTOS)


# ---------- Avaliações ----------
@app.get("/api/avaliacoes")
def listar_avaliacoes():
    with lock:
        itens = ler(REVIEWS_FILE, AVALIACOES_INICIAIS)
    media = round(sum(i["nota"] for i in itens) / len(itens), 1) if itens else 0
    return jsonify({"media": media, "total": len(itens), "avaliacoes": itens})


@app.post("/api/avaliacoes")
def criar_avaliacao():
    d = request.get_json(force=True)
    nome = str(d.get("nome", "")).strip()[:40]
    texto = str(d.get("texto", "")).strip()[:300]
    try:
        nota = int(d.get("nota"))
    except (TypeError, ValueError):
        nota = 0
    if not nome or not texto or not 1 <= nota <= 5:
        return jsonify({"erro": "Informe nome, comentário e uma nota de 1 a 5."}), 400
    nova = {"nome": nome, "nota": nota, "texto": texto, "data": datetime.now().isoformat(timespec="seconds")}
    with lock:
        itens = ler(REVIEWS_FILE, AVALIACOES_INICIAIS)
        itens.insert(0, nova)
        gravar(REVIEWS_FILE, itens)
    return jsonify(nova), 201


# ---------- Pedidos ----------
@app.post("/api/pedidos")
def criar_pedido():
    d = request.get_json(force=True)
    itens, total = [], 0.0
    for it in d.get("itens", []):
        prod = POR_ID.get(it.get("id"))
        qtd = it.get("quantidade", 0)
        if not prod or not isinstance(qtd, int) or qtd < 1:
            return jsonify({"erro": "Item inválido no pedido."}), 400
        subtotal = prod["preco"] * qtd  # o preço vem do servidor, nunca do navegador
        itens.append({"produto": prod["nome"], "quantidade": qtd, "subtotal": subtotal})
        total += subtotal
    if not itens:
        return jsonify({"erro": "O carrinho está vazio."}), 400

    cliente = str(d.get("cliente", "")).strip()[:60] or "cliente"
    entrega = d.get("entrega") if d.get("entrega") in ("Retirar na loja", "Entrega em casa") else "Retirar na loja"

    with lock:
        pedidos = ler(ORDERS_FILE, [])
        pedido = {"numero": len(pedidos) + 1, "cliente": cliente, "entrega": entrega,
                  "itens": itens, "total": round(total, 2),
                  "criado_em": datetime.now().isoformat(timespec="seconds")}
        pedidos.append(pedido)
        gravar(ORDERS_FILE, pedidos)

    linhas = "\n".join(f"{i['quantidade']}x {i['produto']}" for i in itens)
    texto = f"Olá! Pedido #{pedido['numero']} de {cliente}:\n{linhas}\nTotal: R$ {total:.2f}\n{entrega}"
    pedido["whatsapp_url"] = f"https://wa.me/{WHATSAPP}?text=" + __import__("urllib.parse").parse.quote(texto)
    return jsonify(pedido), 201


# ---------- Chat ----------
@app.post("/api/chat")
def chat():
    msg = str(request.get_json(force=True).get("mensagem", "")).lower()
    for padrao, resposta in RESPOSTAS_CHAT:
        if re.search(padrao, msg):
            return jsonify({"resposta": resposta})
    return jsonify({"resposta": "Não entendi bem. Pergunte sobre cardápio, preços, horário, entrega ou encomendas."})


if __name__ == "__main__":
    app.run(debug=True)
