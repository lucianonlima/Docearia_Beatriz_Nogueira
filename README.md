# Doceria Casa Amora

Site de uma doceria com cardápio, carrinho de pedidos (finalizado pelo WhatsApp), avaliações de clientes e chat de atendimento. O backend é feito em Flask.

## Funcionalidades

- **Cardápio** com filtro por categoria
- **Carrinho** com quantidades e total; o pedido é enviado pelo WhatsApp
- **Avaliações** com nota de 1 a 5 e nota média
- **Chat** (Amora) com respostas sobre cardápio, preços, horário, entrega, pagamento e encomendas

## Estrutura do projeto

```
DOCERIA-CASA-AMORA/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│   └── index.html
└── data/
    ├── avaliacoes.json
    └── pedidos.json
```

A pasta `data/` e os arquivos dela são criados automaticamente pelo `app.py`.

## Como executar

1. Crie e ative um ambiente virtual (opcional, mas recomendado):

   ```bash
   python -m venv .venv
   source .venv/bin/activate      # Windows: .venv\Scripts\activate
   ```

2. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

3. Inicie o servidor:

   ```bash
   python app.py
   ```

4. Abra http://127.0.0.1:5000 no navegador.

## Configuração

No início do `app.py`, altere:

- `WHATSAPP`: número da doceria com DDI e DDD (ex.: `5515999999999`)
- `PRODUTOS`: nomes, descrições e preços do cardápio
- `RESPOSTAS_CHAT`: perguntas e respostas do chat

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/produtos` | Lista o cardápio |
| GET | `/api/avaliacoes` | Lista avaliações, total e média |
| POST | `/api/avaliacoes` | Cria avaliação (`nome`, `nota`, `texto`) |
| POST | `/api/pedidos` | Cria pedido (`cliente`, `entrega`, `itens`) e devolve o link do WhatsApp |
| POST | `/api/chat` | Responde a uma mensagem (`mensagem`) |

O total do pedido é sempre calculado no servidor, com os preços do cardápio.

## Dados

Avaliações e pedidos ficam em arquivos JSON dentro de `data/`. Esses arquivos contêm dados de clientes e não devem ser enviados ao Git.

## Publicação

O servidor embutido do Flask serve apenas para desenvolvimento. Em produção, use um servidor como o Gunicorn (`pip install gunicorn` e `gunicorn app:app`) e desligue o `debug`.
