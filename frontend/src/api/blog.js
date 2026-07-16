import api from './axios';

// Berita (News) API Client (Admin only writing)
export const getPosts = (params) =>
  api.get('/blog/posts', { params });

export const getPostBySlug = (slug) =>
  api.get(`/blog/posts/${slug}`);

export const createPost = (data) =>
  api.post('/blog/posts', data);

export const updatePost = (id, data) =>
  api.put(`/blog/posts/${id}`, data);

export const deletePost = (id) =>
  api.delete(`/blog/posts/${id}`);
