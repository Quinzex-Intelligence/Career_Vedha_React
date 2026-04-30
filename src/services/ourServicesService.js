import axios from 'axios';
import api, { getAccessToken } from './api';

const BASE = 'services'; // Translates to /api/spring/services/...

// Dedicated axios instance for file uploads — NO interceptors
const uploadClient = axios.create({
    baseURL: api.defaults.baseURL,
    withCredentials: true,
    timeout: 60000, // 60 seconds
});

export const ourServicesService = {
    getAll: async (cursor = null, size = 5) => {
        const params = {};
        if (cursor) params.cursor = cursor;
        if (size) params.size = size;
        return (await api.get(`${BASE}/get-all`, { params })).data;
    },
    getById: async (id) => (await api.get(`${BASE}/get/${id}`)).data,
    create: async (payload) => (await api.post(`${BASE}/create-service`, payload)).data,
    update: async (id, payload) => (await api.put(`${BASE}/${id}`, payload)).data,
    delete: async (id) => (await api.delete(`${BASE}/${id}`)).data,

    // Image Upload — using clean axios instance for better performance than fetch
    uploadImage: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const token = getAccessToken();
        
        const response = await uploadClient.post(`${BASE}/upload`, fd, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                // DO NOT set Content-Type — browser auto-generates boundary
            },
        });
        
        return response.data;
    },
    deleteImage: async (key) => (await api.delete(`${BASE}/file`, { params: { key } })).data,
};
