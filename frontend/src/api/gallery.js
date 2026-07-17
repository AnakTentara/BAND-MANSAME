import api from './axios';

// Public
export const getGalleryPhotos = (category) =>
  api.get('/gallery', { params: category && category !== 'Semua' ? { category } : {} });

export const getGalleryCategories = () =>
  api.get('/gallery/categories');

// Admin
export const getAdminGalleryPhotos = () =>
  api.get('/gallery/admin');

export const createGalleryPhoto = (formData) =>
  api.post('/gallery/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateGalleryPhoto = (id, formData) =>
  api.put(`/gallery/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteGalleryPhoto = (id) =>
  api.delete(`/gallery/admin/${id}`);
