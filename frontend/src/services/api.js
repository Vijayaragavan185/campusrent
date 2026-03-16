// frontend/src/services/api.js
import axios from 'axios';

const AUTH_ERROR_BYPASS_PATHS = ['/auth/login', '/auth/register', '/auth/verify-otp'];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('campusrent-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    const isAuthFlowRequest = AUTH_ERROR_BYPASS_PATHS.some((path) => requestUrl.includes(path));
    const stored = localStorage.getItem('campusrent-auth');

    if (err.response?.status === 401 && stored && !isAuthFlowRequest) {
      localStorage.removeItem('campusrent-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:  (email) => api.post('/auth/register', { email }),
  verifyOtp: (data)  => api.post('/auth/verify-otp', data),
  login:     (data)  => api.post('/auth/login', data),
  getMe:     ()      => api.get('/auth/me'),
};

export const listingsAPI = {
  getAll:  (params) => api.get('/listings', { params }),
  search:  (params) => api.get('/listings/search', { params }),
  getOne:  (id)     => api.get(`/listings/${id}`),
  create:  (data)   => api.post('/listings', data),
  update:  (id, d)  => api.put(`/listings/${id}`, d),
  remove:  (id)     => api.delete(`/listings/${id}`),
};

export const bookingsAPI = {
  create:       (data)       => api.post('/bookings', data),
  getMy:        ()           => api.get('/bookings/my'),
  getLending:   ()           => api.get('/bookings/lending'),
  getOne:       (id)         => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  requestReturn:(id)         => api.put(`/bookings/${id}/status`, { status: 'requested_return' }),
  markReturned: (id)         => api.put(`/bookings/${id}/status`, { status: 'returned' }),
  complete:     (id)         => api.put(`/bookings/${id}/status`, { status: 'completed' }),
  requestExtension: (id, requestedEndDate) => api.put(`/bookings/${id}/extend`, { requestedEndDate }),
  decideExtension: (id, decision) => api.put(`/bookings/${id}/extend/decision`, { decision }),
  getAuditTrail: (id) => api.get(`/bookings/${id}/audit`),
};

export const messagesAPI = {
  getConversations: ()        => api.get('/messages/conversations'),
  getMessages:      (convId)  => api.get(`/messages/${convId}`),
  send:             (data)    => api.post('/messages', data),
};

export const usersAPI = {
  getProfile:    (id) => api.get(`/users/${id}`),
  updateProfile: (d)  => api.put('/users/me', d),
};

export const reviewsAPI = {
  getForListing: (lid) => api.get(`/reviews/listing/${lid}`),
  getForUser:    (uid) => api.get(`/reviews/user/${uid}`),
  create:        (d)   => api.post('/reviews', d),
};

export default api;