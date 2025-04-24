const express = require('express');
const router = express.Router();

// Exemplo de rota para listar médicos
router.get('/', (req, res) => {
  res.send('Listagem de médicos');
});

// Rota para cadastrar um novo médico
router.post('/cadastro', (req, res) => {
  // Lógica para cadastrar médico
  res.send('Médico cadastrado com sucesso');
});

module.exports = router;
