import React, { useState, useEffect } from 'react';
import { Zap, Building2, RotateCcw, ArrowLeft, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkflowSteps } from '../components/workflow/WorkflowSteps';
import { CountrySearch } from '../components/workflow/CountrySearch';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { countryApi, webhookApi } from '../utils/api';
import type { Country, City, Area } from '../utils/types';

export const Dashboard: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState({ cities: false, areas: false });
  const [forceRefresh, setForceRefresh] = useState(false);
  const [keywords, setKeywords] = useState('car rental, restaurant, hotel, pharmacy');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const countries = await countryApi.getAll();
      dispatch({ type: 'SET_ALL_COUNTRIES', payload: countries });
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const handleCountrySelect = (country: Country) => {
    dispatch({ type: 'SET_SELECTED_COUNTRY', payload: country });
  };

  const initializeCities = async () => {
    if (!state.selectedCountry) {
      alert('Please select a country first');
      return;
    }

    setLoading({ ...loading, cities: true });
    dispatch({ type: 'SET_WORKFLOW_START_TIME', payload: Date.now() });

    const keywordList = keywords.split(',').map(k => k.trim());

    if (forceRefresh) {
      showNotification(
        'processing',
        'AI Generation Active',
        'Creating comprehensive city database',
        `Our advanced AI system is analyzing geographical data and generating a comprehensive list of cities for ${state.selectedCountry.name} with business potential.`
      );
    } else {
      showNotification(
        'processing',
        'Data Retrieval',
        'Checking existing records',
        `Scanning database for existing city data in ${state.selectedCountry.name}. If insufficient data is found, AI generation will commence automatically.`
      );
    }

    try {
      const cities = await webhookApi.initializeCities(
        state.selectedCountry.id,
        forceRefresh,
        keywordList
      );

      hideNotification();

      if (Array.isArray(cities) && cities.length > 0) {
        dispatch({ type: 'SET_CITIES', payload: cities });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });

        showNotification(
          'success',
          'Cities Loaded Successfully',
          'Data initialization complete',
          `Successfully loaded ${cities.length} cities for ${state.selectedCountry.name}. You can now proceed to generate business areas.`
        );
      } else {
        throw new Error('No cities data received');
      }
    } catch (error: any) {
      hideNotification();
      alert('Failed to initialize cities: ' + error.message);
    } finally {
      setLoading({ ...loading, cities: false });
    }
  };

  const initializeAreas = async () => {
    if (!state.selectedCityId) {
      alert('Please select a city first');
      return;
    }

    setLoading({ ...loading, areas: true });

    const selectedCity = state.cities.find(city => city.id === state.selectedCityId);
    const hasAreas = selectedCity && selectedCity.areas_populated;

    if (hasAreas) {
      showNotification(
        'processing',
        'Data Retrieval',
        'Loading existing areas',
        `Retrieving business area data for ${state.selectedCityName} from the enterprise database.`
      );
    } else {
      showNotification(
        'processing',
        'AI Area Generation',
        'Creating business zones',
        `Analyzing ${state.selectedCityName} to identify optimal business districts and commercial areas using advanced geographical AI.`
      );
    }

    try {
      const areas = await webhookApi.initializeAreas(state.selectedCityId);
      hideNotification();

      if (Array.isArray(areas) && areas.length > 0) {
        dispatch({ type: 'SET_AREAS', payload: areas });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });

        const completionTime = state.workflowStartTime 
          ? Math.round((Date.now() - state.workflowStartTime) / 1000)
          : 0;

        showNotification(
          'success',
          'Areas Generated Successfully',
          'Business zones ready',
          `Successfully generated ${areas.length} business areas for ${state.selectedCityName}. The system is ready for lead generation.`
        );
      } else {
        throw new Error('No areas data received');
      }
    } catch (error: any) {
      hideNotification();
      alert('Failed to initialize areas: ' + error.message);
    } finally {
      setLoading({ ...loading, areas: false });
    }
  };

  const resetWorkflow = () => {
    dispatch({ type: 'RESET_WORKFLOW' });
  };

  const backToCities = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
  };

  const cityOptions = [
    { value: '', label: state.cities.length === 0 ? 'No cities available' : 'Select a city...' },
    ...state.cities.map(city => ({
      value: city.id.toString(),
      label: `${city.name} (ID: ${city.id})`
    }))
  ];

  return (
    <div>
      <WorkflowSteps currentStep={state.currentStep} />

      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/60 animate-fade-in-up">
        <div className="p-6 lg:p-8 border-b border-gray-200/60 bg-gradient-to-r from-primary-50/50 to-transparent">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            {state.currentStep === 1 && 'Country Configuration'}
            {state.currentStep === 2 && 'Cities Management'}
            {state.currentStep === 3 && 'Areas Management'}
          </h3>
        </div>

        <div className="p-6 lg:p-8">
          {/* Step 1: Country Selection */}
          {state.currentStep === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#1d1d1f] tracking-[-0.02em]">
                    Target Country
                  </label>
                  <CountrySearch
                    countries={state.allCountries}
                    selectedCountry={state.selectedCountry}
                    onSelect={handleCountrySelect}
                  />
                  <div className="mt-1.5 text-xs text-[#86868b]">
                    Select the target country for lead generation campaigns
                  </div>
                </div>

                <Input
                  label="Business Categories"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Comma-separated keywords"
                  hint="Primary business types to target for lead generation"
                />
              </div>

              <div className="flex items-center gap-2.5 mb-6">
                <input
                  type="checkbox"
                  id="force-refresh"
                  checked={forceRefresh}
                  onChange={(e) => setForceRefresh(e.target.checked)}
                  className="w-4 h-4 accent-[#0071e3] cursor-pointer"
                />
                <label htmlFor="force-refresh" className="text-sm text-[#1d1d1f] cursor-pointer">
                  Force regeneration using AI (bypass existing data)
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={initializeCities}
                  disabled={!state.selectedCountry}
                  loading={loading.cities}
                  icon={<Zap className="w-4 h-4" />}
                >
                  Initialize Cities Data
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Cities Management */}
          {state.currentStep === 2 && (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-semibold text-[#1d1d1f]">Cities Overview</h4>
                  <span className="bg-[rgba(0,113,227,0.1)] text-[#0071e3] px-3 py-1 rounded-2xl text-xs font-semibold">
                    {state.cities.length} cities
                  </span>
                </div>

                <Select
                  label="Select Target City"
                  options={cityOptions}
                  value={state.selectedCityId?.toString() || ''}
                  onChange={(e) => {
                    const cityId = e.target.value ? parseInt(e.target.value) : null;
                    const cityName = cityId 
                      ? state.cities.find(c => c.id === cityId)?.name || ''
                      : '';
                    dispatch({ type: 'SET_SELECTED_CITY', payload: { id: cityId, name: cityName } });
                  }}
                  hint="Choose a city to populate business areas"
                />
              </div>

              <div className="flex gap-3 mb-8">
                <Button
                  variant="primary"
                  onClick={initializeAreas}
                  disabled={!state.selectedCityId}
                  loading={loading.areas}
                  icon={<Building2 className="w-4 h-4" />}
                >
                  Initialize Areas Data
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetWorkflow}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset Workflow
                </Button>
              </div>

              {/* Cities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.cities.slice(0, 9).map((city, index) => (
                  <div 
                    key={city.id} 
                    className="group bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 ease-apple hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-primary-200 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => {
                      dispatch({ type: 'SET_SELECTED_CITY', payload: { id: city.id, name: city.name } });
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors duration-200">
                        <Building2 className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        city.areas_populated 
                          ? 'bg-success-100 text-success-700' 
                          : 'bg-warning-100 text-warning-700'
                      }`}>
                        {city.areas_populated ? 'Ready' : 'Pending'}
                      </div>
                    </div>
                    
                    <div className="text-lg font-semibold text-gray-800 mb-2 tracking-tight group-hover:text-primary-700 transition-colors duration-200">
                      {city.name}
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      <div className="text-sm text-gray-500">
                        ID: {city.id} • Country: {city.country_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(city.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      city.areas_populated ? 'text-success-600' : 'text-warning-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        city.areas_populated ? 'bg-success-500 animate-pulse-subtle' : 'bg-warning-500'
                      }`} />
                      {city.areas_populated ? 'Areas Available' : 'Areas Pending'}
                    </div>
                  </div>
                ))}

                {state.cities.length > 9 && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 flex items-center justify-center text-center hover:bg-gray-100 transition-colors duration-200">
                    <div>
                      <div className="text-lg font-semibold text-gray-600 mb-2">
                        +{state.cities.length - 9} Additional Cities
                      </div>
                      <div className="text-sm text-gray-500">
                        Use the selector above to access all cities
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Areas Management */}
          {state.currentStep === 3 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-[#1d1d1f]">
                  Business Areas in <span className="text-[#0071e3]">{state.selectedCityName}</span>
                </h4>
                <span className="bg-[rgba(0,113,227,0.1)] text-[#0071e3] px-3 py-1 rounded-2xl text-xs font-semibold">
                  {state.areas.length} areas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {state.areas.map((area, index) => (
                  <div 
                    key={area.id} 
                    className="group bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 ease-apple hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-primary-200 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors duration-200">
                        <MapPin className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        area.last_scraped_at 
                          ? 'bg-success-100 text-success-700' 
                          : 'bg-warning-100 text-warning-700'
                      }`}>
                        {area.last_scraped_at ? 'Scraped' : 'Ready'}
                      </div>
                    </div>
                    
                    <div className="text-lg font-semibold text-gray-800 mb-2 tracking-tight group-hover:text-primary-700 transition-colors duration-200">
                      {area.name}
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      <div className="text-sm text-gray-500">
                        ID: {area.id} • City: {area.city_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(area.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      area.last_scraped_at ? 'text-success-600' : 'text-warning-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        area.last_scraped_at ? 'bg-success-500 animate-pulse-subtle' : 'bg-warning-500'
                      }`} />
                      {area.last_scraped_at 
                        ? `Scraped ${new Date(area.last_scraped_at).toLocaleDateString()}`
                        : 'Ready for Scraping'
                      }
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={backToCities}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Cities
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetWorkflow}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Start New Workflow
                </Button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="group bg-white border border-gray-200 rounded-2xl p-8 text-center transition-all duration-300 ease-apple hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-primary-200 animate-fade-in-up">
                  <div className="p-3 bg-primary-50 rounded-xl mb-4 mx-auto w-fit group-hover:bg-primary-100 transition-colors duration-200">
                    <Building2 className="w-8 h-8 text-primary-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div className="text-4xl font-bold text-gray-800 mb-2 tracking-tight group-hover:text-primary-700 transition-colors duration-200">
                    {state.cities.length}
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Cities Loaded
                  </div>
                </div>
                
                <div className="group bg-white border border-gray-200 rounded-2xl p-8 text-center transition-all duration-300 ease-apple hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-success-200 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <div className="p-3 bg-success-50 rounded-xl mb-4 mx-auto w-fit group-hover:bg-success-100 transition-colors duration-200">
                    <MapPin className="w-8 h-8 text-success-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div className="text-4xl font-bold text-gray-800 mb-2 tracking-tight group-hover:text-success-700 transition-colors duration-200">
                    {state.areas.length}
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Areas Generated
                  </div>
                </div>
                
                <div className="group bg-white border border-gray-200 rounded-2xl p-8 text-center transition-all duration-300 ease-apple hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-warning-200 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="p-3 bg-warning-50 rounded-xl mb-4 mx-auto w-fit group-hover:bg-warning-100 transition-colors duration-200">
                    <Zap className="w-8 h-8 text-warning-600 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div className="text-4xl font-bold text-gray-800 mb-2 tracking-tight group-hover:text-warning-700 transition-colors duration-200">
                    {state.workflowStartTime 
                      ? Math.round((Date.now() - state.workflowStartTime) / 1000) + 's'
                      : '-'
                    }
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Completion Time
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};