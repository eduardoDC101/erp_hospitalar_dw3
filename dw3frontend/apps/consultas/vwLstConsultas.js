document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('consultasListagem');
  var alertBox = document.getElementById('consultasAlert');

  if (!listagem) {
    return;
  }

  vwGetAllConsultas(listagem.dataset.servidorDw3, alertBox);
  configurarOperacoesConsultas();
});

async function vwGetAllConsultas(servidorDw3, alertBox) {
  var carregando = document.getElementById('consultasCarregando');
  var listagem = document.getElementById('consultasListagem');

  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllConsultas', {
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

    inicializarTabelaConsultas(data.registro);
  } catch (error) {
    if (carregando) {
      carregando.classList.add('d-none');
    }
    exibirErro(alertBox, error.message || 'Erro ao carregar consultas.');
  }
}

function inicializarTabelaConsultas(consultas) {
  new DataTable('#tblConsultas', {
    data: consultas,
    columns: [
      { data: 'nomepaciente', defaultContent: '' },
      { data: 'descricao', defaultContent: '' },
      {
        data: 'valor',
        defaultContent: '',
        render: function(data) {
          if (data === null || data === undefined || data === '') {
            return '';
          }

          return Number(data).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          });
        }
      },
      {
        data: 'data_consulta',
        defaultContent: '',
        render: function(data) {
          if (!data) {
            return '';
          }

          return new Date(String(data).slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR');
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

          var consultaId = escaparHtml(row.id || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações da consulta">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-id="' + consultaId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-id="' + consultaId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-id="' + consultaId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhuma consulta cadastrada.',
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

function configurarOperacoesConsultas() {
  var tabela = document.getElementById('tblConsultas');

  if (!tabela) {
    return;
  }

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-id]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var consultaId = botao.dataset.id;

    if (action === 'visualizar') {
      window.location.href = '/consultas/form?oper=Re&id=' + encodeURIComponent(consultaId);
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/consultas/form?oper=Up&id=' + encodeURIComponent(consultaId);
      return;
    }

    if (action === 'remover') {
      window.location.href = '/consultas/form?oper=De&id=' + encodeURIComponent(consultaId);
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
