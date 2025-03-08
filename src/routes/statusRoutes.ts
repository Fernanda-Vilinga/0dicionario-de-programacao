import { FastifyInstance } from 'fastify';

async function statusRoutes(app: FastifyInstance) {
  app.get('/status', async (request, reply) => {
    return { status: 'API está rodando!' };
  });
}

export default statusRoutes;
