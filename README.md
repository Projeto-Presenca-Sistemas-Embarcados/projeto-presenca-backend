# projeto-presenca-backend

Backend do sistema de presença utilizando Fastify e Prisma ORM.

## Tecnologias Utilizadas

- Node.js
- Fastify
- Prisma ORM
- TypeScript
- SQLite (banco de dados)

## Requisito

- [Node.js](https://nodejs.org/)

## Instalação

- Confira se você tem o Node.js instalado executando `node -v` no terminal. Se não estiver instalado, baixe e instale a partir do site oficial.

1. Clone o repositório:

```bash
git clone https://github.com/Projeto-Presenca-Sistemas-Embarcados/projeto-presenca-backend.git
```

2. Navegue até o diretório do projeto:

```bash
cd projeto-presenca-backend
```

3. Instale as dependências:

```bash
npm install
```

4. Configure o banco de dados:

- altere o nome do arquivo `.env.example` para `.env` e ajuste a variável `DATABASE_URL` conforme necessário.

5. Gere o cliente Prisma:

```bash
npx prisma generate
```

6. Execute as migrações do banco de dados:

```bash
npx prisma migrate deploy
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento com recarregamento automático.
- `npm run build`: Compila o código TypeScript para JavaScript.
- `npm run start`: Inicia o servidor a partir do código compilado.
- `npm run build:start`: Compila o código e inicia o servidor.
- `npm run format`: Formata o código utilizando Prettier.
