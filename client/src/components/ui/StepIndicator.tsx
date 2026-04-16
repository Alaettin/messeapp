import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

interface Step {
  label: string;
  icon?: ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto px-2">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(stepNum)}
                disabled={!onStepClick || isFuture}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-medium transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-accent text-white'
                      : isCurrent
                        ? 'bg-accent text-white shadow-glow scale-110'
                        : 'bg-bg-surface border border-border text-txt-muted'
                  }
                  ${onStepClick && !isFuture ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.icon || stepNum
                )}
              </button>
              <span
                className={`
                  mt-1.5 text-xs whitespace-nowrap
                  ${isCurrent ? 'text-accent font-medium' : 'text-txt-muted'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-px mx-2 mt-[-1.25rem]
                  transition-colors duration-300
                  ${isCompleted ? 'bg-accent' : 'bg-border'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
