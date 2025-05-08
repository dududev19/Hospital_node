const express = require('express');
const mysql = require('mysql2'); // Usa o mysql2
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

// Configuração do bodyParser para ler requisições POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com o banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Unicsulads123',
  database: 'hospital_sao_lucas'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados MySQL');
  }
});

// Rota inicial - envia a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pagina_hospital.html'));
});

// Rota para login do RH
app.post('/loginRHNovo', (req, res) => {
  const { usuario, senha } = req.body;
  const query = 'SELECT * FROM funcionarios_rh WHERE usuario = ? AND senha = ?';

  db.query(query, [usuario, senha], (err, results) => {
    if (err) {
      console.error('Erro no login do RH:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor.' });
    }

    if (results.length > 0) {
      res.json({ sucesso: true, mensagem: 'Login bem-sucedido.' });
    } else {
      res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos.' });
    }
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
