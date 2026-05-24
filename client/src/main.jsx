/**
 * Main Entry Point
 * 
 * Renders the App component into the DOM.
 * Imports global CSS (which includes Tailwind CSS).
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
