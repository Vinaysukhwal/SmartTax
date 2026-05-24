/**
 * Authentication Context
 * 
 * Provides global auth state to the entire app using React Context.
 * Handles:
 * - User login and registration
 * - JWT token storage in localStorage
 * - Auto-loading user data on app start
 * - Axios interceptor to attach JWT to all API requests
 * - Logout functionality
 * 
 * Usage in components:
 *   const { user, login, register, logout, loading } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from 'react';
import API from '../config/api';

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and provides auth state to all child components.
 */
export const AuthProvider = ({ children }) => {
  // State: current user object (null = not logged in)
  const [user, setUser] = useState(null);

  // State: JWT token
  const [token, setToken] = useState(localStorage.getItem('smarttax_token'));

  // State: loading flag (true while checking if user is already logged in)
  const [loading, setLoading] = useState(true);

  /**
   * Set up Axios interceptor to automatically attach the JWT token
   * to every API request as "Authorization: Bearer <token>"
   */
  useEffect(() => {
    const interceptor = API.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('smarttax_token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    // Cleanup: remove interceptor when component unmounts
    return () => API.interceptors.request.eject(interceptor);
  }, []);

  /**
   * On app load: check if there's a saved token and load user data
   */
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Try to fetch the user's profile with the saved token
          const response = await API.get('/user/profile');
          setUser({
            ...response.data,
            id: response.data._id || response.data.id
          });
        } catch (error) {
          // Token is invalid or expired — clear it
          console.error('Failed to load user:', error);
          localStorage.removeItem('smarttax_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  /**
   * Register a new user account
   * 
   * @param {string} name - User's full name
   * @param {string} email - Email address
   * @param {string} password - Password (min 6 chars)
   * @param {string} pan - PAN number (format: ABCDE1234F)
   * @returns {object} - The registered user data
   */
  const register = async (name, email, password, pan) => {
    const response = await API.post('/auth/register', { name, email, password, pan });

    // Save token and user data
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('smarttax_token', newToken);
    setToken(newToken);
    setUser(userData);

    return userData;
  };

  /**
   * Login with email and password
   * 
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {object} - The logged-in user data
   */
  const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });

    // Save token and user data
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('smarttax_token', newToken);
    setToken(newToken);
    setUser(userData);

    return userData;
  };

  /**
   * Logout the current user
   * Clears the token from localStorage and resets state
   */
  const logout = () => {
    localStorage.removeItem('smarttax_token');
    setToken(null);
    setUser(null);
  };

  /**
   * Update user data in state (after profile edit)
   * @param {object} updatedUser - New user data from API
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Provide auth state and methods to all child components
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access auth state and methods
 * 
 * Usage:
 *   const { user, login, register, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
