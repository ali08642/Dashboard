import React, { useState } from 'react';
import { X, MapPin, Calendar } from 'lucide-react';
import { Button } from '../common/Button';

interface Area {
  id: number;
  name: string;
  city_id: number;
  created_at: string;
}

interface GeneratedAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: Area[];
  keywords: string[];
  cityName: string;
  countryName: string;
}

export const GeneratedAreasModal: React.FC<GeneratedAreasModalProps> = ({
  isOpen,
  onClose,
  areas,
  keywords,
  cityName,
  countryName
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  // Filter areas by search term
  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-600" />
              Generated Areas
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Location:</span> {cityName}, {countryName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Keywords:</span> {keywords.join(', ')}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Generated:</span> {areas.length} new areas
                {searchFilter && filteredAreas.length !== areas.length && (
                  <span className="text-purple-600"> • Showing {filteredAreas.length}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {areas.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No areas were generated</p>
            </div>
          ) : (
            <>
              {/* Search Filter */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search areas by name..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAreas.map((area, index) => (
                <div
                  key={area.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {area.name}
                    </h3>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(area.created_at).toLocaleString()}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    ID: {area.id}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            These areas have been added to your database and are now available for scraping jobs.
          </div>
          <Button
            onClick={onClose}
            variant="primary"
            className="ml-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
