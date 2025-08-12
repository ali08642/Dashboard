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
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

// interface NavItem {
//   id: string;
//   label: string;
//   icon: React.ReactNode;
//   badge?: string;
//   description?: string;
// }

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
    id: 'businesses-interactions',
    label: 'Business Interactions',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Notes, calls and emails log'
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
  const { state } = useAuth();

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <aside className={`
      fixed h-screen overflow-y-auto z-50 flex flex-col bg-white/90 backdrop-blur-xl
      border-r border-gray-200 transition-transform duration-300 ease-smooth
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isMobile ? 'w-72 shadow-2xl' : 'w-72'}
    `}>
      {/* Header/Branding */}
      <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[19px] font-semibold text-gray-800 tracking-[-0.025em] leading-[1.2]">
                LeadGen Enterprise
              </div>
              <div className="text-[13px] text-gray-400 font-medium mt-0.5 tracking-[-0.01em]">
                Admin Console
              </div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={closeSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 py-4">
        <div className="px-6 py-3 mb-1">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-400 leading-4 flex items-center">
            <span className="w-2 h-2 bg-primary-400 rounded-full mr-2"></span>
            MENU
          </h3>
        </div>

        <div className="space-y-1">
          {primaryNavigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`
                w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm tracking-[-0.01em]
                transition-colors duration-200 text-left mx-2
                ${currentSection === item.id
                  ? 'bg-gray-100 text-gray-900 border-l-4 border-primary-600 pl-2.5'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              title={item.description}
            >
              <span className={`mr-3 flex-shrink-0 ${
                currentSection === item.id ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mx-6 my-6 relative">
          <div className="border-t border-gray-200"></div>
          <div className="absolute inset-0 flex justify-center">
            <div className="bg-white px-2">
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 mb-1">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-400 leading-4 flex items-center">
            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
            GENERAL
          </h3>
        </div>

        <div className="space-y-1">
          {generalNavigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`
                w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm tracking-[-0.01em]
                transition-colors duration-200 text-left mx-2
                ${currentSection === item.id
                  ? 'bg-gray-100 text-gray-900 border-l-4 border-primary-600 pl-2.5'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              title={item.description}
            >
              <span className={`mr-3 flex-shrink-0 ${
                currentSection === item.id ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {state.admin?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-gray-800 truncate tracking-[-0.015em]">
              {state.admin?.name || 'User'}
            </div>
            <div className="text-[13px] text-gray-400 truncate tracking-[-0.01em]">
              {state.admin?.login_status === 'online' ? 'online' : state.admin?.login_status || 'inactive'}
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            state.admin?.login_status === 'online' 
              ? 'bg-green-500 animate-pulse-subtle' 
              : 'bg-gray-400'
          }`} title={state.admin?.login_status === 'online' ? 'Online' : 'Offline'}></div>
        </div>
      </div>

    </aside>
  );
};