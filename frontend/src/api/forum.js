import api from './axios';

// Forum Blog Komunitas API Client
export const getBlogPosts = (params) =>
  api.get('/forum/posts', { params });

export const getBlogPostBySlug = (slug) =>
  api.get(`/forum/posts/${slug}`);

export const createBlogPost = (data) => {
  if (data instanceof FormData) {
    return api.post('/forum/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.post('/forum/posts', data);
};

export const updateBlogPost = (id, data) => {
  if (data instanceof FormData) {
    return api.put(`/forum/posts/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.put(`/forum/posts/${id}`, data);
};

export const deleteBlogPost = (id) =>
  api.delete(`/forum/posts/${id}`);

export const toggleLikeBlogPost = (id, data) =>
  api.post(`/forum/posts/${id}/like`, data);

export const approveBlogPost = (id) =>
  api.put(`/forum/forum/posts/${id}/approve`); // Wait! In routes: router.put('/posts/:id/approve', authAdmin, approveBlogPost);
  // So the url is: /forum/posts/:id/approve. Let's fix this url:
  // api.put(`/forum/posts/${id}/approve`);
export const approveBlogPostApi = (id) =>
  api.put(`/forum/posts/${id}/approve`);

export const createBlogComment = (postId, data) =>
  api.post(`/forum/posts/${postId}/comments`, data);

export const updateBlogComment = (id, data) =>
  api.put(`/forum/comments/${id}`, data);

export const deleteBlogComment = (id) =>
  api.delete(`/forum/comments/${id}`);
