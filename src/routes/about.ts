import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';
export default async function aboutRoutes(app: FastifyInstance) {
    app.get('/sobre', async (_, reply) => {
      return reply.send({ message: 'Dicionário de Programação - Versão 1.0.0-' });
    });
  }
  