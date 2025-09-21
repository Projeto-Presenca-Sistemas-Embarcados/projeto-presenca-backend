# Documentação da API - Sistema de Presença

## 📋 Índice

- [Autenticação JWT](#-autenticação-jwt)
- [Validação de Campos](#-validação-de-campos)
- [Isolamento por Professor](#-isolamento-por-professor)
- [Endpoints da API](#-endpoints-da-api)
- [Códigos de Erro](#-códigos-de-erro)
- [Exemplos de Uso](#-exemplos-de-uso)

---

## 🔐 Autenticação JWT

### Funcionalidades

- **Login/Logout** com tokens de acesso (15 min) e refresh (7 dias)
- **Registro** de novos professores
- **Hash de senhas** com bcrypt
- **Middleware de autenticação** para proteger rotas
- **Validação de força de senha**
- **Alteração de senha** com invalidação de tokens

### Endpoints de Autenticação

#### 1. Registro de Professor

```bash
POST /auth/register
```

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "MinhaSenh@123",
  "tagId": "TAG001"
}
```

#### 2. Login

```bash
POST /auth/login
```

**Body:**

```json
{
  "email": "joao@exemplo.com",
  "password": "MinhaSenh@123"
}
```

#### 3. Renovar Token

```bash
POST /auth/refresh
```

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Alterar Senha

```bash
POST /auth/change-password
```

**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "currentPassword": "MinhaSenh@123",
  "newPassword": "NovaSenh@456"
}
```

### Critérios de Senha

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

---

## ✅ Validação de Campos

### Tipos de Validação

1. **Campos Obrigatórios** - Verifica se todos os campos necessários estão presentes
2. **Tipos de Dados** - Valida se os campos têm os tipos corretos (string, number, boolean, email)
3. **Comprimento de Strings** - Valida comprimento mínimo e máximo
4. **Formato de Email** - Valida se o email está em formato válido

### Estrutura de Resposta de Erro

```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "nomeDoCampo",
      "message": "Descrição do erro",
      "code": "CODIGO_DO_ERRO"
    }
  ]
}
```

### Exemplos de Validação

#### Registro com Campos Faltando

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "email": "teste@exemplo.com"}'
```

**Resposta:**

```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "password",
      "message": "Campo 'password' é obrigatório",
      "code": "REQUIRED_FIELD_MISSING"
    },
    {
      "field": "tagId",
      "message": "Campo 'tagId' é obrigatório",
      "code": "REQUIRED_FIELD_MISSING"
    }
  ]
}
```

#### Email Inválido

```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Campo 'email' deve ser um email válido",
      "code": "INVALID_EMAIL_FORMAT"
    }
  ]
}
```

---

## 🛡️ Isolamento por Professor

### Funcionalidades de Segurança

- **Filtro Automático** - Cada professor vê apenas suas próprias aulas
- **Criação Automática** - Lições são automaticamente associadas ao professor autenticado
- **Controle de Acesso** - Verificação rigorosa de permissões em todas as operações

### Como Funciona

O sistema usa o token JWT para identificar o professor e:

- Filtra automaticamente as consultas por `teacherId`
- Verifica permissões antes de qualquer operação
- Associa automaticamente novos recursos ao professor correto
- Retorna erros claros para tentativas de acesso não autorizado

### Exemplo de Isolamento

#### Professor A cria uma lição:

```bash
curl -X POST http://localhost:3000/lessons \
  -H "Authorization: Bearer <token_professor_A>" \
  -H "Content-Type: application/json" \
  -d '{
    "room": "A101",
    "subject": "Matemática",
    "startTime": "2024-01-01T08:00:00Z",
    "endTime": "2024-01-01T10:00:00Z"
  }'
```

#### Professor B tenta acessar a lição do Professor A:

```bash
curl -X GET http://localhost:3000/lessons/1 \
  -H "Authorization: Bearer <token_professor_B>"
```

**Resposta de Erro:**

```json
{
  "error": "Você só pode acessar suas próprias aulas",
  "code": "FORBIDDEN_ACCESS"
}
```

---

## 🚀 Endpoints da API

### Autenticação

| Método | Endpoint                | Descrição           | Autenticação |
| ------ | ----------------------- | ------------------- | ------------ |
| POST   | `/auth/register`        | Registrar professor | ❌           |
| POST   | `/auth/login`           | Fazer login         | ❌           |
| POST   | `/auth/refresh`         | Renovar token       | ❌           |
| POST   | `/auth/logout`          | Fazer logout        | ✅           |
| POST   | `/auth/change-password` | Alterar senha       | ✅           |

### Professores

| Método | Endpoint        | Descrição                  | Autenticação |
| ------ | --------------- | -------------------------- | ------------ |
| GET    | `/teachers`     | Listar professores         | ✅           |
| POST   | `/teachers`     | Criar professor            | ✅           |
| GET    | `/teachers/:id` | Obter professor específico | ✅           |

### Estudantes

| Método | Endpoint               | Descrição                  | Autenticação |
| ------ | ---------------------- | -------------------------- | ------------ |
| GET    | `/students`            | Listar estudantes          | ✅           |
| POST   | `/students`            | Criar estudante            | ✅           |
| GET    | `/students/:id`        | Obter estudante específico | ✅           |
| GET    | `/students/tag/:tagId` | Buscar por tag (RFID/NFC)  | ❌           |

### Lições

| Método | Endpoint                      | Descrição                  | Autenticação |
| ------ | ----------------------------- | -------------------------- | ------------ |
| GET    | `/lessons`                    | Listar lições do professor | ✅           |
| POST   | `/lessons`                    | Criar lição                | ✅           |
| GET    | `/lessons/:id`                | Obter lição específica     | ✅           |
| GET    | `/lessons/teacher/:teacherId` | Lições de um professor     | ✅           |
| POST   | `/lessons/:id/open`           | Abrir lição                | ✅           |
| POST   | `/lessons/:id/close`          | Fechar lição               | ✅           |
| GET    | `/lessons/:id/students`       | Alunos de uma lição        | ✅           |
| POST   | `/lessons/:id/attendance`     | Marcar presença            | ✅           |

---

## ❌ Códigos de Erro

### Autenticação

| Código                     | Descrição                     |
| -------------------------- | ----------------------------- |
| `MISSING_CREDENTIALS`      | Email ou senha não fornecidos |
| `INVALID_CREDENTIALS`      | Email ou senha inválidos      |
| `MISSING_TOKEN`            | Token não fornecido           |
| `INVALID_TOKEN`            | Token inválido ou expirado    |
| `USER_NOT_FOUND`           | Usuário não encontrado        |
| `TOKEN_INVALIDATED`        | Token foi invalidado          |
| `AUTHENTICATION_REQUIRED`  | Autenticação necessária       |
| `INSUFFICIENT_PERMISSIONS` | Permissões insuficientes      |

### Validação

| Código                   | Descrição                       |
| ------------------------ | ------------------------------- |
| `VALIDATION_ERROR`       | Dados inválidos                 |
| `REQUIRED_FIELD_MISSING` | Campo obrigatório não fornecido |
| `INVALID_FIELD_TYPE`     | Tipo de campo incorreto         |
| `INVALID_EMAIL_FORMAT`   | Formato de email inválido       |
| `FIELD_TOO_SHORT`        | Campo muito curto               |
| `FIELD_TOO_LONG`         | Campo muito longo               |
| `WEAK_PASSWORD`          | Senha não atende aos critérios  |

### Negócio

| Código                 | Descrição                                       |
| ---------------------- | ----------------------------------------------- |
| `EMAIL_ALREADY_EXISTS` | Email já está em uso                            |
| `TAG_ALREADY_EXISTS`   | Tag ID já está em uso                           |
| `FORBIDDEN_ACCESS`     | Tentativa de acessar recurso de outro professor |
| `LESSON_NOT_FOUND`     | Aula não encontrada                             |
| `LESSON_NOT_OPEN`      | Aula não está aberta                            |
| `STUDENT_NOT_FOUND`    | Estudante não encontrado                        |
| `TEACHER_NOT_FOUND`    | Professor não encontrado                        |

---

## 📝 Exemplos de Uso

### 1. Fluxo Completo de Autenticação

```bash
# 1. Registrar professor
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "password": "MinhaSenh@123",
    "tagId": "TAG001"
  }'

# 2. Fazer login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "password": "MinhaSenh@123"
  }'

# 3. Usar token em requisições
curl -X GET http://localhost:3000/lessons \
  -H "Authorization: Bearer <access_token>"
```

### 2. Gerenciamento de Lições

```bash
# Criar lição
curl -X POST http://localhost:3000/lessons \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room": "A101",
    "subject": "Matemática",
    "startTime": "2024-01-01T08:00:00Z",
    "endTime": "2024-01-01T10:00:00Z"
  }'

# Abrir lição para presença
curl -X POST http://localhost:3000/lessons/1/open \
  -H "Authorization: Bearer <token>"

# Marcar presença
curl -X POST http://localhost:3000/lessons/1/attendance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "present": true
  }'

# Fechar lição
curl -X POST http://localhost:3000/lessons/1/close \
  -H "Authorization: Bearer <token>"
```

### 3. Gerenciamento de Estudantes

```bash
# Criar estudante
curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "tagId": "STUDENT001"
  }'

# Buscar estudante por tag (RFID/NFC)
curl -X GET http://localhost:3000/students/tag/STUDENT001
```

---

## ⚙️ Configuração

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

---

## 🔄 Tempo de Expiração dos Tokens

- **Access Token**: 15 minutos
- **Refresh Token**: 7 dias

Os tokens são automaticamente renovados quando necessário usando o refresh token.

---

## 📊 Resumo das Funcionalidades

### ✅ Implementado

- [x] Autenticação JWT completa
- [x] Validação robusta de campos
- [x] Isolamento por professor
- [x] Hash de senhas com bcrypt
- [x] Middleware de autenticação
- [x] Controle de acesso granular
- [x] Tratamento de erros padronizado
- [x] Documentação completa

### 🎯 Benefícios

- **Segurança**: Sistema robusto com isolamento de dados
- **Usabilidade**: Validação clara e mensagens de erro específicas
- **Manutenibilidade**: Código organizado e bem documentado
- **Escalabilidade**: Arquitetura preparada para crescimento
- **Auditoria**: Rastreamento completo de operações

---

_Documentação atualizada em: 21/09/2025_
