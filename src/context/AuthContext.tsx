import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';

interface Admin {
  id: string; // UUID from Supabase Auth
  email: string;
  name: string;
  status: string;
  supported_keywords: string[];
  max_concurrent_jobs: number;
}

interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  loading: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: Admin }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: Admin };

const initialState: AuthState = {
  isAuthenticated: false,
  admin: null,
  loading: true
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return { 
        isAuthenticated: true, 
        admin: action.payload, 
        loading: false 
      };
    case 'LOGIN_FAILURE':
      return { 
        isAuthenticated: false, 
        admin: null, 
        loading: false 
      };
    case 'LOGOUT':
      return { 
        isAuthenticated: false, 
        admin: null, 
        loading: false 
      };
    case 'RESTORE_SESSION':
      return {
        isAuthenticated: true,
        admin: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        dispatch({ type: 'RESTORE_SESSION', payload: admin });
      } catch {
        localStorage.removeItem('admin');
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    } else {
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const { authApi } = await import('../utils/api');
      const admin = await authApi.login(email, password);
      localStorage.setItem('admin', JSON.stringify(admin));
      dispatch({ type: 'LOGIN_SUCCESS', payload: admin });
      return true;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      // Re-throw the error so the Login component can handle it
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin');
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{
      state,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};