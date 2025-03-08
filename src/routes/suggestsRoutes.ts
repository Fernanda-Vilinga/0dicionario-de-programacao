import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';
import axios from 'axios';

// Definição da tipagem do corpo da requisição
interface SugestaoBody {
  usuarioId: string;
  sugestao: string;
}

interface AceitarSugestaoParams {
  id: string;
}

// Definição das credenciais da API Hugging Face (use variáveis de ambiente para segurança)
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/seu-modelo-aqui';
const HUGGING_FACE_API_KEY = 'seu-token-aqui'; // Armazene em variáveis de ambiente!

export default async function suggestionsRoutes(app: FastifyInstance) {
  // 📌 Rota para obter sugestões da Hugging Face e salvar no Firestore
  app.post('/sugestoes', async (req: FastifyRequest<{ Body: SugestaoBody }>, reply: FastifyReply) => {
    const { usuarioId, sugestao } = req.body;

    if (!usuarioId || !sugestao) {
      return reply.status(400).send({ message: 'Usuário e sugestão são obrigatórios.' });
    }

    try {
      // Chamada à API Hugging Face para obter sugestões
      const response = await axios.post(
        HUGGING_FACE_API_URL,
        { inputs: sugestao },
        {
          headers: {
            Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const sugestoes = response.data; // Ajuste conforme o retorno da API

      // Salvando sugestões no Firestore
      const batch = db.batch();
      sugestoes.forEach((termo: any) => {
        const ref = db.collection('sugestoes').doc();
        batch.set(ref, {
          usuarioId,
          termo: termo.termo, // Ajuste conforme resposta da API
          definicao: termo.definicao || '',
          exemplos: termo.exemplos || [],
          linguagem: termo.linguagem || 'Geral',
          dataCriacao: new Date(),
        });
      });

      await batch.commit();

      return reply.status(201).send({ message: 'Sugestões enviadas e salvas com sucesso' });
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      return reply.status(500).send({ message: 'Erro ao buscar sugestões' });
    }
  });

  // 📌 Rota para aceitar uma sugestão e movê-la para a coleção de termos
  app.post('/sugestoes/aceitar/:id', async (req: FastifyRequest<{ Params: AceitarSugestaoParams }>, reply: FastifyReply) => {
    const { id } = req.params;

    try {
      const sugestaoRef = db.collection('sugestoes').doc(id);
      const sugestaoDoc = await sugestaoRef.get();

      if (!sugestaoDoc.exists) {
        return reply.status(404).send({ message: 'Sugestão não encontrada' });
      }

      const sugestao = sugestaoDoc.data();

      // Movendo a sugestão para a coleção 'termos'
      await db.collection('termos').doc(id).set({
        termo: sugestao?.termo,
        definicao: sugestao?.definicao,
        exemplos: sugestao?.exemplos || [],
        linguagem: sugestao?.linguagem || 'Geral',
        dataCriacao: new Date(),
      });

      // Removendo a sugestão da coleção de sugestões
      await sugestaoRef.delete();

      return reply.status(200).send({ message: 'Sugestão aceita e movida para o dicionário' });
    } catch (error) {
      console.error('Erro ao aceitar sugestão:', error);
      return reply.status(500).send({ message: 'Erro ao aceitar sugestão' });
    }
  });
}
