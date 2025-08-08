import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="bg-[rgba(255,255,255,0.72)] backdrop-blur-md rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_15px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-7 border-b border-[rgba(0,0,0,0.08)]">
        <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-[-0.025em]">
          {title}
        </h3>
      </div>
      <div className="p-8">
        <p className="text-[#86868b] text-center py-15 text-lg">
          {description}
        </p>
      </div>
    </div>
  );
};