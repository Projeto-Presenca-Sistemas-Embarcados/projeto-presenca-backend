import type { FastifyReply } from 'fastify';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida se os campos obrigatórios estão presentes no body da requisição
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[],
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      body[field] === ''
    ) {
      errors.push({
        field,
        message: `Campo '${field}' é obrigatório`,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida tipos de dados dos campos
 */
export function validateFieldTypes(
  body: any,
  fieldTypes: Record<string, 'string' | 'number' | 'boolean' | 'email'>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, expectedType] of Object.entries(fieldTypes)) {
    const value = body[field];

    if (value === undefined || value === null) {
      continue; // Campos opcionais são ignorados
    }

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: `Campo '${field}' deve ser uma string`,
            code: 'INVALID_FIELD_TYPE',
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field,
            message: `Campo '${field}' deve ser um número`,
            code: 'INVALID_FIELD_TYPE',
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field,
            message: `Campo '${field}' deve ser um boolean`,
            code: 'INVALID_FIELD_TYPE',
          });
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !isValidEmail(value)) {
          errors.push({
            field,
            message: `Campo '${field}' deve ser um email válido`,
            code: 'INVALID_EMAIL_FORMAT',
          });
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida comprimento mínimo e máximo de strings
 */
export function validateStringLength(
  body: any,
  fieldLengths: Record<string, { min?: number; max?: number }>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, lengths] of Object.entries(fieldLengths)) {
    const value = body[field];

    if (value === undefined || value === null || typeof value !== 'string') {
      continue;
    }

    if (lengths.min !== undefined && value.length < lengths.min) {
      errors.push({
        field,
        message: `Campo '${field}' deve ter pelo menos ${lengths.min} caracteres`,
        code: 'FIELD_TOO_SHORT',
      });
    }

    if (lengths.max !== undefined && value.length > lengths.max) {
      errors.push({
        field,
        message: `Campo '${field}' deve ter no máximo ${lengths.max} caracteres`,
        code: 'FIELD_TOO_LONG',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Envia resposta de erro de validação
 */
export function sendValidationError(
  reply: FastifyReply,
  validationResult: ValidationResult,
): void {
  reply.status(400).send({
    error: 'Dados inválidos',
    code: 'VALIDATION_ERROR',
    details: validationResult.errors,
  });
}

/**
 * Validação completa para requisições POST
 */
export function validatePostRequest(
  body: any,
  requiredFields: string[],
  fieldTypes?: Record<string, 'string' | 'number' | 'boolean' | 'email'>,
  fieldLengths?: Record<string, { min?: number; max?: number }>,
): ValidationResult {
  // Valida campos obrigatórios
  const requiredValidation = validateRequiredFields(body, requiredFields);
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }

  // Valida tipos de campos
  if (fieldTypes) {
    const typeValidation = validateFieldTypes(body, fieldTypes);
    if (!typeValidation.isValid) {
      return typeValidation;
    }
  }

  // Valida comprimento de strings
  if (fieldLengths) {
    const lengthValidation = validateStringLength(body, fieldLengths);
    if (!lengthValidation.isValid) {
      return lengthValidation;
    }
  }

  return { isValid: true, errors: [] };
}
