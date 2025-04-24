const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Rota de login para funcionário do RH
router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  const query = 'SELECT * FROM funcionario_rh WHERE usuario = ?';
  db.query(query, [usuario], (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ erro: 'Usuário não encontrado' });
    }

    const funcionario = results[0];

    // Comparar senha com bcrypt
    bcrypt.compare(senha, funcionario.senha, (err, isMatch) => {
      if (err) {
        console.error('Erro ao comparar senha:', err);
        return res.status(500).json({ erro: 'Erro ao processar login' });
      }

      if (!isMatch) {
        return res.status(401).json({ erro: 'Senha incorreta' });
      }

      // Login bem-sucedido
      res.status(200).json({ mensagem: 'Login realizado com sucesso!' });
    });
  });
});

module.exports = router;
