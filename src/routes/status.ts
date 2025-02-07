import { FastifyInstance } from 'fastify';

export default async function statusRoutes(app: FastifyInstance) {
  app.get('/', async (_, reply) => {
    reply.send({ message: 'API do Dicionário de Programação em funcionamento!' });
  });
}
