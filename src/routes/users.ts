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
    const { lastContactId, limit = 10 } = req.query as { lastContactId: string, limit: number };
  
    try {
      const userDoc = await db.collection('usuarios').doc(id).get();
      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }
  
      const loggedUser = userDoc.data() as Usuario;
      const targetType = loggedUser.tipo_de_usuario === 'MENTOR' ? 'USER' : 'MENTOR';
  
      // Consulta com startAfter
      let query = db.collection('usuarios')
        .where('tipo_de_usuario', '==', targetType)
        .limit(limit);
  
      if (lastContactId) {
        const lastContactDoc = await db.collection('usuarios').doc(lastContactId).get();
        if (lastContactDoc.exists) {
          query = query.startAfter(lastContactDoc);
        }
      }
  
      const querySnapshot = await query.get();
  
      if (querySnapshot.empty) {
        return reply.status(404).send({ message: 'Nenhum contato encontrado.' });
      }
  
      const contatos: Usuario[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Usuario[];
  
      return reply.send(contatos);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      return reply.status(500).send({ message: 'Erro interno ao buscar contatos.', error });
    }
  });
  
}
