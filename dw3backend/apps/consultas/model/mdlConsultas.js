const db = require("../../../database/databaseconfig");

const GetAllConsultas = async () => {
  return (
    await db.query(
      "SELECT consultas.*, pacientes.nome AS nomepaciente " +
        "FROM consultas " +
        "INNER JOIN pacientes ON pacientes.id = consultas.pacienteid " +
        "WHERE consultas.removido = false " +
        "ORDER BY consultas.data_consulta ASC, consultas.descricao ASC"
    )
  ).rows;
};

const GetConsultaByID = async (consultaIDPar) => {
  return (
    await db.query(
      "SELECT consultas.*, pacientes.nome AS nomepaciente " +
        "FROM consultas " +
        "INNER JOIN pacientes ON pacientes.id = consultas.pacienteid " +
        "WHERE consultas.id = $1 AND consultas.removido = false",
      [consultaIDPar]
    )
  ).rows;
};

async function pacienteAtivo(pacienteIDPar) {
  const consulta = await db.query(
    "SELECT id FROM pacientes WHERE id = $1 AND removido = false",
    [pacienteIDPar]
  );
  return consulta.rowCount > 0;
}

const InsertConsulta = async (consultaREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    if (!(await pacienteAtivo(consultaREGPar.pacienteid))) {
      return { msg: "Paciente inexistente ou removido.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "INSERT INTO consultas (pacienteid, descricao, valor, data_consulta, removido) " +
          "VALUES ($1, $2, $3, $4, false)",
        [
          consultaREGPar.pacienteid,
          consultaREGPar.descricao,
          consultaREGPar.valor,
          consultaREGPar.data_consulta,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlConsultas|InsertConsulta]", error.detail || error.message);
    msg = "Não foi possível inserir a consulta.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const UpdateConsulta = async (consultaIDPar, consultaREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    if (!(await pacienteAtivo(consultaREGPar.pacienteid))) {
      return { msg: "Paciente inexistente ou removido.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE consultas SET pacienteid = $2, descricao = $3, valor = $4, data_consulta = $5 " +
          "WHERE id = $1 AND removido = false",
        [
          consultaIDPar,
          consultaREGPar.pacienteid,
          consultaREGPar.descricao,
          consultaREGPar.valor,
          consultaREGPar.data_consulta,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlConsultas|UpdateConsulta]", error.detail || error.message);
    msg = "Não foi possível atualizar a consulta.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const DeleteConsulta = async (consultaIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE consultas SET removido = true WHERE id = $1 AND removido = false",
        [consultaIDPar]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlConsultas|DeleteConsulta]", error.detail || error.message);
    msg = "Não foi possível remover a consulta.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllConsultas,
  GetConsultaByID,
  InsertConsulta,
  UpdateConsulta,
  DeleteConsulta,
};
