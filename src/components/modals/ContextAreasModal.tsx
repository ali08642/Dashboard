import React, { useState } from 'react';
import { Sparkles, MapPin, Tag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { KeywordInput } from '../common/KeywordInput';

interface ContextAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keywords: string[]) => void;
  loading?: boolean;
  countryName?: string;
  cityName?: string;
}

export const ContextAreasModal: React.FC<ContextAreasModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  countryName,
  cityName
}) => {
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSubmit = () => {
    if (keywords.length === 0) {
      alert('Please add at least one keyword');
      return;
    }
    onSubmit(keywords);
  };

  const handleClose = () => {
    setKeywords([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Areas Based on Context"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} className="px-6 py-3">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            loading={loading} 
            className="px-6 py-3"
            disabled={keywords.length === 0}
          >
            Generate Areas
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Context Information */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/60 rounded-2xl p-6">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Area Generation
          </h4>
          <div className="text-sm text-purple-800 space-y-2">
            <p>
              This feature uses AI to generate relevant business areas based on your keywords and location context.
            </p>
            {(countryName || cityName) && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-white/60 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span className="font-medium">
                  Context: {cityName ? `${cityName}, ` : ''}{countryName || 'Unknown Location'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Keywords Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-900">
              Business Keywords
            </label>
          </div>
          <KeywordInput
            keywords={keywords}
            onKeywordsChange={setKeywords}
            placeholder="Enter keywords like 'car rental', 'wood work', 'restaurants'..."
            className="w-full"
          />
          <p className="text-sm text-gray-600">
            Add keywords that represent the types of businesses you're interested in. 
            The AI will generate relevant areas based on these keywords and your location.
          </p>
        </div>

        {/* Example Keywords */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Example Keywords:</h5>
          <div className="flex flex-wrap gap-2">
            {['restaurants', 'retail shops', 'car rental', 'wood work', 'medical services', 'real estate', 'automotive', 'beauty salon'].map((example) => (
              <button
                key={example}
                onClick={() => {
                  if (!keywords.includes(example)) {
                    setKeywords([...keywords, example]);
                  }
                }}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors duration-200"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h5 className="text-sm font-medium text-blue-900 mb-2">How it works:</h5>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Your keywords and location context are sent to our AI system</li>
            <li>The AI generates relevant business areas for your specified location</li>
            <li>New areas are automatically added to your database</li>
            <li>Areas appear in the workflow, ready for lead generation</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
