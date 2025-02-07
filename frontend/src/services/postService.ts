import api from "./apiServiceTT";

export const fetchPosts = async () => {
  try {
    const response = await api.get('/posts');
    return response.data; // Retorna os dados da API
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Erro ao buscar os posts');
  }
};
