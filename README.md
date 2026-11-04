# Sistema de Gestão Hospitalar

Sistema de pacientes e consultas, feito para a matéria de Desenvolvimento Web 3.

## O que o sistema guarda:

- `pacientes`: `id`, `nome`, `cpf`, `telefone`, `data_nascimento`, `removido`.
- `consultas`: `id`, `pacienteid`, `descricao`, `valor numeric(12,2)`, `data_consulta`, `removido`.
- Um paciente pode ter várias consultas.
- `usuarios` serve só para o login, não é uma das duas tabelas do CRUD.

A exclusão muda `removido` para `true`, a linha continua no banco. Um paciente só pode ser removido depois que todas as suas consultas forem removidas.

## Arquitetura

São duas aplicações independentes:

- Backend em Node.js e Express, na porta **40000**.
- Frontend em Node.js e Express, na porta **40100**.
- PostgreSQL 16 instalado e em execução no Windows, fora do Docker.

A imagem usada nos Dockerfiles é `node:24-bookworm-slim`. Com Docker, a máquina não precisa ter o Node.js instalado.

O navegador acessa o frontend em http://localhost:40100. O frontend chama o backend em `http://localhost:40000`, na máquina local. O container do backend alcança o PostgreSQL do Windows pelo nome `host.docker.internal`.

## Pré-requisitos

Para executar com Docker:

- Docker Desktop, com o backend WSL2 funcionando.
- PostgreSQL 16 em execução no Windows.

Para executar sem Docker, o requisito local continua sendo Node.js 18 ou superior, além do PostgreSQL em execução.

## Configuração

No PowerShell, a partir da pasta do projeto, crie o banco e aplique o script:

```powershell
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$env:PGCLIENTENCODING = "UTF8"
& $psql -h localhost -U postgres -d postgres -c "CREATE DATABASE erp_hospitalar;"
& $psql -h localhost -U postgres -d erp_hospitalar -f ".\dw3backend\database\databaseConfig.sql"
```

Crie os arquivos reais de ambiente a partir dos exemplos e preencha a senha do PostgreSQL e o segredo do JWT. Não grave esses valores no repositório: `.env` e `dw3frontend.env` estão no `.gitignore`.

```powershell
Copy-Item .\dw3backend\.env.example .\dw3backend\.env
Copy-Item .\dw3frontend\dw3frontend.env.example .\dw3frontend\dw3frontend.env
```

Variáveis do back-end, em `dw3backend/.env`: `PORT`, `SECRET_API`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`.

Variável do front-end, em `dw3frontend/dw3frontend.env`: `SERVIDOR_DW3=http://localhost:40000`. O exemplo também traz `APP_NAME` e `PORT`.

No `.env` local, `DB_HOST` permanece `localhost`, para a execução sem Docker. No `docker run` do backend, o parâmetro `-e DB_HOST=host.docker.internal` substitui esse valor somente dentro do container. Esse nome permite que o backend em container alcance o PostgreSQL instalado no Windows. A porta publicada do backend é **40000** e a do frontend é **40100**.

### PostgreSQL acessível a partir do Docker Desktop

O banco continua só no Windows. O container do backend chega nele por `host.docker.internal` e pela porta definida em `DB_PORT` (5432 no exemplo).

Para aceitar essa conexão sem abrir o PostgreSQL para a rede externa:

- Mantenha o serviço do PostgreSQL 16 em execução no Windows.
- Em `postgresql.conf`, faça `listen_addresses` aceitar a interface local pela qual o Docker Desktop entrega a conexão. Não use escuta aberta para qualquer endereço da rede se a máquina estiver acessível fora do laboratório.
- Em `pg_hba.conf`, autorize somente a rede virtual do Docker Desktop com WSL2, com autenticação por senha (`scram-sha-256`). Não use o método `trust` e não libere `0.0.0.0/0`.
- O usuário, a senha e o banco dessa regra devem ser os mesmos de `DB_USER`, `DB_PASS` e `DB_NAME`.
- Depois de alterar os dois arquivos, reinicie o serviço do PostgreSQL 16 no Windows.

## Execução com Docker

Este é o procedimento principal. Cada comando de build e de execução roda no diretório da aplicação correspondente, com os arquivos de ambiente já criados.

Construa a imagem do backend em `dw3backend`:

```powershell
cd dw3backend
docker build -t dw3backend_img:1.0 .
```

Construa a imagem do frontend em `dw3frontend`. Se o terminal ainda estiver em `dw3backend`:

```powershell
cd ..\dw3frontend
docker build -t dw3frontend_img:1.0 .
```

Inicie o backend em `dw3backend`, onde está o arquivo `.env`:

```powershell
cd ..\dw3backend
docker run -d --name dw3backend_ctner --add-host host.docker.internal:host-gateway --env-file .env -e DB_HOST=host.docker.internal -e PORT=40000 -p 40000:40000 --restart unless-stopped dw3backend_img:1.0
```

Inicie o frontend em `dw3frontend`, onde está o arquivo `dw3frontend.env`:

```powershell
cd ..\dw3frontend
docker run -d --name dw3frontend_ctner --env-file dw3frontend.env -e PORT=40100 -e SERVIDOR_DW3=http://localhost:40000 -p 40100:40100 --restart unless-stopped dw3frontend_img:1.0
```

`--restart unless-stopped` faz o Docker reiniciar o container, exceto quando ele é parado manualmente. `--add-host host.docker.internal:host-gateway` entra só no backend.

### Verificação e testes

Na raiz do projeto, ou em qualquer diretório, estes comandos consultam os containers já criados:

```powershell
docker ps
docker logs dw3backend_ctner
docker logs dw3frontend_ctner
docker exec dw3backend_ctner node tests/testarApis.js
```

- Frontend: http://localhost:40100
- Backend: http://localhost:40000

A rota `/` do frontend responde com redirecionamento para `/home`. O login fica em http://localhost:40100/login. As listagens ficam em http://localhost:40100/pacientes e http://localhost:40100/consultas.

A suíte cria um paciente e uma consulta, altera esses registros e depois os exclui de forma lógica (`removido = true`). Ela também autentica com JWT e recusa pedido sem token ou com token inválido. Use apenas o banco de desenvolvimento `erp_hospitalar`. O resultado depende do banco e dos containers estarem disponíveis no momento da execução.

## Docker Compose (alternativa)

O arquivo `compose.yaml`, na raiz, sobe os mesmos dois serviços sem substituir o procedimento acima. O Compose publica as portas **40000** e **40100**, lê `dw3backend/.env` e `dw3frontend/dw3frontend.env`, define `DB_HOST=host.docker.internal` no backend e mantém `SERVIDOR_DW3=http://localhost:40000` no frontend. O PostgreSQL não faz parte do Compose.

Na raiz do projeto:

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs
docker compose down
```

- `docker compose config` valida o `compose.yaml` e a leitura dos arquivos de ambiente.
- `docker compose build` constrói as imagens do backend e do frontend a partir dos Dockerfiles.
- `docker compose up -d` inicia os dois containers em segundo plano.
- `docker compose ps` mostra se continuam em execução e quais portas foram publicadas.
- `docker compose logs` mostra a saída dos serviços. Para um deles: `docker compose logs backend` ou `docker compose logs frontend`.
- `docker compose down` para e remove os containers deste Compose e a rede criada por ele. Não apaga o PostgreSQL nem os dados do banco no Windows, e não remove as imagens.

Com os serviços do Compose em execução, a suíte pode ser chamada assim:

```powershell
docker compose exec -T backend node tests/testarApis.js
```

## Testes sem Docker

Com o backend local no ar:

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
