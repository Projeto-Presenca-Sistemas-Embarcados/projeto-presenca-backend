# Documentação de Validação de Campos

## Visão Geral

O sistema implementa validação robusta de campos obrigatórios seguindo padrões de mercado. Todas as requisições POST são validadas antes do processamento.

## Tipos de Validação

### 1. Campos Obrigatórios

Verifica se todos os campos necessários estão presentes no body da requisição.

### 2. Tipos de Dados

Valida se os campos têm os tipos corretos (string, number, boolean, email).

### 3. Comprimento de Strings

Valida comprimento mínimo e máximo de campos de texto.

### 4. Formato de Email

Valida se o email está em formato válido.

## Estrutura de Resposta de Erro

Quando a validação falha, a API retorna:

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

## Códigos de Erro de Validação

| Código                   | Descrição                       |
| ------------------------ | ------------------------------- |
| `REQUIRED_FIELD_MISSING` | Campo obrigatório não fornecido |
| `INVALID_FIELD_TYPE`     | Tipo de campo incorreto         |
| `INVALID_EMAIL_FORMAT`   | Formato de email inválido       |
| `FIELD_TOO_SHORT`        | Campo muito curto               |
| `FIELD_TOO_LONG`         | Campo muito longo               |

## Exemplos de Validação

### Registro de Professor

**Campos obrigatórios:** `name`, `email`, `password`, `tagId`

**Validações:**

- `name`: string, 2-100 caracteres
- `email`: email válido, 5-255 caracteres
- `password`: string, 8-255 caracteres
- `tagId`: string, 1-50 caracteres

**Exemplo de erro:**

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
      "field": "email",
      "message": "Campo 'email' deve ser um email válido",
      "code": "INVALID_EMAIL_FORMAT"
    }
  ]
}
```

### Login

**Campos obrigatórios:** `email`, `password`

**Validações:**

- `email`: email válido, 5-255 caracteres
- `password`: string, 1-255 caracteres

### Criação de Estudante

**Campos obrigatórios:** `name`, `tagId`

**Validações:**

- `name`: string, 2-100 caracteres
- `tagId`: string, 1-50 caracteres
- `startTime`: string opcional, 1-10 caracteres

### Criação de Lição

**Campos obrigatórios:** `room`, `subject`, `teacherId`, `startTime`, `endTime`

**Validações:**

- `room`: string, 1-50 caracteres
- `subject`: string, 2-100 caracteres
- `teacherId`: number
- `startTime`: string, 10-30 caracteres (formato ISO)
- `endTime`: string, 10-30 caracteres (formato ISO)

### Marcação de Presença

**Campos obrigatórios:** `studentId`, `present`

**Validações:**

- `studentId`: number
- `present`: boolean

## Testes de Validação

### Teste 1: Campos Faltando

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "email": "teste@exemplo.com"}'
```

**Resposta esperada:**

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

### Teste 2: Email Inválido

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "email-invalido",
    "password": "MinhaSenh@123",
    "tagId": "TAG001"
  }'
```

**Resposta esperada:**

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

### Teste 3: Campo Muito Curto

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "teste@exemplo.com",
    "password": "MinhaSenh@123",
    "tagId": "TAG001"
  }'
```

**Resposta esperada:**

```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "name",
      "message": "Campo 'name' deve ter pelo menos 2 caracteres",
      "code": "FIELD_TOO_SHORT"
    }
  ]
}
```

## Implementação

A validação é implementada através do arquivo `src/utils/validation.ts` que fornece:

- `validateRequiredFields()` - Valida campos obrigatórios
- `validateFieldTypes()` - Valida tipos de dados
- `validateStringLength()` - Valida comprimento de strings
- `validatePostRequest()` - Validação completa para POST
- `sendValidationError()` - Envia resposta de erro padronizada

## Benefícios

1. **Feedback Claro**: O usuário sabe exatamente quais campos estão faltando ou incorretos
2. **Padronização**: Todas as validações seguem o mesmo padrão
3. **Manutenibilidade**: Fácil de adicionar novas validações
4. **Experiência do Usuário**: Mensagens de erro claras e específicas
5. **Segurança**: Previne dados malformados de chegarem ao banco de dados

## Extensibilidade

Para adicionar novas validações:

1. Adicione novos tipos de validação em `validation.ts`
2. Configure as validações nos controllers
3. Teste com diferentes cenários
4. Documente as novas regras

O sistema é flexível e pode ser facilmente estendido para atender novas necessidades de validação.
