import axios from 'axios';
import api, { getAccessToken } from './api';

const BASE = 'services'; // Translates to /api/spring/services/...

// Dedicated axios instance for file uploads — NO interceptors
const uploadClient = axios.create({
    baseURL: api.defaults.baseURL,
    timeout: 300000, // 5 minutes
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

    // Image Upload — Using the Multipart endpoint from the new backend
    uploadImage: async (file, folder = 'services', onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await api.post(`${BASE}/upload`, formData, {
            // DO NOT manually set Content-Type for FormData; Axios/Browser will set it with the correct boundary
            timeout: 300000, // 5 minutes for large file uploads to S3
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        
        // The backend returns the S3 Key as a plain string
        return response.data; 
    },
    deleteImage: async (key) => (await api.delete(`${BASE}/file`, { params: { key } })).data,
};
