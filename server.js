import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com o banco de dados SQLite local
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) console.error("Erro ao abrir banco:", err.message);
    else console.log("Banco SQLite conectado com sucesso!");
});

// Inicialização das tabelas no banco de dados
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        estoque_minimo INTEGER NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inserir usuário padrão caso não exista
    db.run(`INSERT OR IGNORE INTO usuarios (id, nome, usuario, senha) VALUES (1, 'Joana Admin', 'joana', '1234')`);
});

// --- ROTAS DA API ---

// 1. Rota de Login
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    db.get(`SELECT id, nome, usuario FROM usuarios WHERE usuario = ? AND senha = ?`, [usuario, senha], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json({ success: true, user: row });
        else res.status(401).json({ success: false, message: 'Usuário ou senha incorretos!' });
    });
});

// 2. Listar e Buscar Produtos
app.get('/api/produtos', (req, res) => {
    const busca = req.query.busca ? `%${req.query.busca}%` : '%';
    db.all(`SELECT * FROM produtos WHERE nome LIKE ?`, [busca], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Cadastrar Produto
app.post('/api/produtos', (req, res) => {
    const { nome, quantidade, estoque_minimo } = req.body;
    if (!nome || quantidade === undefined || estoque_minimo === undefined) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
    }
    db.run(`INSERT INTO produtos (nome, quantidade, estoque_minimo) VALUES (?, ?, ?)`, 
        [nome, quantidade, estoque_minimo], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Produto cadastrado com sucesso!' });
        }
    );
});

// 4. Excluir Produto
app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM produtos WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Produto removido!' });
    });
});

// 5. Registrar Movimentação (Entrada/Saída de Estoque)
app.post('/api/estoque/movimentar', (req, res) => {
    const { produto_id, usuario_id, tipo, quantidade } = req.body;
    const qtdNum = parseInt(quantidade);

    if (!produto_id || !tipo || isNaN(qtdNum) || qtdNum <= 0) {
        return res.status(400).json({ message: 'Dados inválidos para movimentação.' });
    }

    db.get(`SELECT quantidade FROM produtos WHERE id = ?`, [produto_id], (err, prod) => {
        if (err || !prod) return res.status(404).json({ message: 'Produto não encontrado.' });

        let novaQtd = prod.quantidade;
        if (tipo === 'ENTRADA') {
            novaQtd += qtdNum;
        } else if (tipo === 'SAIDA') {
            if (prod.quantidade < qtdNum) {
                return res.status(400).json({ message: 'Quantidade insuficiente em estoque!' });
            }
            novaQtd -= qtdNum;
        }

        db.run(`UPDATE produtos SET quantidade = ? WHERE id = ?`, [novaQtd, produto_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.run(`INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade) VALUES (?, ?, ?, ?)`,
                [produto_id, usuario_id || 1, tipo, qtdNum],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Movimentação realizada com sucesso!' });
                }
            );
        });
    });
});

// 6. Consultar Histórico
app.get('/api/historico', (req, res) => {
    const sql = `
        SELECT m.id, p.nome as produto, u.nome as usuario, m.tipo, m.quantidade, m.data_movimentacao
        FROM movimentacoes m
        JOIN produtos p ON m.produto_id = p.id
        JOIN usuarios u ON m.usuario_id = u.id
        ORDER BY m.data_movimentacao DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});