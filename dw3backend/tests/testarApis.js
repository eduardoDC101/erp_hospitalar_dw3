const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const base = "http://localhost:40000";
let falhas = 0;

function assert(condicao, nome, extra) {
  if (condicao) {
    console.log("PASS " + nome);
    return;
  }

  falhas += 1;
  console.log("FAIL " + nome + (extra ? " | " + JSON.stringify(extra) : ""));
}

async function req(method, caminho, opcoes) {
  const headers = {};
  const token = opcoes && opcoes.token;
  const body = opcoes && opcoes.body;

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  const response = await fetch(base + caminho, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = { parseError: true };
  }

  return { http: response.status, data };
}

async function main() {
  const sufixo = String(Date.now()).slice(-8);
  const cpf = "9" + sufixo.padStart(10, "0").slice(0, 10);

  const loginRuim = await req("POST", "/Login", {
    body: { username: "admin", password: "errada" },
  });
  assert(loginRuim.http === 200 && !loginRuim.data.token, "login com senha errada não devolve token", loginRuim);

  const semToken = await req("GET", "/getAllPacientes");
  assert(semToken.data && semToken.data.auth === false, "GetAllPacientes sem token", semToken);

  const tokenRuim = await req("GET", "/getAllConsultas", { token: "token-invalido" });
  assert(tokenRuim.data && tokenRuim.data.auth === false, "GetAllConsultas com token inválido", tokenRuim);

  const login = await req("POST", "/Login", {
    body: { username: "admin", password: "admin" },
  });
  const token = login.data && login.data.token;
  assert(login.data && login.data.auth === true && !!token, "login admin devolve JWT", login);

  const pacientes = await req("GET", "/getAllPacientes", { token });
  assert(
    pacientes.data && pacientes.data.status === "ok" && Array.isArray(pacientes.data.registro),
    "GetAllPacientes com token",
    pacientes.data
  );
  assert(
    pacientes.data.registro.every((item) => item.removido === false),
    "GetAllPacientes só traz removido = false"
  );
  assert(
    pacientes.data.registro.some((item) => item.cpf === "12345678901"),
    "semente Ana Lima aparece na listagem"
  );

  const invalido = await req("POST", "/insertPaciente", {
    token,
    body: { nome: "", cpf: "123", telefone: "abc", data_nascimento: "2026-02-31" },
  });
  assert(invalido.data && invalido.data.status !== "ok" && invalido.data.linhasAfetadas === 0, "InsertPaciente rejeita dados inválidos", invalido.data);

  const inserido = await req("POST", "/insertPaciente", {
    token,
    body: { nome: "Paciente Teste", cpf: cpf, telefone: "(17) 90000-0000", data_nascimento: "1991-05-20" },
  });
  assert(inserido.data && inserido.data.status === "ok" && inserido.data.linhasAfetadas === 1, "InsertPaciente", inserido.data);

  const lista = await req("GET", "/getAllPacientes", { token });
  const paciente = lista.data.registro.find((item) => item.cpf === cpf);
  assert(!!paciente && paciente.id > 0, "paciente inserido aparece no GetAll", paciente);

  const porId = await req("GET", "/getPacienteByID/" + paciente.id, { token });
  assert(
    porId.data.status === "ok" && porId.data.registro.length === 1 && porId.data.registro[0].nome === "Paciente Teste",
    "GetPacienteByID",
    porId.data
  );

  const inexistente = await req("GET", "/getPacienteByID/999999", { token });
  assert(
    inexistente.data.status === "ok" && inexistente.data.registro.length === 0,
    "GetPacienteByID inexistente devolve lista vazia",
    inexistente.data
  );

  const idInvalido = await req("GET", "/getPacienteByID/abc", { token });
  assert(idInvalido.data.status !== "ok", "GetPacienteByID com ID inválido", idInvalido.data);

  const atualizado = await req("PUT", "/updatePaciente/" + paciente.id, {
    token,
    body: { nome: "Paciente Alterado", cpf: cpf, telefone: "", data_nascimento: "1991-05-20" },
  });
  assert(atualizado.data.status === "ok" && atualizado.data.linhasAfetadas === 1, "UpdatePaciente", atualizado.data);

  const consultaRuim = await req("POST", "/insertConsulta", {
    token,
    body: {
      pacienteid: 999999,
      descricao: "Sem paciente",
      valor: 10,
      data_consulta: "2026-12-01",
    },
  });
  assert(consultaRuim.data.status === "Paciente inexistente ou removido.", "InsertConsulta rejeita paciente inexistente", consultaRuim.data);

  const valorRuim = await req("POST", "/insertConsulta", {
    token,
    body: {
      pacienteid: paciente.id,
      descricao: "Valor ruim",
      valor: -5,
      data_consulta: "2026-02-31",
    },
  });
  assert(valorRuim.data.status !== "ok", "InsertConsulta rejeita valor e data inválidos", valorRuim.data);

  const consulta = await req("POST", "/insertConsulta", {
    token,
    body: {
      pacienteid: paciente.id,
      descricao: "Consulta teste " + sufixo,
      valor: "1500.50",
      data_consulta: "2026-12-25",
    },
  });
  assert(consulta.data.status === "ok" && consulta.data.linhasAfetadas === 1, "InsertConsulta", consulta.data);

  const consultas = await req("GET", "/getAllConsultas", { token });
  const consultaCriada = consultas.data.registro.find((item) => item.descricao === "Consulta teste " + sufixo);
  assert(
    !!consultaCriada && consultaCriada.nomepaciente === "Paciente Alterado" && String(consultaCriada.valor) === "1500.50",
    "GetAllConsultas traz valor, data e nome do paciente",
    consultaCriada
  );
  assert(String(consultaCriada.data_consulta).slice(0, 10) === "2026-12-25", "data da consulta preservada", consultaCriada.data_consulta);

  const consultaPorId = await req("GET", "/getConsultaByID/" + consultaCriada.id, { token });
  assert(consultaPorId.data.registro.length === 1, "GetConsultaByID", consultaPorId.data);

  const consultaAtualizada = await req("PUT", "/updateConsulta/" + consultaCriada.id, {
    token,
    body: {
      pacienteid: paciente.id,
      descricao: "Consulta revisada " + sufixo,
      valor: 80,
      data_consulta: "2026-12-31",
    },
  });
  assert(consultaAtualizada.data.status === "ok" && consultaAtualizada.data.linhasAfetadas === 1, "UpdateConsulta", consultaAtualizada.data);

  const apoio = await req("GET", "/getAllPacientes", { token });
  assert(
    apoio.data.status === "ok" && apoio.data.registro.some((item) => item.id === paciente.id),
    "GetAllPacientes fornece pacientes ativos para o formulário",
    apoio.data && apoio.data.status
  );

  const pacienteComConsulta = await req("DELETE", "/deletePaciente/" + paciente.id, { token });
  assert(
    pacienteComConsulta.data.status === "Paciente possui consultas ativas." && pacienteComConsulta.data.linhasAfetadas === 0,
    "DeletePaciente recusa paciente com consultas ativas",
    pacienteComConsulta.data
  );

  const updatePacienteRemovido = await req("PUT", "/updateConsulta/" + consultaCriada.id, {
    token,
    body: {
      pacienteid: 999999,
      descricao: "Não vincula",
      valor: 10,
      data_consulta: "2026-12-31",
    },
  });
  assert(
    updatePacienteRemovido.data.status === "Paciente inexistente ou removido.",
    "UpdateConsulta rejeita paciente inexistente",
    updatePacienteRemovido.data
  );

  const apagouConsulta = await req("DELETE", "/deleteConsulta/" + consultaCriada.id, { token });
  assert(apagouConsulta.data.status === "ok" && apagouConsulta.data.linhasAfetadas === 1, "DeleteConsulta", apagouConsulta.data);

  const consultaApagada = await req("GET", "/getConsultaByID/" + consultaCriada.id, { token });
  assert(consultaApagada.data.registro.length === 0, "GetConsultaByID não retorna removido", consultaApagada.data);

  const listaConsultas = await req("GET", "/getAllConsultas", { token });
  assert(
    !listaConsultas.data.registro.some((item) => item.id === consultaCriada.id),
    "GetAllConsultas não lista consulta removida"
  );

  const updateRemovido = await req("PUT", "/updateConsulta/" + consultaCriada.id, {
    token,
    body: {
      pacienteid: paciente.id,
      descricao: "Não pode",
      valor: 10,
      data_consulta: "2026-12-31",
    },
  });
  assert(updateRemovido.data.status !== "ok", "UpdateConsulta de registro removido é recusado", updateRemovido.data);

  const deleteDeNovo = await req("DELETE", "/deleteConsulta/" + consultaCriada.id, { token });
  assert(deleteDeNovo.data.linhasAfetadas === 0, "DeleteConsulta repetido não altera outra linha", deleteDeNovo.data);

  const apagouPaciente = await req("DELETE", "/deletePaciente/" + paciente.id, { token });
  assert(apagouPaciente.data.status === "ok" && apagouPaciente.data.linhasAfetadas === 1, "DeletePaciente", apagouPaciente.data);

  const consultaNoRemovido = await req("POST", "/insertConsulta", {
    token,
    body: {
      pacienteid: paciente.id,
      descricao: "Depois da remoção",
      valor: 40,
      data_consulta: "2026-12-01",
    },
  });
  assert(
    consultaNoRemovido.data.status === "Paciente inexistente ou removido.",
    "InsertConsulta rejeita paciente removido",
    consultaNoRemovido.data
  );

  const pacienteApagado = await req("GET", "/getPacienteByID/" + paciente.id, { token });
  assert(pacienteApagado.data.registro.length === 0, "GetPacienteByID não retorna removido", pacienteApagado.data);

  const listaFinal = await req("GET", "/getAllPacientes", { token });
  assert(!listaFinal.data.registro.some((item) => item.id === paciente.id), "GetAllPacientes não lista paciente removido");

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });

  const linhaPaciente = await pool.query("SELECT id, removido FROM pacientes WHERE id = $1", [paciente.id]);
  const linhaConsulta = await pool.query("SELECT id, removido, pacienteid FROM consultas WHERE id = $1", [consultaCriada.id]);
  const senha = await pool.query("SELECT password FROM usuarios WHERE username = $1", ["admin"]);

  assert(linhaPaciente.rowCount === 1 && linhaPaciente.rows[0].removido === true, "paciente removido continua no PostgreSQL", linhaPaciente.rows[0]);
  assert(
    linhaConsulta.rowCount === 1 && linhaConsulta.rows[0].removido === true && Number(linhaConsulta.rows[0].pacienteid) === paciente.id,
    "consulta removida continua ligada ao paciente",
    linhaConsulta.rows[0]
  );
  assert(senha.rows[0].password !== "admin" && senha.rows[0].password.startsWith("$2"), "senha do admin não está em texto puro");

  await pool.end();

  if (falhas > 0) {
    console.log("RESULTADO " + falhas + " falha(s)");
    process.exit(1);
  }

  console.log("RESULTADO todos os testes passaram");
}

main().catch((error) => {
  console.error("ERRO", error);
  process.exit(1);
});
