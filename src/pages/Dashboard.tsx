import React, { useState, useEffect } from 'react';
import { Zap, Building2, RotateCcw, ArrowLeft, MapPin, Sparkles, ChevronDown, ChevronUp, Copy, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { useApp } from '../context/AppContext';
import { WorkflowSteps } from '../components/workflow/WorkflowSteps';
import { CountrySearch } from '../components/workflow/CountrySearch';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { ContextAreasModal } from '../components/modals/ContextAreasModal';
import { WebhookTester } from '../components/debug/WebhookTester';
import { countryApi, webhookApi } from '../utils/api';
import { getConfig } from '../utils/config';
import type { Country } from '../utils/types';

export const Dashboard: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState({ cities: false, areas: false, contextAreas: false });
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<Array<{
    timestamp: string;
    type: 'request' | 'response' | 'error';
    action: string;
    data: any;
  }>>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showWebhookTester, setShowWebhookTester] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const addDebugLog = (type: 'request' | 'response' | 'error', action: string, data: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      action,
      data: JSON.parse(JSON.stringify(data)) // Deep clone to avoid references
    };
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 50)); // Keep only last 50 logs
    console.log(`[${type.toUpperCase()}] ${action}:`, data);
  };

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

    const requestData = {
      country_id: state.selectedCountry.id,
      action: 'populate_cities',
      force_refresh: false,
      target_keywords: []
    };
    addDebugLog('request', 'Initialize Cities', requestData);

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

      addDebugLog('response', 'Initialize Cities', { cities_count: cities.length, cities });
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
      addDebugLog('error', 'Initialize Cities', { error: error.message, stack: error.stack });
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

    const requestData = { city_id: state.selectedCityId, action: 'populate_areas' };
    addDebugLog('request', 'Initialize Areas (Standard)', requestData);

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
      addDebugLog('response', 'Initialize Areas (Standard)', { areas_count: areas.length, areas });
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
      addDebugLog('error', 'Initialize Areas (Standard)', { error: error.message, stack: error.stack });
      hideNotification();
      alert('Failed to initialize areas: ' + error.message);
    } finally {
      setLoading({ ...loading, areas: false });
    }
  };

  const handleContextAreasSubmit = async (keywords: string[]) => {
    if (!state.selectedCountry || !state.selectedCityName || !state.selectedCityId) {
      alert('Please select a country and city first');
      return;
    }

    setLoading({ ...loading, contextAreas: true });

    const contextData = {
      country_name: state.selectedCountry.name,
      country_ID: state.selectedCountry.id.toString(),
      city_name: state.selectedCityName,
      keywords: keywords
    };

    // Add webhook URL to debug log for troubleshooting
    const config = getConfig();
    addDebugLog('request', 'Create Context Areas', {
      webhook_url: config.contextAreasWebhook,
      request_data: contextData,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      current_origin: window.location.origin
    });

    showNotification(
      'processing',
      'AI Context Generation',
      'Creating keyword-based areas',
      `Analyzing ${state.selectedCityName} with your keywords to generate targeted business areas using advanced AI.`
    );

    try {
      // First, let's test if the URL is reachable with a simple ping
      console.log(`🔄 Testing webhook URL: ${config.contextAreasWebhook}`);
      
      const areas = await webhookApi.createContextAreas(contextData);
      addDebugLog('response', 'Create Context Areas', { 
        areas_count: areas.length, 
        areas,
        response_received_at: new Date().toISOString()
      });
      
      setIsContextModalOpen(false);
      hideNotification();

      if (Array.isArray(areas) && areas.length > 0) {
        dispatch({ type: 'SET_AREAS', payload: areas });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });

        showNotification(
          'success',
          'Context Areas Created Successfully',
          'Keyword-based zones ready',
          `Successfully generated ${areas.length} business areas for ${state.selectedCityName} based on your keywords: ${keywords.join(', ')}.`
        );
      } else if (Array.isArray(areas) && areas.length === 0) {
        // Handle case where webhook returns empty array
        throw new Error('Webhook returned empty areas list. Check if your n8n workflow is generating areas correctly.');
      } else {
        // Handle case where areas is not an array
        console.error('❌ Areas is not an array:', areas);
        throw new Error(`Expected array of areas, but received: ${typeof areas}. Check webhook response format.`);
      }
    } catch (error: any) {
      const detailedError = {
        error_message: error.message,
        error_name: error.name,
        stack: error.stack,
        context_data: contextData,
        webhook_url: config.contextAreasWebhook,
        timestamp: new Date().toISOString(),
        network_error: error.message.includes('fetch') || error.message.includes('Failed to fetch'),
        possible_causes: error.message.includes('fetch') ? [
          'n8n instance not running',
          'Wrong webhook URL',
          'Network connectivity issues',
          'CORS issues',
          'Firewall blocking request'
        ] : ['Server error', 'Invalid response format']
      };
      
      addDebugLog('error', 'Create Context Areas', detailedError);
      hideNotification();
      
      // More helpful error message
      let errorMsg = `❌ Context Areas Creation Failed\n\n`;
      errorMsg += `Error: ${error.message}\n\n`;
      errorMsg += `Webhook URL: ${config.contextAreasWebhook}\n\n`;
      
      if (error.message.includes('fetch')) {
        errorMsg += `🔍 This looks like a network/connection issue:\n`;
        errorMsg += `• Check if n8n is running on the expected port\n`;
        errorMsg += `• Verify the webhook URL is correct\n`;
        errorMsg += `• Check firewall/network settings\n\n`;
      }
      
      errorMsg += `📊 Check the Debug Logs below for complete details.`;
      
      alert(errorMsg);
    } finally {
      setLoading({ ...loading, contextAreas: false });
    }
  };

  const resetWorkflow = () => {
    dispatch({ type: 'RESET_WORKFLOW' });
  };

  const copyLogsToClipboard = async () => {
    const logsText = debugLogs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()} - ${log.action}\n${JSON.stringify(log.data, null, 2)}\n---`
    ).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(logsText);
      showNotification('success', 'Debug Logs Copied', 'Logs copied to clipboard', 'Debug logs have been copied to your clipboard for sharing.');
      setTimeout(hideNotification, 3000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
      alert('Failed to copy logs to clipboard');
    }
  };

  const downloadBusinessFlowGuide = () => {
    const content = `# 🚀 Lead Generation Dashboard - Complete Business Flow Guide

## 📊 Main Dashboard: Finding Business Leads

Think of this like **hunting for business opportunities** in a systematic way:

### **Step 1: Pick Your Market**
- **What it does:** Choose which country you want to find businesses in
- **Why:** Different countries have different business opportunities
- **Example:** You might choose "Pakistan" because you want to find local businesses there
- **Result:** The system loads all major cities in that country

### **Step 2: Choose Your City & Find Business Areas**
- **What it does:** Pick a specific city, then the system finds all the business districts
- **Why:** Every city has different neighborhoods where businesses cluster
- **Example:** You pick "Lahore" and the system finds areas like "Mall Road Commercial District", "DHA Business Area", "Gulberg Market Zone"
- **How it works:** AI analyzes the city and identifies where businesses are most concentrated

### **Step 3: Get Smart Recommendations**
- **What it does:** Shows you all the business areas found, plus gives you an option to get more targeted suggestions
- **The magic button:** "Create Context-Based Areas" - you tell it what type of businesses you want (like "restaurants", "tech companies", "car dealers")
- **Result:** Gets even more specific business areas based on your interests

---

## 📍 Other Pages: Managing Your Data

### **Countries Page**
- **Purpose:** Like a phone book of countries
- **What you do:** Add new countries or edit existing ones
- **Who uses it:** Administrators setting up new markets

### **Cities Page**
- **Purpose:** Directory of all cities in each country
- **What you do:** Add new cities or manage existing ones
- **Example:** Adding "Islamabad" to Pakistan's city list

### **Areas Page**
- **Purpose:** Master list of all business districts you've discovered
- **What you see:** Every business area from every city, all in one place
- **Use:** Review and manage all your potential business hunting grounds

---

## ⚙️ Scraping Jobs: The Business Hunting Process

### **How Business Discovery Works**

#### **Think of it like assigning research tasks:**

**Job Creation:**
- You pick a business area (like "Downtown Karachi")
- System creates a "research assignment" to find all businesses there
- This becomes a "scraping job"

**Smart Job Distribution:**
- **The Problem:** You have multiple team members but limited capacity
- **The Solution:** System automatically assigns work based on who's available

#### **Real-World Example:**
You have 3 team members:
- Ahmed: Can handle 3 jobs at once
- Sara: Can handle 5 jobs at once  
- Hassan: Can handle 2 jobs at once

When you create 10 research jobs:
- Ahmed gets 3 jobs and starts working
- Sara gets 5 jobs and starts working
- Hassan gets 2 jobs and starts working
- When Ahmed finishes 1 job, he automatically gets assigned the next pending job

**Job Status Tracking:**
- **Pending:** Waiting in line to be worked on
- **Running:** Someone is actively researching that area
- **Completed:** All businesses found and cataloged
- **Failed:** Something went wrong, needs to be retried

---

## 📈 Business Analytics: Understanding Your Success

### **What the Analytics Show You**

#### **Business Discovery Insights:**
- **How many businesses** you've found in each area
- **What types of businesses** are most common
- **Which areas** are most profitable to research
- **Success rate** of your business hunting

#### **Team Performance:**
- **Who's your most productive** team member
- **How long** it takes to research each area
- **Where bottlenecks** occur in your process
- **Fair workload distribution** among team members

#### **Business Results:**
- **Contact success rates:** How many businesses actually respond
- **Conversion tracking:** Which leads become customers
- **ROI analysis:** Which areas give you the best return
- **Follow-up effectiveness:** How good your team is at nurturing leads

### **Real-World Business Value:**
Example Monthly Report:
- Discovered: 2,500 businesses across 15 areas
- Contacted: 1,200 businesses
- Responded: 300 businesses (25% response rate)
- Converted: 45 new customers (15% conversion rate)
- Revenue Generated: $50,000
- Best Performing Area: "Tech Hub Lahore" (40% response rate)
- Most Productive Team Member: Sara (500 businesses researched)

---

## 🔄 Complete Business Process

### **The Big Picture:**
1. **Market Research:** Find the best places to look for customers
2. **Business Discovery:** Systematically find all potential customers in those areas
3. **Lead Management:** Organize and track all your potential customers
4. **Performance Tracking:** Measure what's working and what's not
5. **Optimization:** Use insights to get better results next time

### **Real Business Scenario:**
Imagine you're a B2B sales company:

Week 1: Use dashboard to identify "Gulberg Business District" has lots of tech companies
Week 2: Assign team to research all businesses in that area
Week 3: Team finds 200 tech companies with contact details
Week 4: Sales team starts contacting these companies
Week 5: Analytics show 30% response rate - very successful!
Week 6: Use same process to find more similar high-value areas

**The Result:** You've built a systematic, data-driven approach to finding and converting business leads, with full visibility into what's working and what needs improvement.

---

*This document provides a comprehensive overview of the Lead Generation Dashboard system, designed to help businesses systematically discover, track, and convert business leads through intelligent automation and data-driven insights.*`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Lead_Generation_Dashboard_Business_Flow_Guide.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Guide Downloaded', 'Business flow guide saved', 'The complete business flow guide has been downloaded to your device.');
    setTimeout(hideNotification, 3000);
  };

  const downloadBusinessFlowPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize = 12, isBold = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      const splitText = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      // Check if we need a new page
      if (yPosition + (splitText.length * lineHeight) > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(splitText, margin, yPosition);
      yPosition += splitText.length * lineHeight + 5;
    };

    // Title
    addText('🚀 Lead Generation Dashboard - Business Flow Guide', 16, true);
    yPosition += 10;

    // Main Dashboard Section
    addText('📊 Main Dashboard: Finding Business Leads', 14, true);
    addText('Think of this like hunting for business opportunities in a systematic way:', 12);
    
    addText('Step 1: Pick Your Market', 12, true);
    addText('• What it does: Choose which country you want to find businesses in');
    addText('• Why: Different countries have different business opportunities');
    addText('• Example: You might choose "Pakistan" because you want to find local businesses there');
    addText('• Result: The system loads all major cities in that country');
    
    addText('Step 2: Choose Your City & Find Business Areas', 12, true);
    addText('• What it does: Pick a specific city, then the system finds all the business districts');
    addText('• Why: Every city has different neighborhoods where businesses cluster');
    addText('• Example: You pick "Lahore" and the system finds areas like "Mall Road Commercial District"');
    addText('• How it works: AI analyzes the city and identifies where businesses are most concentrated');
    
    addText('Step 3: Get Smart Recommendations', 12, true);
    addText('• What it does: Shows you all the business areas found, plus gives you an option to get more targeted suggestions');
    addText('• The magic button: "Create Context-Based Areas" - you tell it what type of businesses you want');
    addText('• Result: Gets even more specific business areas based on your interests');

    // Other Pages Section
    addText('📍 Other Pages: Managing Your Data', 14, true);
    
    addText('Countries Page', 12, true);
    addText('• Purpose: Like a phone book of countries');
    addText('• What you do: Add new countries or edit existing ones');
    addText('• Who uses it: Administrators setting up new markets');
    
    addText('Cities Page', 12, true);
    addText('• Purpose: Directory of all cities in each country');
    addText('• What you do: Add new cities or manage existing ones');
    addText('• Example: Adding "Islamabad" to Pakistan\'s city list');
    
    addText('Areas Page', 12, true);
    addText('• Purpose: Master list of all business districts you\'ve discovered');
    addText('• What you see: Every business area from every city, all in one place');
    addText('• Use: Review and manage all your potential business hunting grounds');

    // Business Process Section
    addText('🔄 Complete Business Process', 14, true);
    addText('The Big Picture:', 12, true);
    addText('1. Market Research: Find the best places to look for customers');
    addText('2. Business Discovery: Systematically find all potential customers in those areas');
    addText('3. Lead Management: Organize and track all your potential customers');
    addText('4. Performance Tracking: Measure what\'s working and what\'s not');
    addText('5. Optimization: Use insights to get better results next time');

    pdf.save('Lead_Generation_Dashboard_Business_Flow.pdf');
    
    showNotification('success', 'PDF Downloaded', 'Business flow PDF saved', 'The business flow guide has been downloaded as a PDF.');
    setTimeout(hideNotification, 3000);
  };

  const downloadTechnicalFlowPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize = 12, isBold = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      const splitText = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      // Check if we need a new page
      if (yPosition + (splitText.length * lineHeight) > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(splitText, margin, yPosition);
      yPosition += splitText.length * lineHeight + 5;
    };

    // Title
    addText('🔧 Lead Generation Dashboard - Technical Flow Documentation', 16, true);
    yPosition += 10;

    // System Architecture
    addText('🏗️ System Architecture Overview', 14, true);
    
    addText('Frontend Architecture', 12, true);
    addText('• Framework: React 18 with TypeScript');
    addText('• State Management: React Context API with useReducer');
    addText('• Routing: React Router v6 for declarative navigation');
    addText('• Styling: Tailwind CSS for utility-first styling');
    addText('• Build Tool: Vite for fast development and optimized builds');
    
    addText('Backend Services', 12, true);
    addText('• Database: PostgreSQL via Supabase');
    addText('• Authentication: Supabase Auth with Row Level Security (RLS)');
    addText('• Automation: n8n workflows for data processing');
    addText('• API Integration: RESTful APIs with webhook endpoints');

    // Data Flow Architecture
    addText('🔄 Data Flow Architecture', 14, true);
    
    addText('Authentication Flow', 12, true);
    addText('1. User Registration: Frontend collects details → Supabase Auth creates account → Database stores admin record');
    addText('2. User Login: Frontend validates → Supabase Auth checks → Context stores state → Navigate to dashboard');
    addText('3. Session Management: Persistent auth state, automatic refresh, protected routes');
    
    addText('Main Workflow Data Flow', 12, true);
    addText('Step 1: Country Selection → API fetches countries → Context stores selection');
    addText('Step 2: City Selection → API fetches cities → User selects → n8n webhook discovers areas');
    addText('Step 3: Area Management → Display areas → Optional context-based discovery with keywords');

    // Database Schema
    addText('🗄️ Database Schema & Relationships', 14, true);
    addText('Core Tables: countries, cities, areas, admins');
    addText('• Countries: id, name, code, created_at');
    addText('• Cities: id, name, country_id (FK), created_at');
    addText('• Areas: id, name, city_id (FK), description, created_at');
    addText('• Admins: id (UUID), name, email, created_at');

    // API Integration
    addText('🔌 API Integration Architecture', 14, true);
    addText('Supabase API: Authentication, data operations');
    addText('Webhook API: n8n integration for area discovery');
    addText('• Initialize Areas: Discovers business districts in selected city');
    addText('• Context Areas: Targeted discovery based on user keywords');

    // Security
    addText('🔐 Security Implementation', 14, true);
    addText('• Supabase Auth integration with email/password');
    addText('• Row Level Security (RLS) policies for data isolation');
    addText('• Environment variable protection for sensitive data');
    addText('• API request validation and error handling');

    pdf.save('Lead_Generation_Dashboard_Technical_Flow.pdf');
    
    showNotification('success', 'Technical PDF Downloaded', 'Technical flow PDF saved', 'The technical flow documentation has been downloaded as a PDF.');
    setTimeout(hideNotification, 3000);
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

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    onClick={initializeAreas}
                    disabled={!state.selectedCityId}
                    loading={loading.areas}
                    icon={<Building2 className="w-4 h-4" />}
                    className="w-full"
                  >
                    Initialize Areas Data
                  </Button>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="secondary" onClick={resetWorkflow} icon={<RotateCcw className="w-4 h-4" />}>
                      Reset Workflow
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      icon={showDebugPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    >
                      Debug Logs ({debugLogs.length})
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowWebhookTester(!showWebhookTester)}
                      icon={<Zap className="w-4 h-4" />}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Webhook Tester
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={downloadBusinessFlowGuide}
                      icon={<Download className="w-4 h-4" />}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Download Guide (MD)
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={downloadBusinessFlowPDF}
                      icon={<FileText className="w-4 h-4" />}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Business Flow (PDF)
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={downloadTechnicalFlowPDF}
                      icon={<FileText className="w-4 h-4" />}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Technical Flow (PDF)
                    </Button>
                  </div>
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
                <div className="flex gap-3 flex-wrap">
                  <Button variant="secondary" onClick={backToCities} icon={<ArrowLeft className="w-4 h-4" />}>
                    Back to Cities
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => setIsContextModalOpen(true)}
                    disabled={loading.contextAreas}
                    loading={loading.contextAreas}
                    icon={<Sparkles className="w-4 h-4" />}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    Create Context-Based Areas
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

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Building2 className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-[-0.02em]">
                    Debug Logs
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Request/response logs for troubleshooting webhook issues
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={copyLogsToClipboard}
                  disabled={debugLogs.length === 0}
                  icon={<Copy className="w-4 h-4" />}
                  className="px-4 py-2 text-sm"
                >
                  Copy All Logs
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setDebugLogs([])}
                  disabled={debugLogs.length === 0}
                  className="px-4 py-2 text-sm"
                >
                  Clear Logs
                </Button>
              </div>
            </div>
          </div>
          <div className="p-5">
            {debugLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No debug logs yet. Perform some actions to see logs here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.type === 'request' ? 'bg-blue-100 text-blue-800' :
                          log.type === 'response' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.type.toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-900">{log.action}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto text-gray-800">
{JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhook Tester */}
      {showWebhookTester && (
        <WebhookTester />
      )}

      {/* Context Areas Modal */}
      <ContextAreasModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        onSubmit={handleContextAreasSubmit}
        loading={loading.contextAreas}
        countryName={state.selectedCountry?.name}
        cityName={state.selectedCityName}
      />
    </div>
  );
};