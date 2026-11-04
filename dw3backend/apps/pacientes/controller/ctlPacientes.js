const mdlPacientes = require("../model/mdlPacientes");

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

function validarPaciente(registro) {
  registro.nome = String(registro.nome || "").trim();
  registro.cpf = String(registro.cpf || "").trim();
  registro.telefone = String(registro.telefone || "").trim();

  if (!registro.nome || registro.nome.length > 100) {
    return "Informe o nome do paciente com até 100 caracteres.";
  }

  if (!/^\d{11}$/.test(registro.cpf)) {
    return "Informe o CPF com exatamente 11 dígitos numéricos.";
  }

  if (registro.telefone && (registro.telefone.length > 20 || !/^[0-9 ()+-]+$/.test(registro.telefone))) {
    return "Informe um telefone válido ou deixe o campo vazio.";
  }

  if (!registro.telefone) {
    registro.telefone = null;
  }

  const data = validarData(registro.data_nascimento);
  if (!data) {
    return "Informe uma data de nascimento válida.";
  }

  registro.data_nascimento = data;
  return "";
}

function concluirEscrita(res, resultado, mensagemVazia) {
  let msg = resultado.msg;
  if (msg === "ok" && resultado.linhasAfetadas === 0) {
    msg = mensagemVazia;
  }

  res.json({ status: msg, linhasAfetadas: resultado.linhasAfetadas });
}

const GetAllPacientes = (req, res) =>
  (async () => {
    try {
      let registro = await mdlPacientes.GetAllPacientes();
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlPacientes|GetAllPacientes]", error.message);
      res.json({ status: "Não foi possível consultar os pacientes.", registro: [] });
    }
  })();

const GetPacienteByID = (req, res) =>
  (async () => {
    try {
      const pacienteID = lerID(req.params.id);
      if (!pacienteID) {
        return res.json({ status: "ID inválido.", registro: [] });
      }

      let registro = await mdlPacientes.GetPacienteByID(pacienteID);
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlPacientes|GetPacienteByID]", error.message);
      res.json({ status: "Não foi possível consultar o paciente.", registro: [] });
    }
  })();

const InsertPaciente = (request, res) =>
  (async () => {
    try {
      const pacienteREG = request.body || {};
      const erro = validarPaciente(pacienteREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlPacientes.InsertPaciente(pacienteREG);
      res.json({ status: resultado.msg, linhasAfetadas: resultado.linhasAfetadas });
    } catch (error) {
      console.error("[ctlPacientes|InsertPaciente]", error.message);
      res.json({ status: "Não foi possível inserir o paciente.", linhasAfetadas: -1 });
    }
  })();

const UpdatePaciente = (request, res) =>
  (async () => {
    try {
      const pacienteID = lerID(request.params.id);
      if (!pacienteID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      const pacienteREG = request.body || {};
      const erro = validarPaciente(pacienteREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlPacientes.UpdatePaciente(pacienteID, pacienteREG);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlPacientes|UpdatePaciente]", error.message);
      res.json({ status: "Não foi possível atualizar o paciente.", linhasAfetadas: -1 });
    }
  })();

const DeletePaciente = (request, res) =>
  (async () => {
    try {
      const pacienteID = lerID(request.params.id);
      if (!pacienteID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      let resultado = await mdlPacientes.DeletePaciente(pacienteID);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlPacientes|DeletePaciente]", error.message);
      res.json({ status: "Não foi possível remover o paciente.", linhasAfetadas: -1 });
    }
  })();

module.exports = {
  GetAllPacientes,
  GetPacienteByID,
  InsertPaciente,
  UpdatePaciente,
  DeletePaciente,
};
