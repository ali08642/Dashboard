import React, { useState } from 'react';
import { Sparkles, MapPin, Tag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { KeywordInput } from '../common/KeywordInput';

interface ContextAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keywords: string[]) => void;
  countryName: string;
  cityName: string;
  loading?: boolean;
}

export const ContextAreasModal: React.FC<ContextAreasModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  countryName,
  cityName,
  loading = false
}) => {
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSubmit = () => {
    if (keywords.length > 0) {
      onSubmit(keywords);
    }
  };

  const handleClose = () => {
    setKeywords([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Context-Based Areas"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
            disabled={keywords.length === 0}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Generate Areas
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Context Information */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Context
          </h4>
          <div className="text-sm text-purple-700">
            <p><strong>Country:</strong> {countryName}</p>
            <p><strong>City:</strong> {cityName}</p>
          </div>
        </div>

        {/* Keywords Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Business Keywords
          </label>
          <KeywordInput 
            onKeywordsChange={setKeywords}
            placeholder="Enter business types (e.g., restaurants, tech companies, car dealers)..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Add keywords that describe the types of businesses you want to find areas for.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>AI analyzes your keywords and location context</li>
            <li>Identifies business districts that match your criteria</li>
            <li>New areas are automatically added to your database</li>
            <li>Areas appear in the workflow, ready for lead generation</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
