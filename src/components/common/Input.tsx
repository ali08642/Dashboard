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
        <label className="block mb-2 text-[15px] font-medium text-gray-800 tracking-[-0.015em]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[15px]
            bg-white transition-all duration-200 tracking-[-0.015em]
            placeholder:text-gray-400 text-gray-800
            focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-100' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <div className="mt-1.5 text-[13px] text-gray-500 tracking-[-0.01em]">{hint}</div>
      )}
      {error && (
        <div className="mt-1.5 text-[13px] text-error-500 tracking-[-0.01em]">{error}</div>
      )}
    </div>
  );
};