const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');

app.use(express.json());
app.use(express.static('public')); //serve para os arquivos html.

// Rota de teste para o navegador
app.get('/', (req, res) => {
  res.send('API do Hospital São Lucas & Mendel funcionando! 🚑');
});

// app.js
require('./db');

// Rotas de autenticação
app.use('/auth', authRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
