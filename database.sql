-- 1. Tabela de Usuários (Login)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    usuario TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
);

-- 2. Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 0
);

-- 3. Tabela de Movimentações (Histórico de Entrada e Saída)
CREATE TABLE IF NOT EXISTS movimentacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('ENTRADA', 'SAIDA')),
    quantidade INTEGER NOT NULL,
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- POPULAR COM DADOS DE TESTE
INSERT INTO usuarios (nome, usuario, senha) VALUES 
('Joana Admin', 'joana', '1234'),
('Operador Almoxarifado', 'operador', '1234');

INSERT INTO produtos (nome, quantidade, estoque_minimo) VALUES 
('Smartphone Galaxy S23', 15, 5),
('Notebook Dell Inspiron', 3, 5),
('Smart TV 55 Pulg', 2, 4);

INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade) VALUES 
(1, 1, 'ENTRADA', 15),
(2, 1, 'ENTRADA', 3),
(3, 2, 'ENTRADA', 2);