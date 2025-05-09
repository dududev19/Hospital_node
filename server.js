const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Configurações básicas
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão
app.use(session({
  secret: 'chave-secreta-forte-hospital',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Conexão com o banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Unicsulads123',
  database: 'hospital_sao_lucas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware de autenticação
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ sucesso: false, mensagem: 'Não autorizado' });
};

// Rotas Públicas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login_rh.html'));
});

app.get('/login_rh', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login_rh.html'));
});

// Rotas Protegidas
app.get('/painelrh', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel_rh.html'));
});

app.get('/medicos', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'medicos.html'));
});

// API de Login
app.post('/login_rh', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ 
      sucesso: false, 
      mensagem: 'Usuário e senha são obrigatórios' 
    });
  }

  try {
    const [results] = await pool.query(
      'SELECT id, usuario, nome, departamento FROM funcionarios_rh WHERE usuario = ? AND senha = ?',
      [usuario, senha]
    );

    if (results.length > 0) {
      req.session.user = {
        id: results[0].id,
        usuario: results[0].usuario,
        nome: results[0].nome,
        departamento: results[0].departamento
      };
      
      return res.json({ 
        sucesso: true,
        usuario: results[0].usuario,
        nome: results[0].nome
      });
    } else {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Credenciais inválidas' 
      });
    }
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro no servidor' 
    });
  }
});

// API de Logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ 
        sucesso: false, 
        mensagem: 'Erro ao fazer logout' 
      });
    }
    res.clearCookie('connect.sid');
    return res.json({ sucesso: true });
  });
});

// API de Médicos (exemplo)
app.get('/api/medicos', requireAuth, async (req, res) => {
  try {
    const [medicos] = await pool.query('SELECT * FROM medicos');
    res.json(medicos);
  } catch (err) {
    console.error('Erro ao buscar médicos:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao buscar médicos' 
    });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Rotas disponíveis:');
  console.log('- GET  /login_rh');
  console.log('- POST /login_rh');
  console.log('- POST /logout');
  console.log('- GET  /painelrh (protegida)');
  console.log('- GET  /medicos (protegida)');
  console.log('- GET  /api/medicos (protegida)');
});