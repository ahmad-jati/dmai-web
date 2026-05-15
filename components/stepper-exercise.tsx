"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const totalSteps = 8;

export function StepperExercise() {
  const [currentStep, setCurrentStep] = useState(0);

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  return (
    <div className="flex items-center justify-center gap-4 w-full">
      <Button
        type="button"
        variant="ghost"
        onClick={prevStep}
        disabled={currentStep === 0}
        className="p-0 h-auto text-xs font-semibold hover:bg-transparent disabled:text-muted-foreground"
      >
        Sebelumnya
      </Button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              index <= currentStep
                ? "bg-foreground"
                : "bg-muted-foreground/60"
            }`}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={nextStep}
        disabled={currentStep === totalSteps - 1}
        className="p-0 h-auto text-xs font-semibold hover:bg-transparent disabled:text-muted-foreground"
      >
        {currentStep === totalSteps - 1 ? 'Selesai' : 'Selanjutnya'}
      </Button>
    </div>
  );
}