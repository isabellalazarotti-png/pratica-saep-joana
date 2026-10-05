// Mostrar nome do usuário logado no topo
document.addEventListener("DOMContentLoaded", () => {
    const userStr = localStorage.getItem("usuarioLogado");
    const elUser = document.getElementById("nomeUsuario");
    
    if (userStr && elUser) {
        const user = JSON.parse(userStr);
        elUser.innerText = user.nome;
    } else if (!userStr && !window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
        window.location.href = "index.html";
    }
});

// Logout
function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
}

// 1. Login
const formLogin = document.getElementById("formLogin");
if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usuario = document.getElementById("usuario").value;
        const senha = document.getElementById("senha").value;
        const msgErro = document.getElementById("msgErro");

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, senha })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem("usuarioLogado", JSON.stringify(data.user));
            window.location.href = "dashboard.html";
        } else {
            msgErro.style.display = "block";
            msgErro.innerText = data.message;
        }
    });
}

// 2. Produtos
async function carregarProdutos() {
    const busca = document.getElementById("inputBusca")?.value || "";
    const res = await fetch(`/api/produtos?busca=${encodeURIComponent(busca)}`);
    const produtos = await res.json();
    const tbody = document.getElementById("tabelaProdutos");

    if (!tbody) return;
    tbody.innerHTML = "";

    produtos.forEach(p => {
        const abaixoDoMinimo = p.quantidade < p.estoque_minimo;
        const tr = document.createElement("tr");
        if (abaixoDoMinimo) tr.classList.add("alerta-estoque");

        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nome}</td>
            <td>${p.quantidade}</td>
            <td>${p.estoque_minimo}</td>
            <td>${abaixoDoMinimo ? '<span class="badge-alerta">⚠️ ESTOQUE BAIXO</span>' : 'OK'}</td>
            <td><button onclick="excluirProduto(${p.id})" style="background:#ef4444; padding: 5px 10px;">Excluir</button></td>
        `;
        tbody.appendChild(tr);
    });
}

const formProduto = document.getElementById("formProduto");
if (formProduto) {
    formProduto.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = document.getElementById("prodNome").value;
        const quantidade = parseInt(document.getElementById("prodQtd").value);
        const estoque_minimo = parseInt(document.getElementById("prodMinimo").value);

        const res = await fetch("/api/produtos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, quantidade, estoque_minimo })
        });

        if (res.ok) {
            alert("Produto cadastrado com sucesso!");
            formProduto.reset();
            carregarProdutos();
        } else {
            alert("Erro ao cadastrar produto.");
        }
    });
}

async function excluirProduto(id) {
    if (confirm("Deseja realmente excluir este produto?")) {
        await fetch(`/api/produtos/${id}`, { method: "DELETE" });
        carregarProdutos();
    }
}

// 3. Movimentação de Estoque
async function carregarSelectProdutos() {
    const res = await fetch("/api/produtos");
    const produtos = await res.json();
    const select = document.getElementById("selectProduto");
    if (!select) return;

    select.innerHTML = '<option value="">Selecione...</option>';
    produtos.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nome} (Qtd: ${p.quantidade})</option>`;
    });
}

const formMovimentar = document.getElementById("formMovimentar");
if (formMovimentar) {
    formMovimentar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const produto_id = document.getElementById("selectProduto").value;
        const tipo = document.getElementById("tipoOperacao").value;
        const quantidade = document.getElementById("movQuantidade").value;
        const userObj = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

        const res = await fetch("/api/estoque/movimentar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                produto_id,
                tipo,
                quantidade,
                usuario_id: userObj.id || 1
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            formMovimentar.reset();
            carregarSelectProdutos();
        } else {
            alert(data.message);
        }
    });
}

// 4. Histórico
async function carregarHistorico() {
    const res = await fetch("/api/historico");
    const historico = await res.json();
    const tbody = document.getElementById("tabelaHistorico");
    if (!tbody) return;

    tbody.innerHTML = "";
    historico.forEach(h => {
        const dataFormatada = new Date(h.data_movimentacao).toLocaleString("pt-BR");
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${h.produto}</td>
            <td style="color: ${h.tipo === 'ENTRADA' ? 'green' : 'red'}; font-weight:bold;">${h.tipo}</td>
            <td>${h.quantidade}</td>
            <td>${h.usuario}</td>
        `;
        tbody.appendChild(tr);
    });
}