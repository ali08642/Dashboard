import React, { useState, useRef, useEffect } from 'react';
import type { Country } from '../../utils/types';

interface CountrySearchProps {
  countries: Country[];
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
}

const countryFlags: Record<string, string> = {
  'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'PK': '🇵🇰', 
  'IN': '🇮🇳', 'BD': '🇧🇩', 'DE': '🇩🇪', 'FR': '🇫🇷', 'ES': '🇪🇸',
  'IT': '🇮🇹', 'BR': '🇧🇷', 'MX': '🇲🇽', 'JP': '🇯🇵', 'KR': '🇰🇷',
  'CN': '🇨🇳', 'AF': '🇦🇫', 'AL': '🇦🇱', 'DZ': '🇩🇿'
};

export const CountrySearch: React.FC<CountrySearchProps> = ({
  countries,
  selectedCountry,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCountry) {
      const flag = countryFlags[selectedCountry.iso_code] || '🌍';
      setSearchTerm(`${flag} ${selectedCountry.name}`);
    } else {
      setSearchTerm('');
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (searchTerm && !selectedCountry) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.iso_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [searchTerm, countries, selectedCountry]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (selectedCountry) {
      onSelect(null as any); // Clear selection when typing
    }
    setIsOpen(true);
  };

  const handleCountrySelect = (country: Country) => {
    onSelect(country);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Search countries..."
        className={`
          w-full px-4 py-3.5 border border-[rgba(0,0,0,0.08)] rounded-xl text-sm 
          bg-white transition-all duration-200 ease-in-out font-inherit tracking-[-0.02em]
          focus:outline-none focus:border-[#0071e3] focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]
          ${selectedCountry ? 'bg-[rgba(0,113,227,0.05)] border-[#0071e3] font-medium text-[#1d1d1f]' : ''}
        `}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl max-h-[280px] overflow-y-auto z-50 shadow-[0_10px_40px_rgba(0,0,0,0.12)] animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {filteredCountries.length === 0 ? (
            <div className="p-5 text-center text-[#86868b] italic">
              No countries found
            </div>
          ) : (
            filteredCountries.map((country) => (
              <button
                key={country.id}
                onClick={() => handleCountrySelect(country)}
                className="w-full flex items-center gap-3 p-3.5 cursor-pointer transition-colors duration-200 border-b border-[rgba(0,0,0,0.08)] last:border-b-0 hover:bg-[rgba(0,113,227,0.08)] text-left"
              >
                <div className="text-xl w-7 text-center">
                  {countryFlags[country.iso_code] || '🌍'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#1d1d1f] text-sm">
                    {country.name}
                  </div>
                  <div className="text-xs text-[#86868b] mt-0.5">
                    {country.iso_code} • {country.cities_populated ? `${country.cities_count} cities` : 'No cities'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};