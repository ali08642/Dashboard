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
    <div className="fixed top-5 right-5 max-w-[420px] bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] z-[300] overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
      <div className="flex items-center gap-4 p-5 bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.08)]">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-lg
          ${notification.type === 'success' 
            ? 'bg-[rgba(52,199,89,0.1)] text-[#34c759]' 
            : 'bg-[rgba(0,113,227,0.1)] text-[#0071e3]'
          }
        `}>
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-[#1d1d1f] mb-0.5 tracking-[-0.02em]">
            {notification.title}
          </div>
          <div className="text-xs text-[#86868b]">
            {notification.subtitle}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-sm text-[#1d1d1f] leading-relaxed mb-5">
          {notification.message}
        </div>
        
        {notification.type === 'processing' && (
          <div className="h-1 bg-[rgba(0,0,0,0.06)] rounded-sm overflow-hidden">
            <div className="h-full bg-[#0071e3] rounded-sm animate-pulse" style={{
              animation: 'progressAnimation 2s ease-in-out infinite'
            }} />
          </div>
        )}
      </div>
    </div>
  );
};