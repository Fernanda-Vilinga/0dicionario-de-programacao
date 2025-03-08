import axios from 'axios';

const API_URL = 'http://192.168.0.132:3030'; // URL do backend

//  login
export const loginUser = async (email: string, senha: string) => {
  console.log({email, senha})

  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
    console.log(response.data)
    return response.data; 
  } catch (error: any) {
    console.error('Erro ao fazer login:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Erro desconhecido' };
  }
};

// registro 
export const registerUser = async (nome: string, email: string, senha: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/registeruser`, { nome, email, senha });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Erro desconhecido' };
  }
};
