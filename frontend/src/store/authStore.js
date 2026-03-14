// frontend/src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'campusrent-auth',
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);