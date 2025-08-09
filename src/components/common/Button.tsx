import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center gap-2 px-6 py-3 rounded-3xl text-[15px] font-medium
    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] tracking-[-0.015em]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-0
  `;

  const variants = {
    primary: `bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md`,
    secondary: `bg-gray-100 text-gray-900 hover:bg-gray-200`,
    danger: `bg-error-500 text-white hover:bg-error-600 hover:shadow-md`,
  } as const;

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};