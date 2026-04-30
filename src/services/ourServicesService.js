import axios from 'axios';
import api, { getAccessToken } from './api';

const BASE = 'services'; // Translates to /api/spring/services/...

// Dedicated axios instance for file uploads — NO interceptors
// This prevents the 401-retry interceptor from consuming the multipart stream
const uploadClient = axios.create({
    baseURL: api.defaults.baseURL,
    withCredentials: true,
    timeout: 60000, // 60 seconds — realistic for up to 10MB image
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
    
    // Image Uploads via editor — uses clean axios (no interceptors)
    uploadImage: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const token = getAccessToken();
        return (await uploadClient.post(`${BASE}/upload`, fd, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                // DO NOT set Content-Type — browser auto-generates boundary
            },
        })).data;
    },
    deleteImage: async (key) => (await api.delete(`${BASE}/file`, { params: { key } })).data,
};

