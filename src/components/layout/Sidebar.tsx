import React from 'react';
import { 
  BarChart3, 
  Globe, 
  Building2, 
  MapPin, 
  Zap, 
  Users,
  TrendingUp,
  Layers,
  X
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  description?: string;
}

// Primary workflow navigation - daily work tools
const primaryNavigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Location Management Workflow'
  },
  {
    id: 'countries-management',
    label: 'Countries',
    icon: <Globe className="w-5 h-5" />,
    badge: '12',
    description: 'Manage country database'
  },
  {
    id: 'cities-management',
    label: 'Cities',
    icon: <Building2 className="w-5 h-5" />,
    badge: '247',
    description: 'City data management'
  },
  {
    id: 'areas-management',
    label: 'Areas',
    icon: <MapPin className="w-5 h-5" />,
    badge: '1.2k',
    description: 'Business area definitions'
  },
  {
    id: 'jobs',
    label: 'Scraping Jobs',
    icon: <Zap className="w-5 h-5" />,
    badge: 'NEW',
    description: 'Data collection tasks'
  }
];

// Secondary/administrative navigation - housekeeping functions
const generalNavigation = [
  {
    id: 'businesses',
    label: 'Business Data',
    icon: <Users className="w-5 h-5" />,
    description: 'Collected business information'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Performance insights'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange }) => {
  const { isOpen, isMobile, closeSidebar } = useSidebar();

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <aside className={`
      fixed h-screen overflow-y-auto z-50 flex flex-col
      transition-transform duration-300 ease-smooth
      scrollbar-none bg-white border-r border-gray-200
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isMobile ? 'w-72 shadow-2xl' : 'w-72'}
    `}>
      {/* Header/Branding section with professional polish */}
      <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[19px] font-semibold text-[#1d1d1f] tracking-[-0.025em] leading-[1.2]">
                LeadGen Enterprise
              </div>
              <div className="text-[13px] text-[#86868b] font-medium mt-0.5 tracking-[-0.01em]">
                Admin Console
              </div>
            </div>
          </div>
          
          {/* Mobile close button with improved styling */}
          {isMobile && (
            <button
              onClick={closeSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 lg:hidden hover:scale-105"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation - Main Menu */}
      <nav className="flex-1 py-4">
        {/* Main Menu Section with enhanced styling */}
        <div className="px-6 py-3 mb-1">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b] leading-4 flex items-center">
            <span className="w-2 h-2 bg-primary-400 rounded-full mr-2"></span>
            MENU
          </h3>
        </div>
        
        {/* Primary navigation items with enhanced interactions */}
        <div className="space-y-0.5">
          {primaryNavigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`
                w-full flex items-center px-4 py-3 text-sm font-medium
                transition-all duration-300 ease-smooth text-left group relative
                ${currentSection === item.id
                  ? 'bg-primary-600 text-white shadow-lg mx-0 rounded-none border-r-4 border-primary-800'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 mx-2 rounded-lg hover:shadow-sm hover:border-l-2 hover:border-primary-200'
                }
              `}
              title={item.description}
            >
              {/* Active state indicator line */}
              {currentSection === item.id && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></span>
              )}
              
              {/* Icon with enhanced styling */}
              <span className={`mr-3 flex-shrink-0 transition-all duration-300 ${
                currentSection === item.id 
                  ? 'text-white scale-110' 
                  : 'text-gray-500 group-hover:text-primary-600 group-hover:scale-105'
              }`}>
                {item.icon}
              </span>
              
              {/* Label with improved typography */}
              <span className="flex-1 text-[15px] font-medium tracking-[-0.015em]">{item.label}</span>
              
              {/* Enhanced contextual badges */}
              {item.badge && (
                <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-bold leading-none transition-all duration-200 ${
                  currentSection === item.id 
                    ? 'bg-white/25 text-white shadow-sm'
                    : item.badge === 'NEW'
                    ? 'bg-primary-100 text-primary-700 group-hover:bg-primary-200'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Enhanced separator with professional styling */}
        <div className="mx-6 my-6 relative">
          <div className="border-t border-gray-200"></div>
          <div className="absolute inset-0 flex justify-center">
            <div className="bg-white px-2">
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* General Section with enhanced styling */}
        <div className="px-6 py-3 mb-1">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b] leading-4 flex items-center">
            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
            GENERAL
          </h3>
        </div>
        
        {/* General navigation items with consistent styling */}
        <div className="space-y-0.5">
          {generalNavigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`
                w-full flex items-center px-4 py-3 text-sm font-medium
                transition-all duration-300 ease-smooth text-left group relative
                ${currentSection === item.id
                  ? 'bg-primary-600 text-white shadow-lg mx-0 rounded-none border-r-4 border-primary-800'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 mx-2 rounded-lg hover:shadow-sm hover:border-l-2 hover:border-primary-200'
                }
              `}
              title={item.description}
            >
              {/* Active state indicator line */}
              {currentSection === item.id && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></span>
              )}
              
              {/* Icon with enhanced styling */}
              <span className={`mr-3 flex-shrink-0 transition-all duration-300 ${
                currentSection === item.id 
                  ? 'text-white scale-110' 
                  : 'text-gray-500 group-hover:text-primary-600 group-hover:scale-105'
              }`}>
                {item.icon}
              </span>
              
              {/* Label with improved typography */}
              <span className="flex-1 text-[15px] font-medium tracking-[-0.015em]">{item.label}</span>
              
              {/* Badge support for consistency */}
              {item.badge && (
                <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-bold leading-none transition-all duration-200 ${
                  currentSection === item.id 
                    ? 'bg-white/25 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Professional footer with user context */}
      <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-[#1d1d1f] truncate tracking-[-0.015em]">
              Administrator
            </div>
            <div className="text-[13px] text-[#86868b] truncate tracking-[-0.01em]">
              Lead Generation System
            </div>
          </div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-subtle" title="Online"></div>
        </div>
      </div>

    </aside>
  );
};