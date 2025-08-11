import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { PlaceholderPage } from './pages/PlaceholderPage';
import { Analytics } from './pages/Analytics';
import { BusinessInteractions } from './pages/BusinessInteractions';
import { Login } from './pages/Login';

const AppContent: React.FC = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { state } = useAuth();
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

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Login />;
  }

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

        <style jsx global>{`
          @keyframes progressAnimation {
            0% { width: 20%; }
            50% { width: 80%; }
            100% { width: 20%; }
          }
          
          .scrollbar-none::-webkit-scrollbar {
            width: 0;
          }
          
          .animate-pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .animate-in {
            animation-fill-mode: both;
          }
          
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slide-in-from-top {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes zoom-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          
          .fade-in-0 { animation: fade-in 0.2s ease-out; }
          .slide-in-from-top-2 { animation: slide-in-from-top 0.2s ease-out; }
          .zoom-in-95 { animation: zoom-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          
          .duration-200 { animation-duration: 200ms; }
          .duration-300 { animation-duration: 300ms; }
        `}</style>
        </div>
      </SidebarProvider>
    </AppProvider>
  );
};

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;