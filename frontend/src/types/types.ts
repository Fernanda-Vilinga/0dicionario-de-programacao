export interface Reaction {
    id: string;
    userId: string;
    stars: number;
    createdAt: string;
  }
  
  export interface Post {
    id: string;
    user: {
      id: string;
      username: string;
      avatar: string;
    };
    type: string;
    title: string;
    description: string;
    reasonOffer: string;
    currency: number;
    businessModel: string;
    mediaURL: string;
    thumbnail: string;
    businessPlan: string;
    createdAt: string;
    reactions: Reaction[];
    views: number;
    shares: number;
    likes: number;
    niche: string[];
  }
  // types.ts
export type RootStackParamList = {
  Dicionario: undefined;
  Quiz: undefined;
  BlocoDeNotas: undefined;
  Mentoria: undefined;
  Perfil: undefined;
  Definicoes: undefined;
  Favoritos: undefined;
  Sugestoes: undefined;
  Historico: undefined;
  Sobre: undefined;
  Login: undefined;
  AdminDashboard: undefined;
  GerenciarUsuarios: undefined;
  GerenciarDicionario: undefined;
  GerenciarQuizzes: undefined;
  GerenciarMentoria: undefined;
  Relatorios: undefined;
  Configuracoes: undefined;
  AdminNavigator:undefined
  MentorNavigator:undefined;
  Dashboard:undefined;
  LoginRegister: undefined;
  LoginScreen: undefined;
  HomeScreen: undefined;
  ProfileMentor: undefined;
  Mentores: undefined;
  Chat: undefined;
};

