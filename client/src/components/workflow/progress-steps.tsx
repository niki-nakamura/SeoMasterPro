import { Check } from "lucide-react";
import type { WorkflowStep } from "@/types/article";

interface ProgressStepsProps {
  steps: WorkflowStep[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
        <span className="text-sm text-slate-500">Step {currentStep} of {steps.length}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.completed 
                  ? "bg-emerald-500" 
                  : step.current 
                    ? "bg-brand-500" 
                    : "bg-slate-200"
              }`}>
                {step.completed ? (
                  <Check className="text-white w-4 h-4" />
                ) : (
                  <span className={`text-sm font-medium ${
                    step.current ? "text-white" : "text-slate-500"
                  }`}>
                    {step.id}
                  </span>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  step.completed || step.current ? "text-slate-900" : "text-slate-500"
                }`}>
                  {step.title}
                </p>
                <p className={`text-xs ${
                  step.completed || step.current ? "text-slate-500" : "text-slate-400"
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`flex-1 h-px ml-4 ${
                step.completed ? "bg-emerald-200" : "bg-slate-200"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
