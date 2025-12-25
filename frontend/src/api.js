import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData)
};

// Buildings API
export const buildingsAPI = {
  getAll: () => api.get('/buildings'),
  getOne: (id) => api.get(`/buildings/${id}`),
  create: (data) => api.post('/buildings', data),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`)
};

// Notes API
export const notesAPI = {
  getByBuilding: (buildingId) => api.get(`/notes/building/${buildingId}`),
  createText: (data) => api.post('/notes/text', data),
  createLink: (data) => api.post('/notes/link', data),
  createVoice: (formData) => api.post('/notes/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createImage: (formData) => api.post('/notes/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/notes/${id}`)
};

export default api;
