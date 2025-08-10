import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface KeywordInputProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const KeywordInput: React.FC<KeywordInputProps> = ({
  keywords,
  onKeywordsChange,
  placeholder = "Type keywords and press Enter...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onKeywordsChange([...keywords, trimmed]);
    }
    setInputValue('');
  };

  const removeKeyword = (index: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
      removeKeyword(keywords.length - 1);
    }
  };

  const handleAddClick = () => {
    addKeyword(inputValue);
  };

  return (
    <div className={`border border-gray-300 rounded-xl p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 ${className}`}>
      {/* Keywords Display */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(index)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-200"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm placeholder-gray-500"
        />
        {inputValue.trim() && (
          <button
            onClick={handleAddClick}
            type="button"
            className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500">
        Press Enter or click + to add keywords. Press Backspace to remove the last keyword.
      </div>
    </div>
  );
};
