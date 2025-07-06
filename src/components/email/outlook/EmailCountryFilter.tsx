'use client';

import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, X } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface EmailCountryFilterProps {
  onFilterChange: (countries: string[]) => void;
  selectedCountries?: string[];
}

export default function EmailCountryFilter({ 
  onFilterChange, 
  selectedCountries = [] 
}: EmailCountryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(selectedCountries);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  // Load countries
  useEffect(() => {
    async function loadCountries() {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from an API
        // For now, we'll use a small set of sample countries
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const sampleCountries: Country[] = [
          { code: 'US', name: 'United States', flag: '🇺🇸' },
          { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
          { code: 'CA', name: 'Canada', flag: '🇨🇦' },
          { code: 'AU', name: 'Australia', flag: '🇦🇺' },
          { code: 'DE', name: 'Germany', flag: '🇩🇪' },
          { code: 'FR', name: 'France', flag: '🇫🇷' },
          { code: 'IT', name: 'Italy', flag: '🇮🇹' },
          { code: 'ES', name: 'Spain', flag: '🇪🇸' },
          { code: 'JP', name: 'Japan', flag: '🇯🇵' },
          { code: 'CN', name: 'China', flag: '🇨🇳' },
          { code: 'IN', name: 'India', flag: '🇮🇳' },
          { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
          { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
          { code: 'RU', name: 'Russia', flag: '🇷🇺' },
          { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
        ];
        
        setCountries(sampleCountries);
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCountries();
  }, []);

  // Initialize selected countries
  useEffect(() => {
    if (selectedCountries.length > 0) {
      setSelected(selectedCountries);
    }
  }, [selectedCountries]);

  const toggleCountry = (code: string) => {
    const newSelected = selected.includes(code)
      ? selected.filter(c => c !== code)
      : [...selected, code];
    
    setSelected(newSelected);
    onFilterChange(newSelected);
  };

  const clearFilters = () => {
    setSelected([]);
    onFilterChange([]);
  };

  const filteredCountries = countries.filter(country => {
    if (!search) return true;
    return (
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.code.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-2 border rounded-md text-sm ${selected.length > 0 ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
      >
        <Globe size={16} className="mr-2" />
        {selected.length === 0 ? (
          <span>Filter by country</span>
        ) : (
          <span>Countries: {selected.length}</span>
        )}
        <ChevronDown size={14} className="ml-2" />
      </button>
      
      {selected.length > 0 && (
        <button
          onClick={clearFilters}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
          title="Clear country filters"
        >
          <X size={14} />
        </button>
      )}
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white border rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search countries..."
              className="w-full px-2 py-1 border rounded-md text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading countries...</p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map(country => (
                <div
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selected.includes(country.code) ? 'bg-blue-50' : ''}`}
                >
                  <span className="mr-2" role="img" aria-label={country.name}>
                    {country.flag}
                  </span>
                  <span className="flex-1">{country.name}</span>
                  {selected.includes(country.code) && (
                    <Check size={16} className="text-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t bg-gray-50 flex justify-between">
            <span className="text-xs text-gray-500">
              {selected.length} countries selected
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
