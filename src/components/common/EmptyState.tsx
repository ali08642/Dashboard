import React from 'react';
import { 
  Database, 
  Search, 
  FileX, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Filter,
  Globe,
  Building2,
  MapPin
} from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
  variant?: 'default' | 'error' | 'search' | 'filter';
}

const defaultIcons = {
  default: <Database className="w-12 h-12" />,
  error: <AlertCircle className="w-12 h-12" />,
  search: <Search className="w-12 h-12" />,
  filter: <Filter className="w-12 h-12" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  variant = 'default'
}) => {
  const displayIcon = icon || defaultIcons[variant];
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          iconColor: 'text-error-400',
          bgColor: 'bg-error-50',
          titleColor: 'text-error-700',
          descriptionColor: 'text-error-600'
        };
      case 'search':
        return {
          iconColor: 'text-primary-400',
          bgColor: 'bg-primary-50',
          titleColor: 'text-primary-700',
          descriptionColor: 'text-primary-600'
        };
      case 'filter':
        return {
          iconColor: 'text-warning-400',
          bgColor: 'bg-warning-50',
          titleColor: 'text-warning-700',
          descriptionColor: 'text-warning-600'
        };
      default:
        return {
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50',
          titleColor: 'text-gray-700',
          descriptionColor: 'text-gray-500'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className={`${styles.bgColor} p-4 rounded-2xl mb-6 animate-scale-in`}>
        <div className={styles.iconColor}>
          {displayIcon}
        </div>
      </div>
      
      <h3 className={`text-xl font-semibold mb-2 ${styles.titleColor}`}>
        {title}
      </h3>
      
      <p className={`text-base mb-8 max-w-md leading-relaxed ${styles.descriptionColor}`}>
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            icon={action.icon}
            className="animate-fade-in-up"
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            variant="secondary"
            onClick={secondaryAction.onClick}
            icon={secondaryAction.icon}
            className="animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

// Specialized empty state components for common scenarios
export const EmptyCountries: React.FC<{
  onAddCountry?: () => void;
  onRefresh?: () => void;
}> = ({ onAddCountry, onRefresh }) => (
  <EmptyState
    icon={<Globe className="w-12 h-12" />}
    title="No Countries Found"
    description="Get started by adding your first country to begin organizing your location data."
    action={onAddCountry ? {
      label: "Add Country",
      onClick: onAddCountry,
      variant: "primary",
      icon: <Plus className="w-4 h-4" />
    } : undefined}
    secondaryAction={onRefresh ? {
      label: "Refresh",
      onClick: onRefresh,
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
  />
);

export const EmptyCities: React.FC<{
  onAddCity?: () => void;
  onRefresh?: () => void;
}> = ({ onAddCity, onRefresh }) => (
  <EmptyState
    icon={<Building2 className="w-12 h-12" />}
    title="No Cities Found"
    description="Add cities to organize your business locations and improve your data management."
    action={onAddCity ? {
      label: "Add City",
      onClick: onAddCity,
      variant: "primary",
      icon: <Plus className="w-4 h-4" />
    } : undefined}
    secondaryAction={onRefresh ? {
      label: "Refresh",
      onClick: onRefresh,
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
  />
);

export const EmptyAreas: React.FC<{
  onAddArea?: () => void;
  onRefresh?: () => void;
}> = ({ onAddArea, onRefresh }) => (
  <EmptyState
    icon={<MapPin className="w-12 h-12" />}
    title="No Areas Found"
    description="Define specific areas within your cities to create more targeted business searches."
    action={onAddArea ? {
      label: "Add Area",
      onClick: onAddArea,
      variant: "primary",
      icon: <Plus className="w-4 h-4" />
    } : undefined}
    secondaryAction={onRefresh ? {
      label: "Refresh",
      onClick: onRefresh,
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
  />
);

export const EmptySearchResults: React.FC<{
  onClearFilters?: () => void;
  onTryAgain?: () => void;
}> = ({ onClearFilters, onTryAgain }) => (
  <EmptyState
    variant="search"
    title="No Results Found"
    description="We couldn't find any results matching your search criteria. Try adjusting your filters or search terms."
    action={onClearFilters ? {
      label: "Clear Filters",
      onClick: onClearFilters,
      variant: "primary",
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
    secondaryAction={onTryAgain ? {
      label: "Try Again",
      onClick: onTryAgain,
      icon: <Search className="w-4 h-4" />
    } : undefined}
  />
);

export const EmptyError: React.FC<{
  onRetry?: () => void;
  onGoBack?: () => void;
}> = ({ onRetry, onGoBack }) => (
  <EmptyState
    variant="error"
    title="Something Went Wrong"
    description="We encountered an error while loading your data. Please try again or contact support if the problem persists."
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry,
      variant: "primary",
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
    secondaryAction={onGoBack ? {
      label: "Go Back",
      onClick: onGoBack,
      icon: <FileX className="w-4 h-4" />
    } : undefined}
  />
);