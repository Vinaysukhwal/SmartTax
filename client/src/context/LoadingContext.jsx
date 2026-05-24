/**
 * LoadingContext.jsx — Global Loading Spinner Context
 * 
 * Intercepts all Axios request calls to toggle a fullscreen dark overlay
 * spinner while any API call is in progress.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import API from '../config/api';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    // Add request interceptor
    const reqInterceptor = API.interceptors.request.use(
      (config) => {
        setActiveRequests((prev) => prev + 1);
        return config;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    const resInterceptor = API.interceptors.response.use(
      (response) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return response;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      API.interceptors.request.eject(reqInterceptor);
      API.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const isLoading = activeRequests > 0;

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-[#0f0f0f]/80 backdrop-blur-sm z-[9999] flex items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
            <p className="text-sm font-bold text-[#d2bbff] animate-pulse">Syncing with secure server...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
