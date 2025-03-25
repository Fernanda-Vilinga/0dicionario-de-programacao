import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo_de_usuario: string; // "MENTOR" ou "USER"
  bio?: string;
  imagem?: string;
}

export default async function contactRoutes(app: FastifyInstance) {
  // Rota para buscar os contatos do usuário informado
  app.get('/contatos/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    try {
      // Buscar o usuário na coleção "usuarios"
      const userDoc = await db.collection('usuarios').doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      const loggedUser = userDoc.data() as Usuario;
      console.log('✅ Usuário encontrado:', loggedUser);

      // Determinar o tipo oposto:
      // Se o usuário for MENTOR, buscar contatos do tipo USER
      // Se o usuário for USER, buscar contatos do tipo MENTOR
      const targetType = loggedUser.tipo_de_usuario === 'MENTOR' ? 'USER' : 'MENTOR';
      console.log(`🔎 Buscando contatos do tipo: ${targetType}`);

      // Buscar os contatos na coleção "usuarios"
      const querySnapshot = await db.collection('usuarios')
        .where('tipo_de_usuario', '==', targetType)
        .get();

      if (querySnapshot.empty) {
        return reply.status(404).send({ message: 'Nenhum contato encontrado.' });
      }

      const contatos: Usuario[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Usuario[];

      console.log('✅ Contatos encontrados:', contatos);
      return reply.send(contatos);
    } catch (error) {
      console.error('❌ Erro ao buscar contatos:', error);
      return reply.status(500).send({ message: 'Erro interno ao buscar contatos.', error });
    }
  });
}
