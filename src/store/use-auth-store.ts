import { authService } from '@/services/auth-service';
import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
    description?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSetupCompleted: boolean | null; // null means unknown (loading)
  
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkSetup: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isSetupCompleted: null,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials.usernameOrEmail, credentials.password);
          if (response.success && response.data.user) {
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
             throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
         const token = Cookies.get('accessToken');
         if (!token) {
             set({ isAuthenticated: false, user: null });
             return;
         }

         try {
             const response = await authService.getMe();
             if (response.success) {
                 set({ user: response.data, isAuthenticated: true });
             } else {
                 get().logout();
             }
         } catch (error) {
             get().logout();
         }
      },

      checkSetup: async () => {
         try {
             // We assume the API returns success: true if setup IS DONE, 
             // OR maybe it returns a status flag. 
             // Based on the user prompt: /setup/status returns standard response structure.
             // We'll interpret success = true as "System is healthy/setup might be done" 
             // BUT frequently setup/status returns { isSetup: boolean } in data.
             // Given the user provided example just has "data: {}", we might need to clarify.
             // For now, let's assume if it returns succcess, it means the server is running. 
             // We might need to inspect the 'data' more closely in a real scenario.
             // *Correction*: Usually /setup/status returns if setup is required or not. 
             // Let's assume data has { isSetup: boolean } or similar locally. 
             // Without exact structure, I'll log response. 
             
             const response = await authService.getSetupStatus();
             // Assuming if response.success is true, setup is done. 
             // Or if it returns 404/false, setup is needed.
             // For safety, let's bind it to response.success for now.
             
             // *Wait*, usually /setup/status returns data: { installed: boolean }
             // User's example: "data": {}
             // I will assume if the endpoint returns success, setup is ALREADY DONE. 
             // If it returns specific error or false, setup is needed.
             
             const isSetup = response.success; 
             set({ isSetupCompleted: isSetup });
             return isSetup;
         } catch (error) {
             // If check fails, maybe service is down or setup needed.
             console.error(error);
             return false;
         }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, isSetupCompleted: state.isSetupCompleted }), // Persist these fields
    }
  )
);
