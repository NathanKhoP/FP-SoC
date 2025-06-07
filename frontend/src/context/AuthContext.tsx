import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AuthState, User } from '../types';
import * as authService from '../services/authService';

// Initial state for authentication
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types for authentication
type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { token: string } }
  | { type: 'USER_LOADED'; payload: User }
  | { type: 'AUTH_ERROR' | 'LOGIN_FAIL' | 'LOGOUT' | 'REGISTER_FAIL' }
  | { type: 'REGISTER_SUCCESS'; payload: { token: string } }
  | { type: 'AUTH_ERROR_WITH_MESSAGE'; payload: string };

// Reducer for authentication state
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload,
      };
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR_WITH_MESSAGE':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Create the auth context
interface AuthContextProps {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Create the Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        authService.setAuthToken(localStorage.token);

        try {
          const userData = await authService.getCurrentUser();
          dispatch({ type: 'USER_LOADED', payload: userData });
        } catch (err) {
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'AUTH_ERROR' });
      }
    };

    loadUser();
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token: res.token } });

      // Load user data after successful login
      try {
        const userData = await authService.getCurrentUser();
        dispatch({ type: 'USER_LOADED', payload: userData });
      } catch (err) {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } catch (err: any) {
      let errorMessage = 'Login failed';

      if (err.response?.data) {
        // Handle validation errors array
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map((error: any) => error.msg).join(', ');
        } 
        // Handle single error message
        else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      dispatch({ type: 'AUTH_ERROR_WITH_MESSAGE', payload: errorMessage });
    }
  };

  // Register user
  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await authService.register(username, email, password);
      dispatch({ type: 'REGISTER_SUCCESS', payload: { token: res.token } });

      // Load user data after successful registration
      try {
        const userData = await authService.getCurrentUser();
        dispatch({ type: 'USER_LOADED', payload: userData });
      } catch (err) {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } catch (err: any) {
      let errorMessage = 'Registration failed';

      if (err.response?.data) {
        // Handle validation errors array
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map((error: any) => error.msg).join(', ');
        } 
        // Handle single error message
        else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      dispatch({ type: 'AUTH_ERROR_WITH_MESSAGE', payload: errorMessage });
    }
  };

  // Logout user
  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for using the auth context
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};