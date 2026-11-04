document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmPacientes');

  if (!form) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var oper = parametros.get('oper') || parametros.get('Oper');
  var btnInserir = document.getElementById('btnInserirPaciente');
  var btnAtualizar = document.getElementById('btnAtualizarPaciente');
  var btnRemover = document.getElementById('btnRemoverPaciente');
  var titulo = document.getElementById('tituloFormulario');

  if (oper === 'Cr') {
    titulo.textContent = 'Cadastrar paciente';
    btnInserir.classList.remove('d-none');
    btnInserir.addEventListener('click', function() {
      vwInsertPaciente();
    });
  }

  if (oper === 'Re') {
    titulo.textContent = 'Consultar paciente';
    definirSomenteLeitura(true);
    await vwGetPacienteByID();
  }

  if (oper === 'Up') {
    titulo.textContent = 'Atualizar paciente';
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetPacienteByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdatePaciente();
    });
  }

  if (oper === 'De') {
    titulo.textContent = 'Remover paciente';
    btnRemover.classList.remove('d-none');
    definirSomenteLeitura(true);
    btnRemover.disabled = !(await vwGetPacienteByID());
    btnRemover.addEventListener('click', function() {
      vwDeletePaciente();
    });
  }
});

function definirSomenteLeitura(ativo) {
  ['nome', 'cpf', 'telefone', 'data_nascimento'].forEach(function(campoId) {
    document.getElementById(campoId).disabled = ativo;
  });
}

function mostrarId(valor) {
  document.getElementById('grupoId').classList.remove('d-none');
  document.getElementById('id').value = valor;
  document.getElementById('idVisivel').value = valor;
}

function montarPacienteDoFormulario() {
  return {
    nome: document.getElementById('nome').value.trim(),
    cpf: document.getElementById('cpf').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    data_nascimento: document.getElementById('data_nascimento').value,
    removido: false
  };
}

function lerIdDaUrl() {
  var pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!pacienteId || !/^\d+$/.test(pacienteId) || Number(pacienteId) <= 0) {
    throw new Error('ID do paciente inválido.');
  }

  return pacienteId;
}

async function vwInsertPaciente() {
  var form = document.getElementById('frmPacientes');
  var btnInserir = document.getElementById('btnInserirPaciente');

  try {
    if (!form.reportValidity()) {
      return;
    }

    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    btnInserir.disabled = true;

    var response = await fetch(servidorDw3 + '/insertPaciente', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPacienteDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível inserir o paciente.');
    }

    alert('Paciente cadastrado com sucesso.');
    window.location.href = '/pacientes';
  } catch (error) {
    alert(error.message || 'Erro ao inserir paciente.');
  } finally {
    btnInserir.disabled = false;
  }
}

async function vwGetPacienteByID() {
  var form = document.getElementById('frmPacientes');

  try {
    var pacienteId = lerIdDaUrl();
    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getPacienteByID/' + encodeURIComponent(pacienteId), {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    var paciente = data.registro[0];

    if (!paciente) {
      throw new Error('Paciente não encontrado.');
    }

    mostrarId(paciente.id);
    document.getElementById('nome').value = paciente.nome ?? '';
    document.getElementById('cpf').value = paciente.cpf ?? '';
    document.getElementById('telefone').value = paciente.telefone ?? '';
    document.getElementById('data_nascimento').value = paciente.data_nascimento ? String(paciente.data_nascimento).slice(0, 10) : '';
    document.getElementById('removido').value = String(paciente.removido === true);
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar paciente.');
    return false;
  }
}

async function vwUpdatePaciente() {
  var form = document.getElementById('frmPacientes');
  var btnAtualizar = document.getElementById('btnAtualizarPaciente');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var pacienteId = lerIdDaUrl();
    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    btnAtualizar.disabled = true;

    var response = await fetch(servidorDw3 + '/updatePaciente/' + encodeURIComponent(pacienteId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPacienteDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível atualizar o paciente.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum paciente foi atualizado.');
    }

    alert('Paciente atualizado com sucesso.');
  } catch (error) {
    alert(error.message || 'Erro ao atualizar paciente.');
  } finally {
    btnAtualizar.disabled = false;
  }
}

async function vwDeletePaciente() {
  var form = document.getElementById('frmPacientes');
  var btnRemover = document.getElementById('btnRemoverPaciente');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste paciente? O registro permanece no banco, apenas marcado como removido.')) {
    return;
  }

  try {
    var pacienteId = document.getElementById('id').value;
    var servidorDw3 = form.dataset.servidorDw3;

    if (!pacienteId || !/^\d+$/.test(pacienteId) || Number(pacienteId) <= 0) {
      throw new Error('ID do paciente inválido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    btnRemover.disabled = true;

    var response = await fetch(servidorDw3 + '/deletePaciente/' + encodeURIComponent(pacienteId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível remover o paciente.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum paciente foi removido.');
    }

    alert('Paciente removido.');
    window.location.href = '/pacientes';
  } catch (error) {
    alert(error.message || 'Erro ao remover paciente.');
    btnRemover.disabled = false;
  }
}
