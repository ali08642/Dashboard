import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`
          bg-white rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] w-full ${sizeClasses[size]} 
          max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300
        `}
      >
        <div className="flex items-center justify-between p-7 border-b border-[rgba(0,0,0,0.08)]">
          <h3 className="text-[19px] font-semibold text-[#1d1d1f] tracking-[-0.025em] leading-[1.2]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.1)] rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-4 h-4 text-[#86868b]" />
          </button>
        </div>
        
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};