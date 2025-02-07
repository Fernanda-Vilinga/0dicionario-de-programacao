import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import db from '../../firebaseConfig';

export default async function loginRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const { email, senha } = req.body as { email: string; senha: string; };

    if (!email || !senha) {
      return reply.status(400).send({ message: 'Preencha todos os campos.' });
    }

    try {
      const userRef = db.collection('usuarios').where('email', '==', email).limit(1);
      const user = await userRef.get();

      if (user.empty) {
        return reply.status(404).send({ message: 'Usuário não encontrado.' });
      }

      const userData = user.docs[0].data();
      const match = await bcrypt.compare(senha, userData.senha);

      if (!match) {
        return reply.status(401).send({ message: 'Senha incorreta.' });
      }

      const token = app.jwt.sign({ id: user.docs[0].id });
      return reply.send({ message: 'Login bem-sucedido', nome: userData.nome, token });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro no login' });
    }
  });
}

