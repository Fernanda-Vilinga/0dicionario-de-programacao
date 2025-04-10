import { FastifyInstance } from 'fastify';
import { Firestore, FieldValue } from 'firebase-admin/firestore'; // Importando FieldValue corretamente
import db from '../firebaseConfig'; // Seu arquivo de configuração do Firebase

// Definindo a interface para o request de adicionar favorito
interface AddFavoritoRequest {
  usuarioId: string;
  termoId: string;
}

export default async function favoriteRoutes(app: FastifyInstance) {

  // Rota para adicionar favorito
  app.post('/favoritos', async (req, reply) => {
    const { usuarioId, termoId }: AddFavoritoRequest = req.body as AddFavoritoRequest;

    try {
      const userRef = db.collection('usuarios').doc(usuarioId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      // Adiciona o termo aos favoritos do usuário
      await userRef.update({
        favoritos: FieldValue.arrayUnion(termoId),
      });

      return reply.send({ message: 'Termo adicionado aos favoritos com sucesso' });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao adicionar favorito', error });
    }
  });

  // Rota para remover favorito
  app.delete('/favoritos', async (req, reply) => {
    const { usuarioId, termoId }: AddFavoritoRequest = req.body as AddFavoritoRequest;

    try {
      const userRef = db.collection('usuarios').doc(usuarioId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      // Remove o termo dos favoritos do usuário
      await userRef.update({
        favoritos: FieldValue.arrayRemove(termoId),
      });

      return reply.send({ message: 'Termo removido dos favoritos com sucesso' });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao remover favorito', error });
    }
  });

  // Rota para listar favoritos de um usuário
  app.get('/favoritos/:usuarioId', async (req, reply) => {
    // Tipando explicitamente o parâmetro usuarioId
    const { usuarioId }: { usuarioId: string } = req.params as { usuarioId: string };  // Tipando o param corretamente

    try {
      const userRef = db.collection('usuarios').doc(usuarioId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      // Pega os favoritos
      const favoritos = userDoc.data()?.favoritos || []; // Garantindo que o array de favoritos exista

      return reply.send(favoritos);
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao listar favoritos', error });
    }
  });
}
