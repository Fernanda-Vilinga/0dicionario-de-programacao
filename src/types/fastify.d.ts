import '@fastify/jwt';
import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      id: string;
      email?: string;
      tipo_de_usuario?: string;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email?: string; tipo_de_usuario?: string }; // payload ao gerar o token
    user: {
      id: string;
      email?: string;
      tipo_de_usuario?: string;
    }; // payload decodificado com jwt.verify
  }
}
