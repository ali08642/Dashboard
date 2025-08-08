import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="form-group mb-6">
      {label && (
        <label className="block mb-2 text-[15px] font-medium text-[#1d1d1f] tracking-[-0.015em]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#86868b]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3.5 border border-[rgba(0,0,0,0.08)] rounded-xl text-[15px] 
            bg-white transition-all duration-200 ease-in-out font-inherit tracking-[-0.015em]
            focus:outline-none focus:border-[#0071e3] focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-[#ff3b30] focus:border-[#ff3b30] focus:shadow-[0_0_0_4px_rgba(255,59,48,0.15)]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <div className="mt-1.5 text-[13px] text-[#86868b] tracking-[-0.01em]">{hint}</div>
      )}
      {error && (
        <div className="mt-1.5 text-[13px] text-[#ff3b30] tracking-[-0.01em]">{error}</div>
      )}
    </div>
  );
};