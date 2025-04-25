import { FastifyInstance } from 'fastify';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../firebaseConfig';

interface AddFavoritoRequest {
  usuarioId: string;
  tipo: 'termo' | 'anotacao';
  id: string;
}

// Função auxiliar para registrar atividade
export async function registrarAtividade(userId: string, descricao: string, acao: string) {
  try {
    await db.collection('atividades').add({
      userId,
      description: descricao,
      action: acao,
      createdAt: new Date(), // Usamos a data atual
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}

export default async function favoriteRoutes(app: FastifyInstance) {
  // Adicionar favorito
  app.post('/favoritos', async (req, reply) => {
    const { usuarioId, tipo, id }: AddFavoritoRequest = req.body as AddFavoritoRequest;

    try {
      const userRef = db.collection('usuarios').doc(usuarioId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      // Extraímos o nome do usuário para mensagens mais naturais
      const userData = userDoc.data();
      const nomeUsuario = userData?.nome || 'O usuário';

      const campo = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';
      const subcolecao = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';

      // Atualiza o array no doc do usuário
      await userRef.update({
        [campo]: FieldValue.arrayUnion(id),
      });

      // Cria persistência na subcoleção
      await userRef.collection(subcolecao).doc(id).set({
        data: new Date().toISOString(),
      });

      // Registra atividade de adicionar favorito com mensagem amigável (sem exibir ID)
      const descricao = `${nomeUsuario} adicionou um ${tipo === 'termo' ? 'termo' : 'a anotação'} aos favoritos.`;
      const acao = "Adicionar Favorito";
      await registrarAtividade(usuarioId, descricao, acao);

      return reply.send({ message: `${tipo === 'termo' ? 'Termo' : 'Anotação'} adicionada aos favoritos com sucesso` });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao adicionar favorito', error });
    }
  });

  // Remover favorito
  app.delete('/favoritos', async (req, reply) => {
    const { usuarioId, tipo, id }: AddFavoritoRequest = req.body as AddFavoritoRequest;

    try {
      const userRef = db.collection('usuarios').doc(usuarioId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      const userData = userDoc.data();
      const nomeUsuario = userData?.nome || 'O usuário';

      const campo = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';
      const subcolecao = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';

      // Remove do array do usuário
      await userRef.update({
        [campo]: FieldValue.arrayRemove(id),
      });

      // Remove da subcoleção
      await userRef.collection(subcolecao).doc(id).delete();

      // Registra atividade de remoção de favorito com mensagem amigável
      const descricao = `${nomeUsuario} removeu um ${tipo === 'termo' ? 'termo' : 'a anotação'} dos favoritos.`;
      const acao = "Remover Favorito";
      await registrarAtividade(usuarioId, descricao, acao);

      return reply.send({ message: `${tipo === 'termo' ? 'Termo' : 'Anotação'} removido dos favoritos com sucesso` });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao remover favorito', error });
    }
  });

  // Listar favoritos
  app.get('/favoritos/:usuarioId', async (req, reply) => {
    const { usuarioId }: { usuarioId: string } = req.params as { usuarioId: string };

    try {
      const userRef = db.collection('usuarios').doc(usuarioId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      // Subcoleções
      const termosSnap = await userRef.collection('favoritosTermos').get();
      const anotacoesSnap = await userRef.collection('favoritosAnotacoes').get();

      const termos = termosSnap.docs.map(doc => doc.id);
      const anotacoes = anotacoesSnap.docs.map(doc => doc.id);

      return reply.send({
        termos,
        anotacoes,
      });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao listar favoritos', error });
    }
  });
}
