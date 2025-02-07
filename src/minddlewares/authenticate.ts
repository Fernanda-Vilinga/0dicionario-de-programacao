import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default function authenticate(app: FastifyInstance) {
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
}
