import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppState, NotificationData, Country, City, Area } from '../utils/types';

interface AppContextType {
  state: AppState;
  notification: NotificationData;
  dispatch: React.Dispatch<AppAction>;
  showNotification: (type: 'processing' | 'success', title: string, subtitle: string, message: string) => void;
  hideNotification: () => void;
}

type AppAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SELECTED_COUNTRY'; payload: Country | null }
  | { type: 'SET_CITIES'; payload: City[] }
  | { type: 'SET_SELECTED_CITY'; payload: { id: number | null; name: string } }
  | { type: 'SET_AREAS'; payload: Area[] }
  | { type: 'SET_WORKFLOW_START_TIME'; payload: number | null }
  | { type: 'SET_ALL_COUNTRIES'; payload: Country[] }
  | { type: 'SET_ALL_CITIES'; payload: City[] }
  | { type: 'SET_ALL_AREAS'; payload: Area[] }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'SHOW_NOTIFICATION'; payload: { type: 'processing' | 'success'; title: string; subtitle: string; message: string } }
  | { type: 'HIDE_NOTIFICATION' };

const initialState: AppState = {
  currentStep: 1,
  selectedCountry: null,
  cities: [],
  selectedCityId: null,
  selectedCityName: '',
  areas: [],
  workflowStartTime: null,
  allCountries: [],
  allCities: [],
  allAreas: []
};

const initialNotification: NotificationData = {
  type: 'processing',
  title: '',
  subtitle: '',
  message: '',
  visible: false
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SELECTED_COUNTRY':
      return { ...state, selectedCountry: action.payload };
    case 'SET_CITIES':
      return { ...state, cities: action.payload };
    case 'SET_SELECTED_CITY':
      return { 
        ...state, 
        selectedCityId: action.payload.id, 
        selectedCityName: action.payload.name 
      };
    case 'SET_AREAS':
      return { ...state, areas: action.payload };
    case 'SET_WORKFLOW_START_TIME':
      return { ...state, workflowStartTime: action.payload };
    case 'SET_ALL_COUNTRIES':
      return { ...state, allCountries: action.payload };
    case 'SET_ALL_CITIES':
      return { ...state, allCities: action.payload };
    case 'SET_ALL_AREAS':
      return { ...state, allAreas: action.payload };
    case 'RESET_WORKFLOW':
      return {
        ...state,
        currentStep: 1,
        selectedCountry: null,
        cities: [],
        selectedCityId: null,
        selectedCityName: '',
        areas: [],
        workflowStartTime: null
      };
    default:
      return state;
  }
};

const notificationReducer = (state: NotificationData, action: AppAction): NotificationData => {
  switch (action.type) {
    case 'SHOW_NOTIFICATION':
      return {
        ...action.payload,
        visible: true
      };
    case 'HIDE_NOTIFICATION':
      return {
        ...state,
        visible: false
      };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [notification, notificationDispatch] = useReducer(notificationReducer, initialNotification);

  const showNotification = (type: 'processing' | 'success', title: string, subtitle: string, message: string) => {
    notificationDispatch({ type: 'SHOW_NOTIFICATION', payload: { type, title, subtitle, message } });
  };

  const hideNotification = () => {
    notificationDispatch({ type: 'HIDE_NOTIFICATION' });
  };

  const enhancedDispatch = (action: AppAction) => {
    dispatch(action);
    notificationDispatch(action);
  };

  return (
    <AppContext.Provider value={{
      state,
      notification,
      dispatch: enhancedDispatch,
      showNotification,
      hideNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};