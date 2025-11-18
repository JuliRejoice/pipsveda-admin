"use client";
import React from "react";

interface StepperProps {
  steps: string[];
  activeStep: number; // 1-based index
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStep }) => {
  return (
    <div className="flex flex-col items-start w-1/3 border-r-2 mr-4">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < activeStep;
        const isActive = stepNumber === activeStep;

        return (
          <div
            key={index}
            className="flex items-center mb-8 last:mb-0 relative w-full"
          >
            {/* Step Circle */}
            <div
              className={`
                flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all flex-shrink-0 z-10
                ${isCompleted ? "bg-[#6b4fd8] border-[#6b4fd8] text-white" : ""}
                ${isActive ? "border-[#6b4fd8] text-[#6b4fd8]" : ""}
                ${
                  !isCompleted && !isActive
                    ? "border-gray-400 text-gray-500"
                    : ""
                }
              `}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>

            {/* Content Container */}
            <div className="ml-4 flex-1">
              {/* Label */}
              <span
                className={`text-sm sm:text-base font-medium
                 ${isCompleted ? " text-[#6b4fd8] " : " "}
                    
                ${isActive ? "text-[#6b4fd8]" : "text-gray-500"}
              `}
              >
                {label}
              </span>
            </div>

            {/* Vertical Line Connector */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-[15px] sm:left-[19px] top-8 sm:top-10 w-0.5 h-8 -z-10
                ${isCompleted ? "bg-[#6b4fd8] " : "bg-gray-300 "}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
