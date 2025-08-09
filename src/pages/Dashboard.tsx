import React, { useState, useEffect } from 'react';
import { Zap, Building2, RotateCcw, ArrowLeft, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkflowSteps } from '../components/workflow/WorkflowSteps';
import { CountrySearch } from '../components/workflow/CountrySearch';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { countryApi, webhookApi } from '../utils/api';
import type { Country } from '../utils/types';

export const Dashboard: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState({ cities: false, areas: false });

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

    showNotification(
      'processing',
      'Data Retrieval',
      'Loading city data',
      `Loading city data for ${state.selectedCountry.name}...`
    );

    try {
      const cities = await webhookApi.initializeCities(
        state.selectedCountry.id,
        false,
        []
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
    <div className="space-y-6">
      {/* Steps indicator */}
      <WorkflowSteps currentStep={state.currentStep} />

      {/* Page shell */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gray-100">
              <Building2 className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-[-0.02em]">
                {state.currentStep === 1 && 'Country Configuration'}
                {state.currentStep === 2 && 'Cities Management'}
                {state.currentStep === 3 && 'Areas Management'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {state.currentStep === 1 && 'Configure your target country to begin the lead generation process.'}
                {state.currentStep === 2 && 'Select and manage cities for business area generation.'}
                {state.currentStep === 3 && 'Review generated business areas and prepare for campaigns.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section body */}
        <div className="p-5">
          {/* Step 1 */}
          {state.currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-800">Target Country</label>
                <CountrySearch
                  countries={state.allCountries}
                  selectedCountry={state.selectedCountry}
                  onSelect={handleCountrySelect}
                />
                <div className="mt-1.5 text-xs text-gray-500">
                  Select the target country for lead generation campaigns
                </div>
              </div>

              <div className="pt-2">
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

          {/* Step 2 */}
          {state.currentStep === 2 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Cities Overview</h3>
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
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
                  className="mb-3"
                />

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={initializeAreas}
                    disabled={!state.selectedCityId}
                    loading={loading.areas}
                    icon={<Building2 className="w-4 h-4" />}
                  >
                    Initialize Areas Data
                  </Button>
                  <Button variant="secondary" onClick={resetWorkflow} icon={<RotateCcw className="w-4 h-4" />}>
                    Reset Workflow
                  </Button>
                </div>
              </div>

              {/* Cities */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.cities.slice(0, 9).map((city, index) => (
                  <div
                    key={city.id}
                    className="group rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-all"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => {
                      dispatch({ type: 'SET_SELECTED_CITY', payload: { id: city.id, name: city.name } });
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-gray-700" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        city.areas_populated ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {city.areas_populated ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-gray-900 mb-1">
                      {city.name}
                    </div>
                    <div className="text-xs text-gray-500">ID: {city.id} • Country: {city.country_id}</div>
                  </div>
                ))}

                {state.cities.length > 9 && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 flex items-center justify-center text-center">
                    <div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">
                        +{state.cities.length - 9} Additional Cities
                      </div>
                      <div className="text-xs text-gray-500">Use the selector above to access all cities</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {state.currentStep === 3 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Business Areas in <span className="text-gray-700">{state.selectedCityName}</span>
                  </h3>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {state.areas.length} areas
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={backToCities} icon={<ArrowLeft className="w-4 h-4" />}>
                    Back to Cities
                  </Button>
                  <Button variant="secondary" onClick={resetWorkflow} icon={<RotateCcw className="w-4 h-4" />}>
                    Start New Workflow
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.areas.map((area, index) => (
                  <div key={area.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg"><MapPin className="w-4 h-4 text-gray-700" /></div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        area.last_scraped_at ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {area.last_scraped_at ? 'Scraped' : 'Ready'}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-gray-900 mb-1">{area.name}</div>
                    <div className="text-xs text-gray-500 mb-2">ID: {area.id} • City: {area.city_id}</div>
                    <div className="text-xs text-gray-500">
                      {area.last_scraped_at ? `Scraped ${new Date(area.last_scraped_at).toLocaleDateString()}` : 'Ready for Scraping'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <div className="mx-auto w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                    <Building2 className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{state.cities.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Cities Loaded</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <div className="mx-auto w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                    <MapPin className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{state.areas.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Areas Generated</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <div className="mx-auto w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{state.workflowStartTime ? Math.round((Date.now() - state.workflowStartTime) / 1000) + 's' : '-'}</div>
                  <div className="text-xs text-gray-500 mt-1">Completion Time</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};