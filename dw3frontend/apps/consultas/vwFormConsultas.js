document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmConsultas');

  if (!form) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var oper = parametros.get('oper') || parametros.get('Oper');
  var servidorDw3 = form.dataset.servidorDw3;
  var btnInserir = document.getElementById('btnInserirConsulta');
  var btnAtualizar = document.getElementById('btnAtualizarConsulta');
  var btnRemover = document.getElementById('btnRemoverConsulta');
  var titulo = document.getElementById('tituloFormulario');

  inicializarSelectPacientes();

  if (oper === 'Cr') {
    titulo.textContent = 'Cadastrar consulta';
    btnInserir.classList.remove('d-none');
    await vwGetAllPacientes(servidorDw3);
    btnInserir.addEventListener('click', function() {
      vwInsertConsulta();
    });
  }

  if (oper === 'Re') {
    titulo.textContent = 'Consultar consulta';
    definirSomenteLeitura(true);
    await vwGetConsultaByID();
  }

  if (oper === 'Up') {
    titulo.textContent = 'Atualizar consulta';
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetConsultaByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdateConsulta();
    });
  }

  if (oper === 'De') {
    titulo.textContent = 'Remover consulta';
    btnRemover.classList.remove('d-none');
    definirSomenteLeitura(true);
    btnRemover.disabled = !(await vwGetConsultaByID());
    btnRemover.addEventListener('click', function() {
      vwDeleteConsulta();
    });
  }
});

function inicializarSelectPacientes() {
  $('#pacienteid').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um paciente',
    width: '100%'
  });
}

function definirSomenteLeitura(ativo) {
  ['descricao', 'valor', 'data_consulta'].forEach(function(campoId) {
    document.getElementById(campoId).disabled = ativo;
  });
  $('#pacienteid').prop('disabled', ativo);
}

function mostrarId(valor) {
  document.getElementById('grupoId').classList.remove('d-none');
  document.getElementById('id').value = valor;
  document.getElementById('idVisivel').value = valor;
}

function montarConsultaDoFormulario() {
  return {
    pacienteid: document.getElementById('pacienteid').value,
    descricao: document.getElementById('descricao').value.trim(),
    valor: document.getElementById('valor').value,
    data_consulta: document.getElementById('data_consulta').value,
    removido: false
  };
}

function lerIdDaUrl() {
  var consultaId = new URLSearchParams(window.location.search).get('id');

  if (!consultaId || !/^\d+$/.test(consultaId) || Number(consultaId) <= 0) {
    throw new Error('ID da consulta inválido.');
  }

  return consultaId;
}

async function vwGetAllPacientes(servidorDw3) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllPacientes', {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    preencherSelectPacientes(data.registro);
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar pacientes.');
    return false;
  }
}

function preencherSelectPacientes(pacientes) {
  var pacienteSelect = document.getElementById('pacienteid');
  pacienteSelect.innerHTML = '<option value="">Selecione um paciente</option>';

  pacientes.forEach(function(paciente) {
    var option = document.createElement('option');
    option.value = paciente.id;
    option.textContent = paciente.nome;
    pacienteSelect.appendChild(option);
  });

  $('#pacienteid').trigger('change');
}

async function vwInsertConsulta() {
  var form = document.getElementById('frmConsultas');
  var btnInserir = document.getElementById('btnInserirConsulta');

  try {
    if (!form.reportValidity()) {
      return;
    }

    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    btnInserir.disabled = true;

    var response = await fetch(servidorDw3 + '/insertConsulta', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarConsultaDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível inserir a consulta.');
    }

    alert('Consulta cadastrada com sucesso.');
    window.location.href = '/consultas';
  } catch (error) {
    alert(error.message || 'Erro ao inserir consulta.');
  } finally {
    btnInserir.disabled = false;
  }
}

async function vwGetConsultaByID() {
  var form = document.getElementById('frmConsultas');

  try {
    var consultaId = lerIdDaUrl();
    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getConsultaByID/' + encodeURIComponent(consultaId), {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    var consulta = data.registro[0];

    if (!consulta) {
      throw new Error('Consulta não encontrada.');
    }

    if (!(await vwGetAllPacientes(servidorDw3))) {
      return false;
    }

    var pacienteSelect = document.getElementById('pacienteid');
    var pacienteJaListado = Array.from(pacienteSelect.options).some(function(opcao) {
      return opcao.value === String(consulta.pacienteid);
    });

    if (!pacienteJaListado) {
      var option = document.createElement('option');
      option.value = consulta.pacienteid;
      option.textContent = consulta.nomepaciente || ('Paciente ' + consulta.pacienteid);
      pacienteSelect.appendChild(option);
    }

    mostrarId(consulta.id);
    document.getElementById('descricao').value = consulta.descricao ?? '';
    document.getElementById('valor').value = consulta.valor ?? '';
    document.getElementById('data_consulta').value = consulta.data_consulta ? String(consulta.data_consulta).slice(0, 10) : '';
    document.getElementById('removido').value = String(consulta.removido === true);
    $('#pacienteid').val(String(consulta.pacienteid)).trigger('change');
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar consulta.');
    return false;
  }
}

async function vwUpdateConsulta() {
  var form = document.getElementById('frmConsultas');
  var btnAtualizar = document.getElementById('btnAtualizarConsulta');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var consultaId = lerIdDaUrl();
    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    btnAtualizar.disabled = true;

    var response = await fetch(servidorDw3 + '/updateConsulta/' + encodeURIComponent(consultaId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarConsultaDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível atualizar a consulta.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhuma consulta foi atualizada.');
    }

    alert('Consulta atualizada com sucesso.');
  } catch (error) {
    alert(error.message || 'Erro ao atualizar consulta.');
  } finally {
    btnAtualizar.disabled = false;
  }
}

async function vwDeleteConsulta() {
  var form = document.getElementById('frmConsultas');
  var btnRemover = document.getElementById('btnRemoverConsulta');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção desta consulta? O registro permanece no banco, apenas marcado como removido.')) {
    return;
  }

  try {
    var consultaId = document.getElementById('id').value;
    var servidorDw3 = form.dataset.servidorDw3;

    if (!consultaId || !/^\d+$/.test(consultaId) || Number(consultaId) <= 0) {
      throw new Error('ID da consulta inválido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    btnRemover.disabled = true;

    var response = await fetch(servidorDw3 + '/deleteConsulta/' + encodeURIComponent(consultaId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível remover a consulta.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhuma consulta foi removida.');
    }

    alert('Consulta removida.');
    window.location.href = '/consultas';
  } catch (error) {
    alert(error.message || 'Erro ao remover consulta.');
    btnRemover.disabled = false;
  }
}
