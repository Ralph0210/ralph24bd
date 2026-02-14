"use client";

import { usePathname } from "next/navigation";
import { OnboardingProgress } from "@/components/OnboardingProgress";

const STEP_BY_PATH: Record<string, number> = {
  "/checkin/name": 1,
  "/checkin/zodiac": 2,
  "/checkin/envelope": 3,
};

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = STEP_BY_PATH[pathname] ?? 1;

  const showProgress = pathname !== "/checkin/envelope";

  return (
    <>
      {showProgress && (
        <div className="px-4 pt-6 pb-2">
          <OnboardingProgress currentStep={currentStep} />
        </div>
      )}
      {children}
    </>
  );
}
