const db = require("../../../database/databaseconfig");

const GetAllPacientes = async () => {
  return (
    await db.query(
      "SELECT * FROM pacientes WHERE removido = false ORDER BY nome ASC"
    )
  ).rows;
};

const GetPacienteByID = async (pacienteIDPar) => {
  return (
    await db.query(
      "SELECT * FROM pacientes WHERE id = $1 AND removido = false",
      [pacienteIDPar]
    )
  ).rows;
};

const InsertPaciente = async (pacienteREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO pacientes (nome, cpf, telefone, data_nascimento, removido) " +
          "VALUES ($1, $2, $3, $4, false)",
        [
          pacienteREGPar.nome,
          pacienteREGPar.cpf,
          pacienteREGPar.telefone,
          pacienteREGPar.data_nascimento,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPacientes|InsertPaciente]", error.detail || error.message);
    msg = "Não foi possível inserir o paciente.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const UpdatePaciente = async (pacienteIDPar, pacienteREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE pacientes SET nome = $2, cpf = $3, telefone = $4, data_nascimento = $5 " +
          "WHERE id = $1 AND removido = false",
        [
          pacienteIDPar,
          pacienteREGPar.nome,
          pacienteREGPar.cpf,
          pacienteREGPar.telefone,
          pacienteREGPar.data_nascimento,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPacientes|UpdatePaciente]", error.detail || error.message);
    msg = "Não foi possível atualizar o paciente.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

async function possuiConsultasAtivas(pacienteIDPar) {
  const consulta = await db.query(
    "SELECT id FROM consultas WHERE pacienteid = $1 AND removido = false LIMIT 1",
    [pacienteIDPar]
  );
  return consulta.rowCount > 0;
}

const DeletePaciente = async (pacienteIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    if (await possuiConsultasAtivas(pacienteIDPar)) {
      return { msg: "Paciente possui consultas ativas.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE pacientes SET removido = true WHERE id = $1 AND removido = false",
        [pacienteIDPar]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPacientes|DeletePaciente]", error.detail || error.message);
    msg = "Não foi possível remover o paciente.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllPacientes,
  GetPacienteByID,
  InsertPaciente,
  UpdatePaciente,
  DeletePaciente,
};
