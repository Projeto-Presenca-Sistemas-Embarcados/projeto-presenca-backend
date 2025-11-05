# API do Sistema de Presença

## Endpoints Disponíveis

### 🎓 **Aulas (Lessons)**

#### Listar todas as aulas

```
GET /lessons
```

Retorna todas as aulas com informações do professor e alunos.

#### Criar nova aula

```
POST /lessons
```

Body:

```json
{
  "room": "Sala 101",
  "subject": "Matemática",
  "teacherId": 1,
  "startTime": "2024-01-15T08:00:00Z",
  "endTime": "2024-01-15T10:00:00Z"
}
```

#### Obter aula específica

```
GET /lessons/:id
```

#### Listar aulas de um professor

```
GET /lessons/teacher/:teacherId
```

#### Abrir aula (permitir marcação de presença)

```
POST /lessons/:id/open
```

#### Fechar aula (finalizar marcação de presença)

```
POST /lessons/:id/close
```

#### Listar alunos de uma aula

```
GET /lessons/:id/students
```

#### Marcar presença de um aluno pela tag (RFID/NFC)

```
POST /lessons/:id/attendance-tag
```

Body:

```json
{
  "tagId": "TAG123456"
}
```

Marca o aluno como presente com base na tag cadastrada.

Requer que a aula esteja aberta.

Possíveis respostas de erro:

- 400: Aula não está aberta para marcação de presença — `{ "error": "Aula não está aberta para marcação de presença" }`
- 404: Aula não encontrada — `{ "error": "Aula não encontrada" }`
- 404: Aluno não encontrado — `{ "error": "Aluno não encontrado" }`
- 400: Erro de validação (corpo/parâmetros inválidos) — ver seção "Formato de erros de validação" abaixo

#### Marcar presença de um aluno (por ID)

```
POST /lessons/:id/attendance
```

Body:

```json
{
  "studentId": 1,
  "present": true
}
```

Requer que a aula esteja aberta.

Possíveis respostas de erro:

- 400: Aula não está aberta para marcação de presença — `{ "error": "Aula não está aberta para marcação de presença" }`
- 404: Aula não encontrada — `{ "error": "Aula não encontrada" }`
- 404: Aluno não encontrado — `{ "error": "Aluno não encontrado" }` (se o ID não existir)
- 400: Erro de validação (corpo/parâmetros inválidos) — ver seção "Formato de erros de validação" abaixo

### 👨‍🏫 **Professores (Teachers)**

#### Listar todos os professores

```
GET /teachers
```

#### Criar novo professor

```
POST /teachers
```

Body:

```json
{
  "name": "João Silva",
  "email": "joao@escola.com",
  "password": "senha123",
  "tagId": "TAG001",
  "startTime": "08:00"
}
```

Respostas de erro frequentes:

- 409: Email já está em uso — `{ "error": "Email já está em uso" }`
- 409: Tag ID já está em uso — `{ "error": "Tag ID já está em uso" }`
- 400: Erro de validação (campos ausentes/formatos inválidos)

#### Obter professor específico

```
GET /teachers/:id
```

### 👨‍🎓 **Alunos (Students)**

#### Listar todos os alunos

```
GET /students
```

#### Criar novo aluno

```
POST /students
```

Body:

```json
{
  "name": "Maria Santos",
  "tagId": "TAG002",
  "startTime": "08:00"
}
```

Respostas de erro frequentes:

- 409: Tag ID já cadastrado — `{ "error": "Tag ID já cadastrado" }`
- 400: Erro de validação (campos ausentes/formatos inválidos)

#### Obter aluno específico

```
GET /students/:id
```

#### Buscar aluno por tagId (para sistema RFID/NFC)

```
GET /students/tag/:tagId
```

Possíveis respostas de erro:

- 404: Aluno não encontrado — `{ "error": "Aluno não encontrado" }`
- 400: Erro de validação (parâmetros inválidos)

### 🔐 **Autenticação (Auth)**

#### Login

```
POST /auth/login
```

Body:

```json
{
  "email": "joao@escola.com",
  "password": "senha123"
}
```

Respostas:

- 200: `{ "message": "Login successful", "isAuthenticated": true }`
- 401: `{ "error": "Invalid email or password" }`
- 400: Erro de validação (campos ausentes/formatos inválidos)

#### Registro de professor

```
POST /auth/register
```

Body:

```json
{
  "name": "João Silva",
  "email": "joao@escola.com",
  "password": "senha123",
  "tagId": "TAG001"
}
```

Respostas:

- 201: `{ "message": "Registration successful", "teacher": { ... } }`
- 409: `{ "error": "Email already registered" }` ou `{ "error": "Tag ID already registered" }`
- 400: Erro de validação (campos ausentes/formatos inválidos)

## 🔄 **Fluxo de Uso**

### 1. **Administrador cria professores e alunos**

```bash
# Criar professor
POST /teachers
{
  "name": "Prof. João",
  "email": "joao@escola.com",
  "password": "senha123",
  "tagId": "TAG001"
}

# Criar aluno
POST /students
{
  "name": "Maria",
  "tagId": "TAG002"
}
```

### 2. **Professor cria uma aula**

```bash
POST /lessons
{
  "room": "Sala 101",
  "subject": "Matemática",
  "teacherId": 1,
  "startTime": "2024-01-15T08:00:00Z",
  "endTime": "2024-01-15T10:00:00Z"
}
```

### 3. **Professor abre a aula para marcação de presença**

```bash
POST /lessons/1/open
```

### 4. **Sistema marca presença dos alunos (via RFID/NFC)**

```bash
POST /lessons/1/attendance
{
  "studentId": 1,
  "present": true
}
```

### 5. **Professor fecha a aula**

```bash
POST /lessons/1/close
```

### 6. **Professor visualiza relatório de presença**

```bash
GET /lessons/1/students
```

## 🚀 **Como testar**

1. Inicie o servidor:

```bash
npm run dev
```

2. Use o Postman, Insomnia ou curl para testar os endpoints

3. Exemplo de teste completo:

```bash
# 1. Criar professor
curl -X POST http://localhost:3000/teachers \
  -H "Content-Type: application/json" \
  -d '{"name":"Prof. João","email":"joao@escola.com","password":"senha123","tagId":"TAG001"}'

# 2. Criar aluno
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","tagId":"TAG002"}'

# 3. Criar aula
curl -X POST http://localhost:3000/lessons \
  -H "Content-Type: application/json" \
  -d '{"room":"Sala 101","subject":"Matemática","teacherId":1,"startTime":"2024-01-15T08:00:00Z","endTime":"2024-01-15T10:00:00Z"}'

# 4. Abrir aula
curl -X POST http://localhost:3000/lessons/1/open

# 5. Marcar presença
curl -X POST http://localhost:3000/lessons/1/attendance \
  -H "Content-Type: application/json" \
  -d '{"studentId":1,"present":true}'

# 5b. Marcar presença via TAG (RFID/NFC)
curl -X POST http://localhost:3000/lessons/1/attendance-tag \
  -H "Content-Type: application/json" \
  -d '{"tagId":"TAG002"}'

# 6. Ver alunos da aula
curl http://localhost:3000/lessons/1/students
```

## ❗ Formato de erros de validação

Quando a validação (via Zod) falha, a resposta segue este formato:

```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Campo 'email' deve ser um email válido",
      "code": "INVALID_FORMAT"
    },
    {
      "field": "password",
      "message": "Campo 'password' é obrigatório",
      "code": "REQUIRED_FIELD_MISSING"
    }
  ]
}
```

Erros de domínio/serviço retornam como:

```json
{ "error": "Mensagem do erro" }
```

Com status HTTP apropriado (por exemplo: 400, 401, 404, 409).
