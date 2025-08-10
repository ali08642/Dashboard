import React from 'react';
import { useAuth } from '../../context/useAuth';
import { Eye, User, Shield } from 'lucide-react';

export const AuthStateDebugger: React.FC = () => {
  const { state } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-sm">Auth State Debug</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Loading:</span>
          <span className={state.loading ? 'text-orange-600' : 'text-green-600'}>
            {state.loading ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Authenticated:</span>
          <span className={state.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {state.isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Admin:</span>
          <span className={state.admin ? 'text-green-600' : 'text-gray-400'}>
            {state.admin ? 'Loaded' : 'None'}
          </span>
        </div>
        
        {state.admin && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-xs">Admin Info:</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>ID: {state.admin.id.substring(0, 8)}...</div>
              <div>Email: {state.admin.email}</div>
              <div>Name: {state.admin.name}</div>
              <div>Status: {state.admin.status}</div>
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 mb-1">
            <Shield className="w-3 h-3 text-blue-600" />
            <span className="font-medium text-xs">LocalStorage:</span>
          </div>
          <div className="text-xs text-gray-600">
            {localStorage.getItem('admin') ? 'Admin data stored' : 'No admin data'}
          </div>
        </div>
      </div>
    </div>
  );
};
