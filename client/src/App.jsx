/**
 * App.jsx — Main Application Component
 * 
 * Sets up:
 * - React Router with all page routes
 * - AuthProvider for global auth state
 * - Navbar on all pages
 * - Footer on all pages
 * - ChatBot floating widget on all pages
 * - Toast notifications
 * - Protected routes for authenticated pages
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';

// Page imports
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import Calculator from './pages/Calculator';
import ItrRecommenderPage from './pages/ItrRecommenderPage';
import ItrWizard from './pages/ItrWizard';
import DeductionsPage from './pages/DeductionsPage';
import DocumentVault from './pages/DocumentVault';
import NoticesPage from './pages/NoticesPage';
import ChallanPage from './pages/ChallanPage';
import Chatbot from './pages/Chatbot';
import SmartDashboard from './pages/SmartDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LoadingProvider>
          {/* Toast notifications container */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#15121b',
                color: '#e8dfee',
                border: '1px solid rgba(149, 141, 161, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
          />

          {/* App Layout */}
          <div className="min-h-screen flex flex-col">
            {/* Navigation Bar — shown on every page */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1">
              <Routes>
                {/* Public Routes — no login required */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/calculators" element={<Calculator />} />

                {/* Protected Routes — require login */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/itr-recommender" element={<ProtectedRoute><ItrRecommenderPage /></ProtectedRoute>} />
                <Route path="/file-itr" element={<ProtectedRoute><ItrWizard /></ProtectedRoute>} />
                <Route path="/deductions" element={<ProtectedRoute><DeductionsPage /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><DocumentVault /></ProtectedRoute>} />
                <Route path="/notices" element={<ProtectedRoute><NoticesPage /></ProtectedRoute>} />
                <Route path="/challan" element={<ProtectedRoute><ChallanPage /></ProtectedRoute>} />
                <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
                <Route path="/smart-dashboard" element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />
              </Routes>
            </main>

            {/* Footer — shown on every page */}
            <Footer />

            {/* AI Chatbot — floating widget on every page except /chatbot */}
            <ChatBot />
          </div>
        </LoadingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
