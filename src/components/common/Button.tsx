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
    inline-flex items-center gap-2 px-6 py-3 border-none rounded-3xl text-[15px] font-medium
    cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] 
    font-[-apple-system,BlinkMacSystemFont,"SF_Pro_Display","SF_Pro_Text","Helvetica_Neue",Helvetica,Arial,sans-serif]
    tracking-[-0.015em] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
  `;

  const variants = {
    primary: `
      bg-[#0071e3] text-white hover:bg-[#0051a8] hover:scale-[1.02] 
      hover:shadow-[0_8px_20px_rgba(0,113,227,0.3)]
    `,
    secondary: `
      bg-[rgba(0,0,0,0.06)] text-[#1d1d1f] hover:bg-[rgba(0,0,0,0.1)] 
      hover:scale-[1.02]
    `,
    danger: `
      bg-[#ff3b30] text-white hover:bg-[#d70015] hover:scale-[1.02] 
      hover:shadow-[0_8px_20px_rgba(255,59,48,0.3)]
    `
  };

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