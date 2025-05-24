"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = dashboardRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin")); // Necessário para Timestamp
function dashboardRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.get('/dashboard', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                // 🔹 1. Usuários Ativos: busca, contagem e lista
                const activeUsersSnapshot = yield firebaseConfig_1.default.collection('usuarios')
                    .where('online', '==', true)
                    .get();
                const activeUsersCount = activeUsersSnapshot.size;
                const activeUsersList = activeUsersSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const lastLoginStr = formatTimestamp(data.lastLogin); // Usando a função para formatar o timestamp
                    return {
                        id: doc.id,
                        name: data.nome || 'Sem nome',
                        email: data.email || '',
                        lastLogin: lastLoginStr,
                    };
                });
                // 🔹 2. Total de Usuários: busca, contagem e lista
                const usersSnapshot = yield firebaseConfig_1.default.collection('usuarios').get();
                const totalUsersCount = usersSnapshot.size;
                const totalUsersList = usersSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const lastLoginStr = formatTimestamp(data.lastLogin); // Usando a função para formatar o timestamp
                    return {
                        id: doc.id,
                        name: data.nome || 'Sem nome',
                        email: data.email || '',
                        online: data.online || false,
                        lastLogin: lastLoginStr,
                    };
                });
                // 🔹 3. Acessos Recentes: busca todos os usuários que acessaram nas últimas 24 horas
                const twentyFourHoursAgo = firebase_admin_1.default.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)); // Usando o Timestamp do Firebase
                const recentUsersSnapshot = yield firebaseConfig_1.default.collection('usuarios')
                    .where('lastLogin', '>=', twentyFourHoursAgo)
                    .orderBy('lastLogin', 'desc')
                    .get();
                const recentUsersList = recentUsersSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const lastLoginStr = formatTimestamp(data.lastLogin); // Usando a função para formatar o timestamp
                    return {
                        id: doc.id,
                        name: data.nome || 'Sem nome',
                        email: data.email || '',
                        lastLogin: lastLoginStr,
                    };
                });
                // 🔹 4. Últimos Cadastros: busca os últimos 5 usuários cadastrados
                const recentRegistrationsSnapshot = yield firebaseConfig_1.default.collection('usuarios')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get();
                const recentRegistrations = recentRegistrationsSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const createdAtStr = formatTimestamp(data.createdAt); // Usando a função para formatar o timestamp
                    return {
                        id: doc.id,
                        name: data.nome || 'Sem nome',
                        email: data.email || '',
                        createdAt: createdAtStr,
                    };
                });
                // 🔹 5. Relatórios para exibir os números
                const reports = [
                    {
                        title: 'Usuários Ativos',
                        value: activeUsersCount.toString(),
                        icon: 'person',
                        color: '#2979FF',
                    },
                    {
                        title: 'Total de Usuários',
                        value: totalUsersCount.toString(),
                        icon: 'person_add',
                        color: '#4CAF50',
                    },
                    {
                        title: 'Acessos Recentes',
                        value: `${recentUsersList.length} acessos`,
                        icon: 'visibility',
                        color: '#FF9800',
                    },
                ];
                // 🔹 6. Atividades Recentes: busca as últimas 5 atividades realizadas
                const activitiesSnapshot = yield firebaseConfig_1.default.collection('atividades')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get();
                const recentActivities = activitiesSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    let activityTime = 'Hora não disponível';
                    if (data.createdAt && data.createdAt.seconds) {
                        activityTime = new Date(data.createdAt.seconds * 1000).toLocaleTimeString('pt-BR');
                    }
                    return {
                        id: doc.id,
                        description: data.description || 'Sem descrição',
                        time: activityTime,
                    };
                });
                return reply.send({
                    reports,
                    activeUsers: activeUsersList,
                    totalUsers: totalUsersList,
                    recentUsers: recentUsersList,
                    recentRegistrations, // Últimos cadastros
                    recentActivities,
                });
            }
            catch (error) {
                console.error('Erro ao carregar dashboard:', error);
                return reply.status(500).send({ message: 'Erro ao carregar dados do dashboard' });
            }
        }));
        // Nova rota: Buscar atividade por ID
        app.get('/activities/user/:userId', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = request.params;
            try {
                // Consulta filtrando apenas pelo userId
                const activitiesSnapshot = yield firebaseConfig_1.default.collection('atividades')
                    .where('userId', '==', userId)
                    .get();
                const userActivities = activitiesSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    // Formatação opcional da data, se disponível
                    const activityTime = (data === null || data === void 0 ? void 0 : data.createdAt) && data.createdAt.seconds
                        ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString('pt-BR')
                        : 'Hora não disponível';
                    return {
                        id: doc.id,
                        description: data.description || 'Sem descrição',
                        action: data.action || 'Sem ação',
                        time: activityTime,
                        userId: data.userId || 'Usuário não identificado',
                    };
                });
                return reply.send({ activities: userActivities });
            }
            catch (error) {
                console.error('Erro ao buscar atividades por userId:', error);
                return reply.status(500).send({ message: 'Erro ao carregar atividades' });
            }
        }));
        // Função auxiliar para formatar o Timestamp
        const formatTimestamp = (timestamp) => {
            if (timestamp && timestamp.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleString('pt-BR');
            }
            return 'N/A'; // Retorna 'N/A' se não houver valor
        };
    });
}
;
