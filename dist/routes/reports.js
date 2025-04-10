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
exports.default = reportsRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function reportsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post('/reports', (req, reply) => __awaiter(this, void 0, void 0, function* () {
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
                const batch = firebaseConfig_1.default.batch();
                reports.forEach((report) => {
                    const docRef = firebaseConfig_1.default.collection('reports').doc(); // ID automático
                    batch.set(docRef, report);
                });
                yield batch.commit();
                return reply.status(201).send({ message: 'Relatórios criados com sucesso' });
            }
            catch (error) {
                console.error('Erro ao criar relatórios:', error);
                return reply.status(500).send({ message: 'Erro ao criar relatórios' });
            }
        }));
    });
}
