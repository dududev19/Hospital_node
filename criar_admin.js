const bcrypt = require('bcrypt');
const mysql = require('mysql');

// Dados da funcionária
const usuario = 'maria.fatima';
const senhaPura = 'Saolucas123';

// Criptografar a senha
bcrypt.hash(senhaPura, 10, (err, hash) => {
  if (err) {
    return console.error('Erro ao criptografar senha:', err);
  }

  // Conexão com o banco de dados
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Unicsulads123',
    database: 'hospital'
  });

  connection.connect((err) => {
    if (err) {
      return console.error('Erro ao conectar no banco:', err);
    }

    console.log('Conectado ao banco.');

    // Inserir o funcionário
    const query = 'INSERT INTO funcionario_rh (usuario, senha) VALUES (?, ?)';
    connection.query(query, [usuario, hash], (err, result) => {
      if (err) {
        return console.error('Erro ao inserir funcionário:', err);
      }

      console.log('Funcionária Maria de Fátima cadastrada com sucesso!');
      connection.end();
    });
  });
});
