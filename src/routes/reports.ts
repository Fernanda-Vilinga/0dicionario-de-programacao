// src/routes/reports.ts
import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';

export default async function reportsRoutes(app: FastifyInstance) {
  app.post('/reports', async (req, reply) => {
    const reports = [
      {
        title: 'Usuários Ativos',
        value: '0', // Será calculado dinamicamente depois
        icon: 'person',
        color: '#2979FF',
      },
      {
        title: 'Total de Vendas',
        value: '0 Kzs',
        icon: 'attach-money',
        color: '#4CAF50',
      },
      {
        title: 'Acessos Recentes',
        value: 'N/A',
        icon: 'visibility',
        color: '#FF9800',
      },
    ];

    try {
      const batch = db.batch();

      reports.forEach((report) => {
        const docRef = db.collection('reports').doc(); // ID automático
        batch.set(docRef, report);
      });

      await batch.commit();
      return reply.status(201).send({ message: 'Relatórios criados com sucesso' });
    } catch (error) {
      console.error('Erro ao criar relatórios:', error);
      return reply.status(500).send({ message: 'Erro ao criar relatórios' });
    }
  });
}
