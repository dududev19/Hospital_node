const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const port = 3000;

// Configuração da sessão
app.use(session({
  secret: 'hospital_sao_lucas_mendel',
  resave: false,
  saveUninitialized: true
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Conexão com o banco
db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Unicsulads123',
  database: 'hospital'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados:', err);
  } else {
    console.log('Conectado ao MySQL com sucesso!');
  }
});

// Página inicial
app.get('/', (req, res) => {
  res.render('index');
});

// Login RH
app.get('/login-rh', (req, res) => {
  res.render('login-rh');
});

app.post('/login-rh', (req, res) => {
  const { usuario, senha } = req.body;

  const query = 'SELECT * FROM usuarios_rh WHERE usuario = ? AND senha = ?';
  db.query(query, [usuario, senha], (err, results) => {
    if (err) {
      console.error('Erro na consulta:', err);
      return res.send('Erro interno no servidor.');
    }

    if (results.length > 0) {
      req.session.usuario = usuario;
      res.redirect('/painel-rh');
    } else {
      res.send('<script>alert("Usuário ou senha incorretos!"); window.location.href="/login-rh";</script>');
    }
  });
});

// Página painel-rh com suporte a mensagens
app.get('/painel-rh', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/login-rh');
  }
  // Recebe mensagem de sessão
  const mensagemSucesso = req.session.mensagemSucesso || null;
  const mensagemErro = req.session.mensagemErro || null;

  // Limpa mensagens para não exibir novamente
  req.session.mensagemSucesso = null;
  req.session.mensagemErro = null;

  res.render('painel-rh', { mensagemSucesso, mensagemErro });
});

// Cadastro de médico com mensagens no painel-rh
app.post('/cadastrar-medico', (req, res) => {
  const {
    nome, cpf, telefone, email, cep, endereco, numero, complemento,
    sexo, crm, data_nascimento, especialidade,
    horario_inicio, horario_fim, almoco_inicio, almoco_fim,
    cafe_inicio, cafe_fim
  } = req.body;

  // Calcular a idade com base na data de nascimento
  const hoje = new Date();
  const nascimento = new Date(data_nascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  // Verifica se a idade é menor que 18
  if (idade < 18) {
    req.session.mensagemErro = 'Erro: O médico deve ter no mínimo 18 anos de idade.';
    return res.redirect('/painel-rh');
  }

  const query = `
    INSERT INTO medicos 
    (nome, cpf, telefone, email, cep, endereco, numero, complemento,
     sexo, crm, data_nascimento, idade, especialidade, 
     horario_inicio, horario_fim, almoco_inicio, almoco_fim, cafe_inicio, cafe_fim)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    nome, cpf, telefone, email, cep, endereco, numero, complemento,
    sexo, crm, data_nascimento, idade, especialidade,
    horario_inicio, horario_fim, almoco_inicio, almoco_fim, cafe_inicio, cafe_fim
  ];

  db.query(query, valores, (err, results) => {
    if (err) {
      console.error('Erro ao cadastrar médico:', err);
      req.session.mensagemErro = 'Erro ao cadastrar médico. Tente novamente.';
      return res.redirect('/painel-rh');
    }

    req.session.mensagemSucesso = 'Médico cadastrado com sucesso!';
    res.redirect('/painel-rh');
  });
});

// Listar médicos ativos
app.get('/medicos', (req, res) => {
  const query = 'SELECT * FROM medicos WHERE ativo = TRUE';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar médicos:', err);
      return res.send('Erro ao buscar médicos.');
    }

    res.render('lista-medicos', {
      medicos: results,
      exibirInativos: false // Passando a variável exibirInativos como false
    });
  });
});

// Página de edição do médico
app.get('/editar-medico/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM medicos WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar médico:', err);
      return res.status(500).send('Erro ao buscar médico.');
    }

    if (results.length === 0) {
      return res.status(404).send('Médico não encontrado.');
    }

    const medico = results[0];
    res.render('editar-medico', { medico });
  });
});

// Listar médicos inativos (ex-médicos)
app.get('/ex-medicos', (req, res) => {
  const query = 'SELECT * FROM medicos WHERE ativo = FALSE';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar ex-médicos:', err);
      return res.send('Erro ao buscar ex-médicos.');
    }

    res.render('lista-medicos', {
      medicos: results,
      exibirInativos: true // Passando a variável exibirInativos como true
    });
  });
});

// "Excluir" médico (inativar)
app.post('/excluir-medico/:id', (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE medicos SET ativo = FALSE WHERE id = ?';

  db.query(query, [id], (err) => {
    if (err) {
      console.error('Erro ao excluir médico:', err);
      return res.send('Erro ao excluir médico.');
    }
    res.redirect('/medicos');
  });
});

// Atualizar dados do médico com recalculo da idade
app.post('/atualizar-medico/:id', (req, res) => {
  const { id } = req.params;
  const { endereco, telefone, email, sexo, data_nascimento } = req.body;

  // Recalcular idade
  const hoje = new Date();
  const nascimento = new Date(data_nascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  const query = `
    UPDATE medicos 
    SET endereco = ?, telefone = ?, email = ?, sexo = ?, data_nascimento = ?, idade = ?
    WHERE id = ?
  `;

  const valores = [endereco, telefone, email, sexo, data_nascimento, idade, id];

  db.query(query, valores, (err, results) => {
    if (err) {
      console.error('Erro ao atualizar médico:', err);
      return res.status(500).send('Erro ao atualizar médico.');
    }

    res.redirect('/medicos');
  });
});

// Cadastro de paciente
app.get('/cadastro-paciente', (req, res) => {
  res.render('cadastro-paciente');
});

app.post('/cadastrar-paciente', (req, res) => {
  const {
    nome, telefone, cpf, certidao_nascimento, endereco, numero, complemento,
    data_nascimento, idade, carteirinha, senha
  } = req.body;

  bcrypt.hash(senha, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Erro ao criptografar a senha:', err);
      return res.send('Erro ao cadastrar paciente.');
    }

    const ultimoDigito = carteirinha.slice(-1);
    let tipo_convenio = 'Desconhecido';

    if (ultimoDigito === '1') tipo_convenio = 'Infantil (Pediatria e Psicologia)';
    else if (ultimoDigito === '5') tipo_convenio = 'Adulto (Cardiologia e Psiquiatria)';
    else if (ultimoDigito === '9') tipo_convenio = 'Completo (exceto Pediatria)';

    const query = `
      INSERT INTO pacientes 
      (nome, telefone, cpf, certidao_nascimento, endereco, numero, complemento,
       data_nascimento, idade, carteirinha, tipo_convenio, senha)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      nome, telefone, cpf || null, certidao_nascimento || null, endereco, numero, complemento,
      data_nascimento, idade, carteirinha, tipo_convenio, hashedPassword
    ];

    db.query(query, valores, (err, result) => {
      if (err) {
        console.error('Erro ao cadastrar paciente:', err);
        return res.render('erro-paciente', {
          mensagemErro: err.sqlMessage || 'Erro ao cadastrar paciente.'
        });
      }

      req.session.pacienteId = result.insertId;
      res.redirect('/pos-cadastro');
    });
  });
});

app.get('/pos-cadastro', (req, res) => {
  if (!req.session.pacienteId) {
    return res.redirect('/cadastro-paciente');
  }

  const pacienteId = req.session.pacienteId;
  const query = 'SELECT nome, carteirinha, tipo_convenio FROM pacientes WHERE id = ?';

  db.query(query, [pacienteId], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect('/cadastro-paciente');
    }

    res.render('pos-cadastro', { 
      paciente: results[0] 
    });
  });
});

// Login de paciente
app.get('/login-paciente', (req, res) => {
  console.log("Rota /login-paciente acessada");
  res.render('login-paciente');
});

app.post('/login-paciente', (req, res) => {
  const { carteirinha, senha } = req.body;

  const query = 'SELECT * FROM pacientes WHERE carteirinha = ?';
  db.query(query, [carteirinha], async (err, results) => {
    if (err) {
      console.error('Erro ao buscar paciente:', err);
      return res.send('Erro ao buscar paciente.');
    }

    if (results.length === 0) {
      console.log('Carteirinha não encontrada.');
      return res.send('<script>alert("Carteirinha não encontrada."); window.location.href="/login-paciente";</script>');
    }

    const paciente = results[0];
    const match = await bcrypt.compare(senha, paciente.senha);

    if (!match) {
      console.log('Senha incorreta.');
      return res.send('<script>alert("Senha incorreta."); window.location.href="/login-paciente";</script>');
    }
    req.session.pacienteId = paciente.id;
    res.redirect('/area-paciente');
  });
});

app.get('/area-paciente', (req, res) => {
  if (!req.session.pacienteId) {
    return res.redirect('/login-paciente');
  }

  const pacienteId = req.session.pacienteId;
  const query = 'SELECT nome, telefone, cpf, idade FROM pacientes WHERE id = ?';

  db.query(query, [pacienteId], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect('/login-paciente');
    }

    const paciente = results[0];
    res.render('area-paciente', { paciente });
  });
});

// Logout RH
app.get('/logout-rh', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login-rh');
  });
});

// Logout paciente
app.get('/logout-paciente', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login-paciente');
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
