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
            className="h-[4px] flex-1 max-w-16 rounded-full overflow-hidden bg-[#e8ddd0]"
          >
            <div
              className={`h-full rounded-full bg-[#c41e3a] transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isDone || isActive ? "w-full" : "w-0"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
