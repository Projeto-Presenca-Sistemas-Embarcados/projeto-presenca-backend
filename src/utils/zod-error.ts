import { ZodError } from 'zod';
import type { ZodIssue } from 'zod';

type Detail = {
  field: string;
  message: string;
  code: string;
};

function getField(issue: ZodIssue) {
  return issue.path.join('.') || 'root';
}

function humanType(t: unknown) {
  if (typeof t === 'string') return t;
  return String(t);
}

function mapIssue(issue: ZodIssue): Detail {
  const field = getField(issue);

  const code = (issue as any).code as string;
  switch (code) {
    case 'invalid_type': {
      // Se esperado string e recebido undefined, tratamos como campo obrigatório ausente
      if ((issue as any).received === 'undefined') {
        return {
          field,
          message: `Campo '${field}' é obrigatório`,
          code: 'REQUIRED_FIELD_MISSING',
        };
      }
      return {
        field,
        message: `Campo '${field}' deve ser do tipo ${humanType(
          (issue as any).expected,
        )}`,
        code: 'INVALID_TYPE',
      };
    }
    case 'too_small': {
      // length ou value
      const isString = (issue as any).type === 'string';
      const min = (issue as any).minimum;
      return {
        field,
        message: isString
          ? `Campo '${field}' deve ter no mínimo ${min} caracteres`
          : `Campo '${field}' deve ser no mínimo ${min}`,
        code: isString ? 'MIN_LENGTH' : 'MIN_VALUE',
      };
    }
    case 'too_big': {
      const isString = (issue as any).type === 'string';
      const max = (issue as any).maximum;
      return {
        field,
        message: isString
          ? `Campo '${field}' deve ter no máximo ${max} caracteres`
          : `Campo '${field}' deve ser no máximo ${max}`,
        code: isString ? 'MAX_LENGTH' : 'MAX_VALUE',
      };
    }
    case 'invalid_string': {
      // validations: email, url, regex, etc.
      const validation = (issue as any).validation;
      let msg = `Campo '${field}' possui formato inválido`;
      if (validation === 'email')
        msg = `Campo '${field}' deve ser um email válido`;
      return { field, message: msg, code: 'INVALID_FORMAT' };
    }
    case 'custom':
    case 'invalid_union':
    case 'invalid_union_discriminator':
    case 'invalid_enum_value':
    case 'unrecognized_keys':
    case 'invalid_arguments':
    case 'invalid_return_type':
    case 'not_multiple_of':
    default: {
      return {
        field,
        message: issue.message || `Campo '${field}' inválido`,
        code: 'INVALID_FIELD',
      };
    }
  }
}

export function formatZodError(error: ZodError) {
  const details = error.issues.map(mapIssue);
  return {
    error: 'Dados inválidos',
    code: 'VALIDATION_ERROR',
    details,
  };
}
