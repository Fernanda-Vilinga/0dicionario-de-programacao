import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bimer-api.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
