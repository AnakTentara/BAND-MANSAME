import api from './axios';

export const getPublicMembers = () =>
  api.get('/public/members');

export const getPublicAlumni = () =>
  api.get('/public/alumni');

export const getPublicOrg = () =>
  api.get('/public/org');

export const getPublicTestimonials = () =>
  api.get('/public/testimonials');
