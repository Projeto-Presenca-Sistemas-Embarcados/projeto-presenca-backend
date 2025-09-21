import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '@/utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwt.js';

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    // Validação básica
    if (!email || !password) {
      return reply.status(400).send({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS',
      });
    }

    // Busca o professor no banco de dados
    const teacher = await db.teacher.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        tokenVersion: true,
      },
    });

    if (!teacher) {
      return reply.status(401).send({
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verifica a senha
    const isPasswordValid = await verifyPassword(password, teacher.password);
    if (!isPasswordValid) {
      return reply.status(401).send({
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Gera os tokens
    const accessToken = generateAccessToken({
      userId: teacher.id,
      email: teacher.email,
      role: 'teacher',
    });

    const refreshToken = generateRefreshToken({
      userId: teacher.id,
      tokenVersion: teacher.tokenVersion,
    });

    // Retorna os tokens e informações do usuário (sem a senha)
    return reply.send({
      message: 'Login realizado com sucesso',
      user: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email, password, tagId } = request.body as {
      name: string;
      email: string;
      password: string;
      tagId: string;
    };

    // Validação básica
    if (!name || !email || !password || !tagId) {
      return reply.status(400).send({
        error: 'Todos os campos são obrigatórios',
        code: 'MISSING_FIELDS',
      });
    }

    // Valida força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return reply.status(400).send({
        error: 'Senha não atende aos critérios de segurança',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors,
      });
    }

    // Verifica se o email já está em uso
    const existingTeacher = await db.teacher.findUnique({
      where: { email },
    });

    if (existingTeacher) {
      return reply.status(409).send({
        error: 'Email já está em uso',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Verifica se a tag já está em uso
    const existingTag = await db.teacher.findUnique({
      where: { tagId },
    });

    if (existingTag) {
      return reply.status(409).send({
        error: 'Tag ID já está em uso',
        code: 'TAG_ALREADY_EXISTS',
      });
    }

    // Gera hash da senha
    const hashedPassword = await hashPassword(password);

    // Cria o novo professor
    const newTeacher = await db.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tagId,
        tokenVersion: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tagId: true,
        createdAt: true,
      },
    });

    return reply.status(201).send({
      message: 'Registro realizado com sucesso',
      user: newTeacher,
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

export async function refreshToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { refreshToken } = request.body as {
      refreshToken: string;
    };

    if (!refreshToken) {
      return reply.status(400).send({
        error: 'Refresh token é obrigatório',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    // Verifica o refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Busca o usuário no banco
    const teacher = await db.teacher.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        tokenVersion: true,
      },
    });

    if (!teacher) {
      return reply.status(401).send({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    // Verifica se o token não foi invalidado
    if (teacher.tokenVersion !== payload.tokenVersion) {
      return reply.status(401).send({
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Gera novos tokens
    const newAccessToken = generateAccessToken({
      userId: teacher.id,
      email: teacher.email,
      role: 'teacher',
    });

    const newRefreshToken = generateRefreshToken({
      userId: teacher.id,
      tokenVersion: teacher.tokenVersion,
    });

    return reply.send({
      message: 'Tokens renovados com sucesso',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return reply.status(401).send({
      error: 'Refresh token inválido ou expirado',
      code: 'INVALID_REFRESH_TOKEN',
    });
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Em um sistema mais robusto, você poderia adicionar o token a uma blacklist
    // Por enquanto, apenas retornamos sucesso
    return reply.send({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

export async function changePassword(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({
        error: 'Senha atual e nova senha são obrigatórias',
        code: 'MISSING_PASSWORDS',
      });
    }

    // Valida força da nova senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return reply.status(400).send({
        error: 'Nova senha não atende aos critérios de segurança',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors,
      });
    }

    // Busca o usuário (assumindo que o middleware de autenticação já foi executado)
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const teacher = await db.teacher.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        tokenVersion: true,
      },
    });

    if (!teacher) {
      return reply.status(404).send({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    // Verifica a senha atual
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      teacher.password,
    );
    if (!isCurrentPasswordValid) {
      return reply.status(400).send({
        error: 'Senha atual incorreta',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    // Gera hash da nova senha
    const hashedNewPassword = await hashPassword(newPassword);

    // Atualiza a senha e incrementa o tokenVersion para invalidar todos os tokens existentes
    await db.teacher.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        tokenVersion: teacher.tokenVersion + 1,
      },
    });

    return reply.send({
      message: 'Senha alterada com sucesso. Faça login novamente.',
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
