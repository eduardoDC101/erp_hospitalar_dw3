document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('pacientesListagem');
  var alertBox = document.getElementById('pacientesAlert');

  if (!listagem) {
    return;
  }

  vwGetAllPacientes(listagem.dataset.servidorDw3, alertBox);
  configurarOperacoesPacientes();
});

function formatarData(valor) {
  if (!valor) {
    return '';
  }

  return new Date(String(valor).slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR');
}

async function vwGetAllPacientes(servidorDw3, alertBox) {
  var carregando = document.getElementById('pacientesCarregando');
  var listagem = document.getElementById('pacientesListagem');

  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllPacientes', {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    if (carregando) {
      carregando.classList.add('d-none');
    }
    if (listagem) {
      listagem.classList.remove('d-none');
    }

    inicializarTabelaPacientes(data.registro);
  } catch (error) {
    if (carregando) {
      carregando.classList.add('d-none');
    }
    exibirErro(alertBox, error.message || 'Erro ao carregar pacientes.');
  }
}

function inicializarTabelaPacientes(pacientes) {
  new DataTable('#tblPacientes', {
    data: pacientes,
    columns: [
      { data: 'nome', defaultContent: '' },
      { data: 'cpf', defaultContent: '' },
      { data: 'telefone', defaultContent: '' },
      {
        data: 'data_nascimento',
        defaultContent: '',
        render: function(data) {
          return formatarData(data);
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var pacienteId = escaparHtml(row.id || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações do paciente">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-id="' + pacienteId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-id="' + pacienteId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-id="' + pacienteId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum paciente cadastrado.',
      info: 'Mostrando _START_ até _END_ de _TOTAL_ registros',
      infoEmpty: 'Mostrando 0 até 0 de 0 registros',
      infoFiltered: '(filtrado de _MAX_ registros no total)',
      lengthMenu: 'Mostrar _MENU_ registros',
      loadingRecords: 'Carregando...',
      processing: 'Processando...',
      search: 'Pesquisar:',
      zeroRecords: 'Nenhum registro encontrado',
      paginate: {
        first: 'Primeiro',
        last: 'Último',
        next: 'Próximo',
        previous: 'Anterior'
      }
    }
  });
}

function configurarOperacoesPacientes() {
  var tabela = document.getElementById('tblPacientes');

  if (!tabela) {
    return;
  }

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-id]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var pacienteId = botao.dataset.id;

    if (action === 'visualizar') {
      window.location.href = '/pacientes/form?oper=Re&id=' + encodeURIComponent(pacienteId);
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/pacientes/form?oper=Up&id=' + encodeURIComponent(pacienteId);
      return;
    }

    if (action === 'remover') {
      window.location.href = '/pacientes/form?oper=De&id=' + encodeURIComponent(pacienteId);
    }
  });
}

function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function exibirErro(alertBox, mensagem) {
  if (!alertBox) {
    return;
  }

  alertBox.textContent = mensagem;
  alertBox.classList.remove('alert-info');
  alertBox.classList.add('alert-danger');
  alertBox.classList.remove('d-none');
}
