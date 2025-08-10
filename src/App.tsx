import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SidebarProvider } from './context/SidebarContext';
import './styles/animations.css';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { QueryProvider } from './context/QueryProvider';
import { usePrefetch } from './hooks/useOptimizedQuery';
import { Layout } from './components/layout/Layout';
import { SettingsModal } from './components/modals/SettingsModal';
import { Dashboard } from './pages/Dashboard';
import { CountriesManagement } from './pages/CountriesManagement';
import { CitiesManagement } from './pages/CitiesManagement';
import { AreasManagement } from './pages/AreasManagement';
import { ScrapeJobsManagement } from './pages/ScrapeJobsManagement';
import { BusinessesManagement } from './pages/BusinessesManagement';
import { BusinessInteractions } from './pages/BusinessInteractions';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AuthStateDebugger } from './components/debug/AuthStateDebugger';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main Dashboard Layout Component
const DashboardLayout: React.FC = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { prefetchCountries, prefetchBusinessStats, prefetchBusinesses } = usePrefetch();

  // Prefetch data for likely navigation targets
  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    
    // Prefetch data for sections user is likely to visit next
    if (section === 'dashboard') {
      prefetchBusinessStats();
      prefetchBusinesses(); // Prefetch first page of businesses
    } else if (section === 'businesses') {
      prefetchBusinessStats(); // Stats are shown on business page
    } else if (section === 'countries-management') {
      prefetchCountries();
    }
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'countries-management':
        return <CountriesManagement />;
      case 'cities-management':
        return <CitiesManagement />;
      case 'areas-management':
        return <AreasManagement />;
      case 'jobs':
        return <ScrapeJobsManagement />;
      case 'businesses':
        return <BusinessesManagement />;
      case 'businesses-interactions':
        return <BusinessInteractions />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 leading-relaxed antialiased">
          <Layout
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
            onOpenSettings={() => setIsSettingsOpen(true)}
          >
            {renderCurrentSection()}
          </Layout>

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </SidebarProvider>
    </AppProvider>
  );
};

// Auth Routes Component
const AuthRoutes: React.FC = () => {
  const { state } = useAuth();
  
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If already authenticated, redirect to dashboard
  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Main App Content
const AppContent: React.FC = () => {
  const { state } = useAuth();
  
  console.log('AppContent: Current auth state:', state);
  
  // Show loading while determining auth state
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Auth routes (login/signup) - only show if not authenticated */}
      <Route path="/login" element={
        state.isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <Login />
      } />
      <Route path="/signup" element={
        state.isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <Signup />
      } />
      
      {/* Protected dashboard route */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="/" element={
        state.isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <Navigate to="/login" replace />
      } />
      
      {/* Catch all route */}
      <Route path="*" element={
        state.isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <AppContent />
          {/* Debug panel - remove in production */}
          {process.env.NODE_ENV === 'development' && <AuthStateDebugger />}
        </Router>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;