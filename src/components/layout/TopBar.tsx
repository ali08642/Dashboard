import React from 'react';
import { Settings, Menu } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

interface TopBarProps {
  title: string;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onOpenSettings }) => {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="bg-[rgba(255,255,255,0.72)] backdrop-blur-md border-b border-[rgba(0,0,0,0.08)] px-6 py-4 sticky top-0 z-30 shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between">
        {/* Left section: Mobile menu + Title */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu */}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-[#1d1d1f]" />
          </button>
          
          {/* Page title with Apple typography */}
          <div>
            <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-[-0.025em] leading-[1.2]">
              {title}
            </h1>
          </div>
        </div>
        
        {/* Right section: Settings */}
        <div className="flex items-center">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] rounded-[12px] transition-all duration-200"
          >
            <Settings className="w-4 h-4 text-[#1d1d1f]" />
            <span className="hidden sm:inline text-[15px] font-medium text-[#1d1d1f] tracking-[-0.015em]">
              Settings
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};