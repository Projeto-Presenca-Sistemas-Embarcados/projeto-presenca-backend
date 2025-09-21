# Documentação da API de Autenticação

## Visão Geral

Este sistema implementa autenticação JWT (JSON Web Token) com as seguintes funcionalidades:

- **Login/Logout** com tokens de acesso e refresh
- **Registro** de novos professores
- **Hash de senhas** com bcrypt
- **Middleware de autenticação** para proteger rotas
- **Validação de força de senha**
- **Alteração de senha** com invalidação de tokens

## Endpoints

### 1. Registro de Professor

**POST** `/auth/register`

Registra um novo professor no sistema.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "MinhaSenh@123",
  "tagId": "TAG001"
}
```

**Resposta de Sucesso (201):**

```json
{
  "message": "Registro realizado com sucesso",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "tagId": "TAG001",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Critérios de Senha:**

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

### 2. Login

**POST** `/auth/login`

Autentica um professor e retorna tokens JWT.

**Body:**

```json
{
  "email": "joao@exemplo.com",
  "password": "MinhaSenh@123"
}
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Renovar Token

**POST** `/auth/refresh`

Renova o token de acesso usando o refresh token.

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Tokens renovados com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout

**POST** `/auth/logout`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Logout realizado com sucesso"
}
```

### 5. Alterar Senha

**POST** `/auth/change-password`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Body:**

```json
{
  "currentPassword": "MinhaSenh@123",
  "newPassword": "NovaSenh@456"
}
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Senha alterada com sucesso. Faça login novamente."
}
```

## Rotas Protegidas

Todas as rotas abaixo requerem autenticação via header `Authorization: Bearer <token>`:

### Professores

- `GET /teachers` - Listar professores
- `POST /teachers` - Criar professor
- `GET /teachers/:id` - Obter professor específico

### Lições

- `GET /lessons` - Listar lições
- `POST /lessons` - Criar lição
- `GET /lessons/:id` - Obter lição específica
- `GET /lessons/teacher/:teacherId` - Lições de um professor
- `POST /lessons/:id/open` - Abrir lição
- `POST /lessons/:id/close` - Fechar lição
- `GET /lessons/:id/students` - Alunos de uma lição
- `POST /lessons/:id/attendance` - Marcar presença

### Estudantes

- `GET /students` - Listar estudantes
- `POST /students` - Criar estudante
- `GET /students/:id` - Obter estudante específico

### Rotas Públicas

- `GET /students/tag/:tagId` - Buscar estudante por tag (RFID/NFC)

## Códigos de Erro

| Código                     | Descrição                          |
| -------------------------- | ---------------------------------- |
| `MISSING_CREDENTIALS`      | Email ou senha não fornecidos      |
| `INVALID_CREDENTIALS`      | Email ou senha inválidos           |
| `MISSING_FIELDS`           | Campos obrigatórios não fornecidos |
| `WEAK_PASSWORD`            | Senha não atende aos critérios     |
| `EMAIL_ALREADY_EXISTS`     | Email já está em uso               |
| `TAG_ALREADY_EXISTS`       | Tag ID já está em uso              |
| `MISSING_TOKEN`            | Token não fornecido                |
| `INVALID_TOKEN`            | Token inválido ou expirado         |
| `USER_NOT_FOUND`           | Usuário não encontrado             |
| `TOKEN_INVALIDATED`        | Token foi invalidado               |
| `AUTHENTICATION_REQUIRED`  | Autenticação necessária            |
| `INSUFFICIENT_PERMISSIONS` | Permissões insuficientes           |

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# JWT Secrets (altere em produção)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Database
DATABASE_URL="file:./prisma/data.db"
```

### Segurança

1. **Altere as chaves JWT** em produção
2. **Use HTTPS** em produção
3. **Configure CORS** adequadamente
4. **Monitore tentativas de login** suspeitas
5. **Implemente rate limiting** se necessário

## Exemplo de Uso

```javascript
// 1. Registrar um professor
const registerResponse = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: 'MinhaSenh@123',
    tagId: 'TAG001',
  }),
});

// 2. Fazer login
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    password: 'MinhaSenh@123',
  }),
});

const { accessToken } = await loginResponse.json();

// 3. Usar token em requisições protegidas
const teachersResponse = await fetch('/teachers', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## Tempo de Expiração dos Tokens

- **Access Token**: 15 minutos
- **Refresh Token**: 7 dias

Os tokens são automaticamente renovados quando necessário usando o refresh token.

