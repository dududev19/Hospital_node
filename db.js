const mysql = require('mysql');

// Criação da conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Ex: 'root'
  password: 'Unicsulads123',      // Ex: '1234'
  database: 'hospital_db'       // Ex: 'hospital'
});

// Conectando ao banco
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
    return;
  }
  console.log('Conectado ao banco de dados.');
});

// Exportando a conexão para usar em outros arquivos
module.exports = connection;
