import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import db from "../../firebaseConfig";
import admin from "firebase-admin"; // ✅ Import necessário
// Função auxiliar para registrar atividade
export  async function registrarAtividade(userId: string, descricao: string, acao: string) {
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
export default async function loginRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (req, reply) => {
    const { email, senha } = req.body as { email: string; senha: string };

    if (!email || !senha) {
      return reply.status(400).send({ message: "Preencha todos os campos." });
    }

    try {
      const userRef = db.collection("usuarios").where("email", "==", email).limit(1);
      const user = await userRef.get();

      if (user.empty) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      const userDoc = user.docs[0];
      const userData = userDoc.data();
      const usuarioId = userDoc.id;

      if (!userData.senha) {
        return reply.status(500).send({ message: "Erro no servidor: senha não encontrada." });
      }

      const match = await bcrypt.compare(senha, userData.senha);

      if (!match) {
        return reply.status(401).send({ message: "Senha incorreta." });
      }

      const token = app.jwt.sign({ id: usuarioId });

      const userType =
        typeof userData.tipo_de_usuario === "string" && userData.tipo_de_usuario.trim() !== ""
          ? userData.tipo_de_usuario.trim().toUpperCase()
          : "USUARIO";

      // Atualiza as informações de login do usuário
      await db.collection('usuarios').doc(usuarioId).update({
        lastLogin: admin.firestore.Timestamp.now(),
        online: true
      });
      
      // Registra a atividade de login
      const descricao = `Usuário ${userData.nome || email} fez login`;
      const acao = "Login";
      await registrarAtividade(usuarioId, descricao, acao);
      
      return reply.send({
        message: "Login bem-sucedido",
        nome: userData.nome,
        token,
        usuarioId,
        userType,
      });
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });
   // Rota: Solicitação de redefinição
   app.post("/auth/forgot-password", async (req, reply) => {
    const { email } = req.body as { email: string };

    if (!email) return reply.status(400).send({ message: "Informe o email." });

    try {
      const userSnap = await db.collection("usuarios").where("email", "==", email).limit(1).get();
      if (userSnap.empty) return reply.status(404).send({ message: "Usuário não encontrado." });

      const userId = userSnap.docs[0].id;

      return reply.send({ message: "Usuário encontrado.", usuarioId: userId });
    } catch (err) {
      console.error("Erro forgot-password:", err);
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });

  // Rota: Redefinição de senha
  app.post("/auth/reset-password", async (req, reply) => {
    const { usuarioId, novaSenha } = req.body as { usuarioId: string; novaSenha: string };

    if (!usuarioId || !novaSenha) {
      return reply.status(400).send({ message: "Preencha todos os campos." });
    }

    try {
      const hash = await bcrypt.hash(novaSenha, 10);
      await db.collection("usuarios").doc(usuarioId).update({ senha: hash });

      await registrarAtividade(usuarioId, "Usuário redefiniu a senha", "Reset de senha");

      return reply.send({ message: "Senha redefinida com sucesso." });
    } catch (err) {
      console.error("Erro reset-password:", err);
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });
}
