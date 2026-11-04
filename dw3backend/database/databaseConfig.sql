CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
    id bigserial CONSTRAINT pk_usuarios PRIMARY KEY,
    username varchar(30) UNIQUE NOT NULL,
    password text NOT NULL,
    removido boolean DEFAULT false
);

INSERT INTO usuarios (username, password)
VALUES ('admin', crypt('admin', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS pacientes (
    id bigserial CONSTRAINT pk_pacientes PRIMARY KEY,
    nome varchar(100) NOT NULL,
    cpf varchar(11) NOT NULL,
    telefone varchar(20),
    data_nascimento date NOT NULL,
    removido boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS consultas (
    id bigserial CONSTRAINT pk_consultas PRIMARY KEY,
    pacienteid bigint NOT NULL CONSTRAINT fk_consulta_paciente REFERENCES pacientes (id),
    descricao varchar(500) NOT NULL,
    valor numeric(12, 2) NOT NULL CONSTRAINT ck_consulta_valor CHECK (valor >= 0),
    data_consulta date NOT NULL,
    removido boolean DEFAULT false NOT NULL
);

INSERT INTO pacientes (nome, cpf, telefone, data_nascimento)
VALUES
    ('Ana Lima', '12345678901', '(17) 99999-0001', DATE '1988-03-12'),
    ('Bruno Costa', '23456789012', '(17) 98888-0002', DATE '1975-11-02'),
    ('Carla Mendes', '34567890123', NULL, DATE '1992-07-28');

INSERT INTO consultas (pacienteid, descricao, valor, data_consulta)
SELECT pacientes.id,
       'Consulta clinica geral',
       180.00,
       DATE '2026-11-15'
FROM pacientes
WHERE pacientes.cpf = '12345678901'
  AND NOT EXISTS (
      SELECT 1
      FROM consultas
      WHERE consultas.descricao = 'Consulta clinica geral'
        AND consultas.pacienteid = pacientes.id
        AND consultas.removido = false
  );

INSERT INTO consultas (pacienteid, descricao, valor, data_consulta)
SELECT pacientes.id,
       'Retorno de exames laboratoriais',
       120.50,
       DATE '2026-11-20'
FROM pacientes
WHERE pacientes.cpf = '12345678901'
  AND NOT EXISTS (
      SELECT 1
      FROM consultas
      WHERE consultas.descricao = 'Retorno de exames laboratoriais'
        AND consultas.pacienteid = pacientes.id
        AND consultas.removido = false
  );

INSERT INTO consultas (pacienteid, descricao, valor, data_consulta)
SELECT pacientes.id,
       'Avaliacao cardiologica',
       350.00,
       DATE '2026-12-03'
FROM pacientes
WHERE pacientes.cpf = '23456789012'
  AND NOT EXISTS (
      SELECT 1
      FROM consultas
      WHERE consultas.descricao = 'Avaliacao cardiologica'
        AND consultas.pacienteid = pacientes.id
        AND consultas.removido = false
  );
