import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { SidebarProvider } from './context/SidebarContext';
import { Layout } from './components/layout/Layout';
import { SettingsModal } from './components/modals/SettingsModal';
import { Dashboard } from './pages/Dashboard';
import { CountriesManagement } from './pages/CountriesManagement';
import { CitiesManagement } from './pages/CitiesManagement';
import { AreasManagement } from './pages/AreasManagement';
import { ScrapeJobsManagement } from './pages/ScrapeJobsManagement';
import { BusinessesManagement } from './pages/BusinessesManagement';
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      case 'analytics':
        return <PlaceholderPage 
          title="Performance Analytics" 
          description="Advanced analytics and reporting dashboard coming soon..." 
        />;
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
            onSectionChange={setCurrentSection}
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
}

export default App;