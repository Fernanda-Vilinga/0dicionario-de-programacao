import { FastifyInstance } from 'fastify';
import db from '../../firebaseConfig';

export default async function promoteMentorRoutes(app: FastifyInstance) {
  app.post('/auth/promovermentores', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { email } = req.body as { email: string };

    if (!email) {
      return reply.status(400).send({ message: 'Preencha o email do usuário.' });
    }

    try {
      const userRef = db.collection('usuarios').where('email', '==', email).limit(1);
      const user = await userRef.get();

      if (user.empty) {
        return reply.status(404).send({ message: 'Usuário não encontrado.' });
      }

      const userData = user.docs[0].data();

      if (userData.tipo_de_usuario === 'MENTOR') {
        return reply.status(400).send({ message: 'Usuário já é mentor.' });
      }

      await user.docs[0].ref.update({ tipo_de_usuario: 'MENTOR' });

      return reply.status(200).send({ message: 'Usuário promovido a mentor com sucesso!' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao promover usuário.' });
    }
  });
}
