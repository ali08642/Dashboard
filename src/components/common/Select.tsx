import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  hint,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="form-group mb-6">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-800 tracking-[-0.02em]">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer
          transition-all duration-200 tracking-[-0.02em] text-gray-800
          focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary-200
          appearance-none bg-[url("data:image/svg+xml,%3Csvg width='14' height='8' viewBox='0 0 14 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L7 7L13 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")]
          bg-no-repeat bg-[right_16px_center] pr-10
          ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-100' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <div className="mt-1.5 text-xs text-gray-500">{hint}</div>
      )}
      {error && (
        <div className="mt-1.5 text-xs text-error-500">{error}</div>
      )}
    </div>
  );
};