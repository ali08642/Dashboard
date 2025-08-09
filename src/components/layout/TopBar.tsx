import React, { useState, useEffect, useRef } from 'react';
import { Settings, Menu, Search, Bell, Mail, ChevronDown, LogOut, User } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  title: string;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onOpenSettings }) => {
  const { toggleSidebar } = useSidebar();
  const { state, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-6 py-3 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu (mobile) + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="truncate text-xl lg:text-2xl font-semibold text-gray-800 tracking-[-0.025em]">
            {title}
          </h1>
        </div>

        {/* Center: Search */}
        <div className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-20 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 select-none">
              ⌘K
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-700" />
            <span className="hidden md:inline text-sm font-medium text-gray-800">Settings</span>
          </button>

          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition" title="Notifications">
            <Bell className="w-4 h-4 text-gray-700" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition" title="Inbox">
            <Mail className="w-4 h-4 text-gray-700" />
          </button>

          {/* Profile */}
          <div ref={userMenuRef} className="hidden lg:flex items-center gap-3 pl-3 ml-1 border-l border-gray-200 relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-xs font-bold">
              {state.admin?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-800">
                {state.admin?.name || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {state.admin?.email || 'user@example.com'}
              </div>
            </div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Application Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};