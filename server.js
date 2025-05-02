const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'seu_segredo_aqui',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Unicsulads123',
    database: 'hospital_sao_lucas'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no banco de dados:', err);
        return;
    }
    console.log('Conectado ao MySQL!');
});

// Página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Login
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios!' });
    }

    const query = 'SELECT * FROM funcionarios_rh WHERE usuario = ? AND senha = ?';
    db.query(query, [usuario, senha], (err, results) => {
        if (err) {
            console.error('Erro ao realizar login:', err);
            return res.status(500).json({ error: 'Erro no servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos!' });
        }

        req.session.usuario = usuario;
        return res.status(200).json({ message: 'Login autorizado', redirect: '/dashboard' });
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao tentar fazer logout!' });
        }
        res.redirect('/');
    });
});

// Cadastro de médico
app.post('/cadastro-medico', (req, res) => {
    const {
        nome,
        dataNascimento,
        sexo,
        telefone,
        cpf,
        crm,
        email,
        endereco,
        especialidade
    } = req.body;

    if (!nome || !dataNascimento || !cpf || !crm || !email || !endereco || !especialidade) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos!' });
    }

    // Validação de CPF
    if (cpf.length !== 11 || !/^\d{11}$/.test(cpf)) {
        return res.status(400).json({ error: 'O CPF deve conter exatamente 11 dígitos numéricos!' });
    }

    // Validação de data de nascimento
    if (isNaN(Date.parse(dataNascimento))) {
        return res.status(400).json({ error: 'Data de nascimento inválida!' });
    }

    const calcularIdade = (dataNascimento) => {
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    };

    const idade = calcularIdade(dataNascimento);

    // Verificar se já existe um médico com o mesmo CPF, CRM ou E-mail
    const checkQuery = 'SELECT * FROM medicos WHERE cpf = ? OR crm = ? OR email = ?';
    db.query(checkQuery, [cpf, crm, email], (err, results) => {
        if (err) {
            console.error('Erro ao verificar médico existente:', err);
            return res.status(500).json({ error: 'Erro no servidor ao verificar médico' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Já existe um médico cadastrado com o mesmo CPF, CRM ou E-mail.' });
        }

        // Inserir médico
        const insertQuery = `INSERT INTO medicos 
            (nome, data_nascimento, idade, sexo, telefone, cpf, crm, email, endereco, especialidade) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertValues = [
            nome, dataNascimento, idade, sexo, telefone, cpf, crm, email, endereco, especialidade
        ];

        db.query(insertQuery, insertValues, (err) => {
            if (err) {
                console.error('Erro ao cadastrar médico:', err);
                return res.status(500).json({ error: 'Erro ao cadastrar médico' });
            }
            return res.json({ message: 'Médico cadastrado com sucesso!' });
        });
    });
});

// Listar médicos
app.get('/medicos', (req, res) => {
    const query = 'SELECT id, nome, crm, email, telefone, especialidade FROM medicos';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar médicos:', err);
            return res.status(500).json({ error: 'Erro ao buscar médicos' });
        }

        return res.json(results);
    });
});

// Excluir médico e mover para ex-funcionários
app.delete('/medicos/:id', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ message: 'Acesso não autorizado. Faça login.' });
    }

    const id = req.params.id;

    // Verificar se o médico existe
    const selectQuery = 'SELECT * FROM medicos WHERE id = ?';
    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar médico:', err);
            return res.status(500).json({ message: 'Erro no servidor ao buscar médico.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Médico não encontrado.' });
        }

        const medico = results[0];

        // Inserir no ex_funcionarios
        const insertExQuery = `
            INSERT INTO ex_funcionarios 
            (nome, sexo, telefone, email, endereco, crm, cpf, data_saida)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const insertValues = [
            medico.nome,
            medico.sexo,
            medico.telefone,
            medico.email,
            medico.endereco,
            medico.crm,
            medico.cpf
        ];

        db.query(insertExQuery, insertValues, (err) => {
            if (err) {
                console.error('Erro ao inserir em ex_funcionarios:', err);
                return res.status(500).json({ message: 'Erro ao mover médico para ex-funcionários.' });
            }

            // Excluir o médico da tabela 'medicos'
            const deleteQuery = 'DELETE FROM medicos WHERE id = ?';
            db.query(deleteQuery, [id], (err) => {
                if (err) {
                    console.error('Erro ao excluir médico:', err);
                    return res.status(500).json({ message: 'Erro ao excluir médico.' });
                }

                return res.status(200).json({ message: 'Médico excluído e movido para ex-funcionários com sucesso.' });
            });
        });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

