import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

// Register user - update to include role parameter
export const register = async (username: string, email: string, password: string, role?: string) => {
  const response = await axios.post(`${API_URL}/register`, { username, email, password, role });
  
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
};

// Login user
export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Get current user profile
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await axios.get(`${API_URL}/me`, {
    headers: {
      'x-auth-token': token
    }
  });
  
  return response.data;
};

// Set auth token for all requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};