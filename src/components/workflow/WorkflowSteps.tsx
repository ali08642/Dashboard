import React from 'react';
import { Check } from 'lucide-react';

interface WorkflowStepsProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Select Country' },
  { id: 2, label: 'Load Cities' },
  { id: 3, label: 'Populate Areas' }
];

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ currentStep }) => {
  return (
    <div className="bg-[rgba(255,255,255,0.72)] backdrop-blur-md rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_15px_rgba(0,0,0,0.08)] mb-8 overflow-hidden">
      <div className="p-7 border-b border-[rgba(0,0,0,0.08)]">
        <h2 className="text-xl font-semibold text-[#1d1d1f] mb-1.5 tracking-[-0.025em]">
          Data Population Workflow
        </h2>
        <p className="text-[#86868b] text-sm">
          Set up location data for your lead generation campaigns
        </p>
      </div>
      
      <div className="py-10 px-8 flex justify-center items-center gap-12">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative">
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold mb-4 
              relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${step.id < currentStep 
                ? 'bg-[#34c759] border-2 border-[#34c759] text-white'
                : step.id === currentStep
                ? 'bg-[#0071e3] border-2 border-[#0071e3] text-white shadow-[0_0_0_6px_rgba(0,113,227,0.15)] scale-110'
                : 'bg-[rgba(0,0,0,0.05)] border-2 border-[rgba(0,0,0,0.08)] text-[#86868b]'
              }
            `}>
              {step.id < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            
            <div className="text-sm font-medium text-[#1d1d1f] text-center">
              {step.label}
            </div>

            {index < steps.length - 1 && (
              <div className={`
                absolute top-7 left-16 w-12 h-0.5 transition-all duration-300 ease-in-out
                ${step.id < currentStep ? 'bg-[#0071e3]' : 'bg-[rgba(0,0,0,0.08)]'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};