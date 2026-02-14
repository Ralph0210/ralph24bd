"use client";

const STEP_COUNT = 3;

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const step = i + 1;
        const isDone = currentStep > step;
        const isActive = currentStep === step;
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 max-w-16 rounded-full transition-colors ${
              isDone || isActive ? "bg-[#c41e3a]" : "bg-[#e8ddd0]"
            }`}
          />
        );
      })}
    </div>
  );
}
