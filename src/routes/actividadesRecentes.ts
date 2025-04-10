import db from '../firebaseConfig';

// Função para registrar a atividade no Firestore
async function registrarAtividade(userId: string, descricao: string, acao: string) {
  try {
    const createdAt = new Date().toISOString(); // Data e hora atual no formato ISO

    await db.collection('atividades').add({
      userId: userId,
      description: descricao,
      action: acao,
      createdAt: createdAt,  // Salvando a data/hora
    });
  } catch (error) {
    console.error("Erro ao registrar a atividade:", error);
  }
}
