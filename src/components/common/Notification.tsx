import React, { useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Notification: React.FC = () => {
  const { notification, hideNotification } = useApp();

  useEffect(() => {
    if (notification.visible && notification.type === 'success') {
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible, notification.type, hideNotification]);

  if (!notification.visible) return null;

  const Icon = notification.type === 'success' ? CheckCircle : Loader2;
  const iconClass = notification.type === 'success' ? '' : 'animate-spin';

  return (
    <div className="fixed top-5 right-5 max-w-[420px] bg-white rounded-2xl shadow-xl z-[300] overflow-hidden">
      <div className="flex items-center gap-4 p-5 bg-gray-50 border-b border-gray-200">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            notification.type === 'success'
              ? 'bg-green-100 text-success-500'
              : 'bg-primary-100 text-primary-600'
          }`}
        >
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-gray-900 mb-0.5 tracking-[-0.02em]">
            {notification.title}
          </div>
          <div className="text-xs text-gray-500">{notification.subtitle}</div>
        </div>
      </div>

      <div className="p-6">
        <div className="text-sm text-gray-900 leading-relaxed mb-5">
          {notification.message}
        </div>

        {notification.type === 'processing' && (
          <div className="h-1 bg-gray-200 rounded-sm overflow-hidden">
            <div className="h-full bg-primary-600 rounded-sm animate-pulse" style={{
              animation: 'progressAnimation 2s ease-in-out infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  );
};