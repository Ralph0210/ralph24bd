"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isSupabaseError = error.message?.includes("Supabase") || error.message?.includes("NEXT_PUBLIC");

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-[#1a0f0a] mb-4">Something went wrong</h1>
      {isSupabaseError ? (
        <p className="text-[#5c4033] mb-6 max-w-sm">
          Supabase is not configured. Add <code className="text-xs bg-[#e8ddd0] px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-xs bg-[#e8ddd0] px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your Vercel project environment variables.
        </p>
      ) : (
        <p className="text-[#5c4033] mb-6 max-w-sm">{error.message}</p>
      )}
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
