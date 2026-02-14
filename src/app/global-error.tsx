"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "system-ui", backgroundColor: "#fef8f0", color: "#1a0f0a" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Something went wrong</h1>
        <p style={{ color: "#5c4033", marginBottom: "1.5rem", maxWidth: "24rem", textAlign: "center" }}>
          {error.message?.includes("Supabase") || error.message?.includes("NEXT_PUBLIC")
            ? "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel environment variables."
            : error.message}
        </p>
        <button
          onClick={reset}
          style={{ padding: "12px 24px", backgroundColor: "#c41e3a", color: "white", border: "none", borderRadius: "12px", fontWeight: 500, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
