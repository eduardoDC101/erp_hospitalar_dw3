const mdlConsultas = require("../model/mdlConsultas");

function lerID(valor) {
  if (!/^\d+$/.test(String(valor || ""))) {
    return null;
  }

  const id = parseInt(valor, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function validarData(valor) {
  const data = String(valor || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return null;
  }

  const partes = data.split("-").map((parte) => parseInt(parte, 10));
  const conferida = new Date(partes[0], partes[1] - 1, partes[2]);
  if (
    conferida.getFullYear() !== partes[0] ||
    conferida.getMonth() !== partes[1] - 1 ||
    conferida.getDate() !== partes[2]
  ) {
    return null;
  }

  return data;
}

function validarConsulta(registro) {
  registro.descricao = String(registro.descricao || "").trim();
  registro.pacienteid = lerID(registro.pacienteid);

  if (!registro.pacienteid) {
    return "Selecione um paciente.";
  }

  if (!registro.descricao || registro.descricao.length > 500) {
    return "Informe a descrição da consulta com até 500 caracteres.";
  }

  const valorTexto = String(registro.valor === undefined || registro.valor === null ? "" : registro.valor)
    .trim()
    .replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(valorTexto)) {
    return "Informe um valor decimal válido, maior ou igual a zero, com até duas casas.";
  }

  registro.valor = valorTexto;

  const data = validarData(registro.data_consulta);
  if (!data) {
    return "Informe uma data de consulta válida.";
  }

  registro.data_consulta = data;
  return "";
}

function concluirEscrita(res, resultado, mensagemVazia) {
  let msg = resultado.msg;
  if (msg === "ok" && resultado.linhasAfetadas === 0) {
    msg = mensagemVazia;
  }

  res.json({ status: msg, linhasAfetadas: resultado.linhasAfetadas });
}

const GetAllConsultas = (req, res) =>
  (async () => {
    try {
      let registro = await mdlConsultas.GetAllConsultas();
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlConsultas|GetAllConsultas]", error.message);
      res.json({ status: "Não foi possível consultar as consultas.", registro: [] });
    }
  })();

const GetConsultaByID = (req, res) =>
  (async () => {
    try {
      const consultaID = lerID(req.params.id);
      if (!consultaID) {
        return res.json({ status: "ID inválido.", registro: [] });
      }

      let registro = await mdlConsultas.GetConsultaByID(consultaID);
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlConsultas|GetConsultaByID]", error.message);
      res.json({ status: "Não foi possível consultar a consulta.", registro: [] });
    }
  })();

const InsertConsulta = (request, res) =>
  (async () => {
    try {
      const consultaREG = request.body || {};
      const erro = validarConsulta(consultaREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlConsultas.InsertConsulta(consultaREG);
      res.json({ status: resultado.msg, linhasAfetadas: resultado.linhasAfetadas });
    } catch (error) {
      console.error("[ctlConsultas|InsertConsulta]", error.message);
      res.json({ status: "Não foi possível inserir a consulta.", linhasAfetadas: -1 });
    }
  })();

const UpdateConsulta = (request, res) =>
  (async () => {
    try {
      const consultaID = lerID(request.params.id);
      if (!consultaID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      const consultaREG = request.body || {};
      const erro = validarConsulta(consultaREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlConsultas.UpdateConsulta(consultaID, consultaREG);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlConsultas|UpdateConsulta]", error.message);
      res.json({ status: "Não foi possível atualizar a consulta.", linhasAfetadas: -1 });
    }
  })();

const DeleteConsulta = (request, res) =>
  (async () => {
    try {
      const consultaID = lerID(request.params.id);
      if (!consultaID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      let resultado = await mdlConsultas.DeleteConsulta(consultaID);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlConsultas|DeleteConsulta]", error.message);
      res.json({ status: "Não foi possível remover a consulta.", linhasAfetadas: -1 });
    }
  })();

module.exports = {
  GetAllConsultas,
  GetConsultaByID,
  InsertConsulta,
  UpdateConsulta,
  DeleteConsulta,
};
