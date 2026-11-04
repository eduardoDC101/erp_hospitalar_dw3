# Sistema de Gestão Hospitalae

Sistema de pacientes e consultas, feito para a matéria de Desenvolvimento Web 3.

## O que o sistema guarda:

- `pacientes`: `id`, `nome`, `cpf`, `telefone`, `data_nascimento`, `removido`.
- `consultas`: `id`, `pacienteid`, `descricao`, `valor numeric(12,2)`, `data_consulta`, `removido`.
- Um paciente pode ter várias consultas.
- `usuarios` serve só para o login, não é uma das duas tabelas do CRUD.

A exclusão muda `removido` para `true`, a linha continua no banco. Um paciente só pode ser removido depois que todas as suas consultas forem removidas.

## Arquitetura

- Backend em Node.js e Express, publicado na porta **40000**.
- Frontend em Node.js e Express, publicado na porta **40100**.
- PostgreSQL 16 instalado e em execução no Windows, fora do Docker. O `compose.yaml` não sobe o banco.

No Docker, o `compose.yaml` define os serviços `backend` e `frontend`. O backend recebe `DB_HOST=host.docker.internal` para alcançar o PostgreSQL do Windows. O frontend recebe `SERVIDOR_DW3=http://localhost:40000`, endereço usado pelo navegador na máquina local.

## Pre-requisitos

Para executar com Docker:

- Docker Desktop.
- Docker Compose, pelo comando `docker compose`.
- PostgreSQL 16 em execução no Windows.
- Docker Desktop com o backend WSL2 funcionando.

A imagem dos dois serviços é `node:22-alpine`. Com Docker, a máquina não precisa ter o Node.js instalado.

Para executar sem Docker, o requisito local continua sendo Node.js 18 ou superior, além do PostgreSQL em execução. Essa forma não usa a imagem Node.js 22.

## Configuração

No PowerShell, a partir da pasta do projeto, crie o banco e aplique o script:

```powershell
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$env:PGCLIENTENCODING = "UTF8"
& $psql -h localhost -U postgres -d postgres -c "CREATE DATABASE erp_hospitalar;"
& $psql -h localhost -U postgres -d erp_hospitalar -f ".\dw3backend\database\databaseConfig.sql"
```

Crie os arquivos locais a partir dos exemplos e preencha a senha do PostgreSQL e o segredo do JWT. Não grave esses valores no repositório: `.env` e `dw3frontend.env` estão no `.gitignore`.

```powershell
Copy-Item .\dw3backend\.env.example .\dw3backend\.env
Copy-Item .\dw3frontend\dw3frontend.env.example .\dw3frontend\dw3frontend.env
```

Variáveis do back-end, em `dw3backend/.env`: `PORT`, `SECRET_API`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`.

Variável do front-end, em `dw3frontend/dw3frontend.env`: `SERVIDOR_DW3=http://localhost:40000`. O exemplo também traz `APP_NAME` e `PORT`.

Na execução local, `DB_HOST` permanece `localhost`. Na execução com Docker, o `compose.yaml` substitui este valor por `host.docker.internal` e mantém `SERVIDOR_DW3` em `http://localhost:40000`. As portas publicadas também ficam fixas no Compose: `40000` no backend e `40100` no frontend.

### PostgreSQL acessível a partir do Docker Desktop

O banco continua só no Windows. O container do backend chega nele pelo nome `host.docker.internal` e pela porta definida em `DB_PORT` (5432 no exemplo).

Para aceitar essa conexão sem abrir o PostgreSQL para a rede externa:

- Mantenha o serviço do PostgreSQL 16 em execução no Windows.
- Em `postgresql.conf`, faça `listen_addresses` aceitar a interface local pela qual o Docker Desktop entrega a conexão. Não use escuta aberta para qualquer endereço da rede se a máquina estiver acessível fora do laboratório.
- Em `pg_hba.conf`, autorize somente a rede virtual do Docker Desktop com WSL2, com autenticação por senha (`scram-sha-256`). Não use o método `trust` e não libere `0.0.0.0/0`.
- O usuário, a senha e o banco dessa regra devem ser os mesmos de `DB_USER`, `DB_PASS` e `DB_NAME`.
- Depois de alterar os dois arquivos, reinicie o serviço do PostgreSQL 16 no Windows.

## Execução com Docker

Na raiz do projeto, com os arquivos de ambiente já criados:

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs
docker compose down
```

- `docker compose config` valida o `compose.yaml` e a leitura dos arquivos de ambiente.
- `docker compose build` constrói as imagens do backend e do frontend.
- `docker compose up -d` inicia os dois containers em segundo plano.
- `docker compose ps` mostra se continuam em execução e quais portas foram publicadas.
- `docker compose logs` mostra a saída dos serviços. Para um deles: `docker compose logs backend` ou `docker compose logs frontend`.
- `docker compose down` para e remove os containers deste Compose e a rede criada por ele. Não apaga o PostgreSQL nem os dados do banco no Windows, e não remove as imagens.

## Acesso

- Frontend: http://localhost:40100
- Backend: http://localhost:40000

A rota `/` do frontend responde com redirecionamento para `/home`. O login fica em http://localhost:40100/login.

## Testes

Com os containers em execução, a suíte do backend roda dentro do container:

```powershell
docker compose exec -T backend node tests/testarApis.js
```

Os testes criam um paciente e uma consulta, alteram esses registros e depois os excluem de forma lógica (`removido = true`). Eles também autenticam com JWT e recusam pedido sem token ou com token inválido. Use apenas o banco de desenvolvimento `erp_hospitalar`.

Sem Docker, com o backend local no ar:

```powershell
cd .\dw3backend
node tests\testarApis.js
```

Os arquivos `.rest`, para o REST Client do VS Code, estão em:

- `dw3backend/apps/login/tests/testLogin.rest`
- `dw3backend/apps/pacientes/tests/testPacientes.rest`
- `dw3backend/apps/consultas/tests/testConsultas.rest`

Rode primeiro o pedido nomeado `loginAutenticado`. Os demais usam o token dessa resposta. Alguns pedidos de exclusão alteram os dados de exemplo.

## Execução sem Docker

Abra dois terminais, a partir da pasta do projeto.

```powershell
cd .\dw3backend
npm install
npm start
```

```powershell
cd .\dw3frontend
npm install
npm start
```

- API: http://localhost:40000
- Telas: http://localhost:40100
