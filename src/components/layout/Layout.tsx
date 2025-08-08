import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Notification } from '../common/Notification';
import { useSidebar } from '../../context/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const sectionTitles: Record<string, string> = {
  'dashboard': 'Location Management',
  'countries-management': 'Countries Management',
  'cities-management': 'Cities Management',
  'areas-management': 'Areas Management',
  'jobs': 'Scraping Jobs',
  'businesses': 'Business Data',
  'analytics': 'Performance Analytics'
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentSection,
  onSectionChange,
  onOpenSettings
}) => {
  const { isOpen, isMobile, closeSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={closeSidebar}
        />
      )}

      <Sidebar currentSection={currentSection} onSectionChange={onSectionChange} />
      
      <main className={`
        flex-1 bg-gray-50 transition-all duration-300 ease-smooth
        ${!isMobile && isOpen ? 'ml-72' : 'ml-0'}
      `}>
        <TopBar 
          title={sectionTitles[currentSection] || 'Dashboard'} 
          onOpenSettings={onOpenSettings}
        />
        
        <div className="px-6 py-6">
          {children}
        </div>
      </main>
      
      <Notification />
    </div>
  );
};