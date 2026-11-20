/* ============ DADOS: lista de produtos ============ */
const produtos = [
  { id: 1, nome: "Bolo de Chocolate Belga", cat: "bolos", preco: 95, emoji: "🍫", desc: "Recheio cremoso, 1 kg" },
  { id: 2, nome: "Bolo Decorado Personalizado", cat: "bolos", preco: 160, emoji: "🎂", desc: "Tema à sua escolha, 2 kg" },
  { id: 3, nome: "Naked Cake de Frutas", cat: "bolos", preco: 120, emoji: "🍓", desc: "Morango e chantilly, 1,5 kg" },
  { id: 4, nome: "Brigadeiros Gourmet (cento)", cat: "docinhos", preco: 120, emoji: "🍬", desc: "100 unidades" },
  { id: 5, nome: "Beijinhos (cento)", cat: "docinhos", preco: 110, emoji: "🥥", desc: "100 unidades" },
  { id: 6, nome: "Cento de Docinhos Sortidos", cat: "docinhos", preco: 130, emoji: "🍭", desc: "Variedade para festas" },
  { id: 7, nome: "Caixa Presente Amor", cat: "presentes", preco: 75, emoji: "💝", desc: "12 doces + cartão" },
  { id: 8, nome: "Kit Café da Manhã", cat: "presentes", preco: 110, emoji: "☕", desc: "Mini bolo, cookies e brigadeiros" },
  { id: 9, nome: "Cesta Doce Surpresa", cat: "presentes", preco: 150, emoji: "🧺", desc: "Seleção especial da casa" }
];

let carrinho = {};  // formato: { idDoProduto: quantidade }
const $ = (id) => document.getElementById(id); // atalho
const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ============ 1. MENU MOBILE ============ */
$("menuBtn").addEventListener("click", () => $("menu").classList.toggle("open"));
$("menu").addEventListener("click", () => $("menu").classList.remove("open"));
$("topBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ============ 2. CATÁLOGO COM FILTRO ============ */
function mostrarProdutos(cat) {
  const lista = cat === "todos" ? produtos : produtos.filter(p => p.cat === cat);
  $("productGrid").innerHTML = lista.map(p => `
    <div class="product">
      <div class="emoji">${p.emoji}</div>
      <h3>${p.nome}</h3>
      <p>${p.desc}</p>
      <div class="price">${moeda(p.preco)}</div>
      <button class="btn" data-add="${p.id}">Adicionar</button>
    </div>`).join("");
}

$("filters").addEventListener("click", (e) => {
  if (!e.target.dataset.cat) return;
  document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");
  mostrarProdutos(e.target.dataset.cat);
});

/* ============ 3. CARRINHO ============ */
$("productGrid").addEventListener("click", (e) => {
  const id = e.target.dataset.add;
  if (!id) return;
  carrinho[id] = (carrinho[id] || 0) + 1;
  $("cartMsg").textContent = "";
  desenharCarrinho();
});

$("cartItems").addEventListener("click", (e) => {
  const { id, op } = e.target.dataset;
  if (!id) return;
  carrinho[id] += op === "mais" ? 1 : -1;
  if (carrinho[id] <= 0) delete carrinho[id];
  desenharCarrinho();
});

function desenharCarrinho() {
  const ids = Object.keys(carrinho);
  let total = 0;
  $("cartItems").innerHTML = ids.length ? ids.map(id => {
    const p = produtos.find(x => x.id == id);
    total += p.preco * carrinho[id];
    return `<div class="cart-item"><span>${p.emoji} ${p.nome}</span>
      <span><button data-id="${id}" data-op="menos">−</button> ${carrinho[id]}
      <button data-id="${id}" data-op="mais">+</button></span></div>`;
  }).join("") : "<p>Seu pedido está vazio.</p>";
  $("cartTotal").textContent = moeda(total);
}

$("isGift").addEventListener("change", (e) => { $("giftMsg").hidden = !e.target.checked; });

$("clearBtn").addEventListener("click", () => {
  carrinho = {};
  desenharCarrinho();
  $("cartMsg").textContent = "";
});

$("checkoutBtn").addEventListener("click", () => {
  if (!Object.keys(carrinho).length) {
    $("cartMsg").style.color = "#d62839";
    $("cartMsg").textContent = "Adicione ao menos um produto.";
    return;
  }
  const presente = $("isGift").checked;
  $("cartMsg").style.color = "#2a8a4a";
  $("cartMsg").textContent = presente
    ? "🎁 Pedido de presente recebido! Cartão: \"" + ($("giftMsg").value || "sem mensagem") + "\". Entraremos em contato."
    : "✅ Pedido recebido! Entraremos em contato para combinar a entrega.";
  carrinho = {};
  desenharCarrinho();
});

/* ============ 4. CALCULADORA DE FESTA ============ */
$("calcBtn").addEventListener("click", () => {
  const convidados = parseInt($("calcGuests").value);
  const fator = parseFloat($("calcType").value);
  if (!convidados || convidados < 1) {
    $("calcResult").textContent = "Informe um número válido de convidados.";
    return;
  }
  const bolo = Math.ceil(convidados * 0.1 * 2) / 2;      // ~100g por pessoa, arredondado a 0,5 kg
  const docinhos = Math.ceil(convidados * 5 * fator);    // docinhos por pessoa (varia pelo tipo)
  const estimativa = bolo * 80 + docinhos * 1.2;
  $("calcResult").innerHTML = `🎂 Bolo: <strong>${bolo} kg</strong><br>
    🍬 Docinhos: <strong>${docinhos} unidades</strong><br>
    💰 Estimativa: <strong>${moeda(estimativa)}</strong><br>
    <button class="btn" id="useCalc">Usar no agendamento</button>`;
  $("useCalc").addEventListener("click", () => {
    $("evGuests").value = convidados;
    $("agendar").scrollIntoView({ behavior: "smooth" });
  });
});

/* ============ 5. AGENDAMENTO COM VALIDAÇÃO ============ */
let eventos = [];
try { eventos = JSON.parse(localStorage.getItem("eventosBeatriz")) || []; } catch (e) { eventos = []; }

// Data mínima: hoje
$("evDate").min = new Date().toISOString().split("T")[0];

function erro(campo, texto) {
  campo.classList.toggle("invalid", !!texto);
  campo.parentElement.querySelector(".err").textContent = texto;
  return !texto;
}

$("eventForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = $("evName"), tel = $("evPhone"), data = $("evDate"), conv = $("evGuests"), tema = $("evTheme");
  const itens = [...document.querySelectorAll("input[name=item]:checked")].map(i => i.value);

  let ok = true;
  ok = erro(nome, nome.value.trim().length < 3 ? "Digite seu nome completo." : "") && ok;
  ok = erro(tel, tel.value.replace(/\D/g, "").length < 10 ? "Telefone inválido (use DDD)." : "") && ok;
  ok = erro(data, !data.value || data.value < data.min ? "Escolha uma data a partir de hoje." : "") && ok;
  ok = erro(conv, !(parseInt(conv.value) > 0) ? "Informe o número de convidados." : "") && ok;
  ok = erro(tema, tema.value.trim().length < 2 ? "Conte o tema da festa." : "") && ok;
  $("itensErr") && 0;
  $("itemsErr").textContent = itens.length ? "" : "Escolha ao menos um item.";
  if (!itens.length) ok = false;
  if (!ok) { $("formMsg").style.color = "#d62839"; $("formMsg").textContent = "Corrija os campos destacados."; return; }

  eventos.push({ id: Date.now(), nome: nome.value.trim(), data: data.value, conv: conv.value, tema: tema.value.trim(), itens });
  localStorage.setItem("eventosBeatriz", JSON.stringify(eventos));
  $("formMsg").style.color = "#2a8a4a";
  $("formMsg").textContent = "🎉 Evento agendado! Entraremos em contato para confirmar.";
  e.target.reset();
  desenharEventos();
});

function desenharEventos() {
  $("eventList").innerHTML = eventos.length ? eventos.map(ev => `
    <li><span><strong>${ev.tema}</strong> — ${ev.data.split("-").reverse().join("/")}<br>
    ${ev.nome} · ${ev.conv} convidados<br>${ev.itens.join(", ")}</span>
    <button data-del="${ev.id}" title="Cancelar">🗑️</button></li>`).join("")
    : "<li>Nenhum evento agendado ainda.</li>";
}

$("eventList").addEventListener("click", (e) => {
  const id = e.target.dataset.del;
  if (!id) return;
  eventos = eventos.filter(ev => ev.id != id);
  localStorage.setItem("eventosBeatriz", JSON.stringify(eventos));
  desenharEventos();
});

/* ============ 6. CHATBOT ============ */
const respostas = [
  { chaves: ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"], r: "Olá! Eu sou a Bia 🧁 Posso ajudar com preços, entrega, horários e presentes." },
  { chaves: ["preço", "preco", "valor", "quanto", "custa"], r: "Bolos a partir de R$ 95, cento de docinhos a partir de R$ 110 e kits de presente a partir de R$ 75. Use a calculadora para estimar sua festa!" },
  { chaves: ["entrega", "entregar", "frete"], r: "Entregamos em Maricá e região. Encomendas de festa pedem 7 dias de antecedência." },
  { chaves: ["horário", "horario", "aberto", "funciona"], r: "Atendemos de segunda a sábado, das 9h às 18h." },
  { chaves: ["presente", "presentear", "cesta", "kit"], r: "Temos caixas e cestas de presente com cartão personalizado! Veja em Produtos > Presentes e marque \"É para presentear\"." },
  { chaves: ["bolo", "decorado", "tema"], r: "Fazemos bolos decorados em qualquer tema. Conte o tema no formulário de agendamento!" },
  { chaves: ["agendar", "evento", "festa", "encomenda"], r: "Para agendar, preencha o formulário em \"Agendar evento\". Informe data, convidados, tema e o que deseja." },
  { chaves: ["pagamento", "pix", "cartão", "cartao"], r: "Aceitamos Pix, cartão e dinheiro. Encomendas são confirmadas com 50% de sinal." },
  { chaves: ["obrigado", "obrigada", "valeu"], r: "Por nada! Será um prazer adoçar o seu dia 💖" }
];

function addMsg(texto, tipo) {
  const d = document.createElement("div");
  d.className = "bubble " + tipo;
  d.textContent = texto;
  $("chatMsgs").appendChild(d);
  $("chatMsgs").scrollTop = $("chatMsgs").scrollHeight;
}

function responder(texto) {
  addMsg(texto, "user");
  const t = texto.toLowerCase();
  const achou = respostas.find(item => item.chaves.some(c => t.includes(c)));
  setTimeout(() => addMsg(achou ? achou.r : "Não entendi bem 😅 Pergunte sobre preços, entrega, horário, presentes ou agendamento.", "bot"), 500);
}

$("chatToggle").addEventListener("click", () => {
  $("chatBox").hidden = !$("chatBox").hidden;
  if (!$("chatMsgs").children.length) addMsg("Olá! Sou a Bia, da Doceria Beatriz Nogueira. Como posso ajudar? 🍰", "bot");
});
$("chatClose").addEventListener("click", () => { $("chatBox").hidden = true; });
$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("chatInput").value.trim();
  if (!v) return;
  responder(v);
  $("chatInput").value = "";
});
$("quick").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") responder(e.target.textContent); });

/* ============ INICIALIZAÇÃO ============ */
mostrarProdutos("todos");
desenharCarrinho();
desenharEventos();
