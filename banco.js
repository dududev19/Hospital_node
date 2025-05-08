const mysql = require('mysql2');

// Configuração do banco de dados
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Unicsulads123',
    database: 'hospital_sao_lucas'
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados com ID', connection.threadId);
});

// Função para verificar login do funcionário
const verificarLoginFuncionario = (rgm, senha, callback) => {
    connection.query(
        'SELECT * FROM funcionarios WHERE rgm = ? AND senha = ?',
        [rgm, senha],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, results[0]);
        }
    );
};

// Função para cadastrar médico
const cadastrarMedico = (medico, callback) => {
    const { nome, rgm, especialidade, telefone, endereco } = medico;
    connection.query(
        'INSERT INTO medicos (nome, rgm, especialidade, telefone, endereco) VALUES (?, ?, ?, ?, ?)',
        [nome, rgm, especialidade, telefone, endereco],
        (err, result) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, result);
        }
    );
};

// Função para verificar login do paciente
const verificarLoginPaciente = (numero_carteirinha, senha, callback) => {
    connection.query(
        'SELECT * FROM pacientes WHERE numero_carteirinha = ? AND senha = ?',
        [numero_carteirinha, senha],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, results[0]);
        }
    );
};

// Função para cadastrar paciente
const cadastrarPaciente = (paciente, callback) => {
    const {
        nome,
        telefone,
        cpf_ou_certidao,
        cep,
        rua,
        numero,
        complemento,
        data_nascimento,
        numero_carteirinha,
        senha
    } = paciente;

    const endereco = `${rua}, ${numero}${complemento ? ' - ' + complemento : ''}, CEP: ${cep}`;

    const sql = `
        INSERT INTO pacientes (nome, telefone, cpf_ou_certidao, endereco, data_nascimento, numero_carteirinha, senha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
        sql,
        [nome, telefone, cpf_ou_certidao, endereco, data_nascimento, numero_carteirinha, senha],
        (err, result) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, result);
        }
    );
};

// Exportando as funções
module.exports = {
    verificarLoginFuncionario,
    cadastrarMedico,
    verificarLoginPaciente,
    cadastrarPaciente
};
