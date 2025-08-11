import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface KeywordInputProps {
  onKeywordsChange: (keywords: string[]) => void;
  placeholder?: string;
}

const SUGGESTED_KEYWORDS = [
  'restaurants', 'retail shops', 'tech companies', 'car dealers', 'real estate',
  'medical clinics', 'law firms', 'beauty salons', 'fitness centers', 'hotels',
  'banks', 'pharmacies', 'auto repair', 'construction', 'marketing agencies',
  'accounting firms', 'dental clinics', 'veterinary clinics', 'travel agencies',
  'insurance companies', 'consulting services', 'educational services'
];

export const KeywordInput: React.FC<KeywordInputProps> = ({ 
  onKeywordsChange, 
  placeholder = "Type keywords and press Enter..." 
}) => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newKeyword = inputValue.trim();
      if (!keywords.includes(newKeyword)) {
        const updatedKeywords = [...keywords, newKeyword];
        setKeywords(updatedKeywords);
        onKeywordsChange(updatedKeywords);
      }
      setInputValue('');
    }
  };

  const removeKeyword = (indexToRemove: number) => {
    const updatedKeywords = keywords.filter((_, index) => index !== indexToRemove);
    setKeywords(updatedKeywords);
    onKeywordsChange(updatedKeywords);
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      const updatedKeywords = [...keywords, keyword];
      setKeywords(updatedKeywords);
      onKeywordsChange(updatedKeywords);
    }
  };

  const availableSuggestions = SUGGESTED_KEYWORDS.filter(
    suggestion => !keywords.includes(suggestion)
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(index)}
                className="p-0.5 hover:bg-blue-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggested Keywords */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Suggested Keywords:</div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableSuggestions.slice(0, 12).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addSuggestedKeyword(suggestion)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
