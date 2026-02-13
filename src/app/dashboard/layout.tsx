"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getGuestId } from "@/lib/guest-id";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    setGuestId(getGuestId());
  }, []);

  if (!guestId) {
    return (
      <div className="min-h-dvh bg-[#fef8f0] flex items-center justify-center px-6">
        <p className="text-[#5c4033]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fef8f0] flex flex-col pb-20">
      <main className="flex-1 px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e8ddd0] flex items-center justify-around safe-area-pb">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
            pathname === "/dashboard"
              ? "text-[#c41e3a] font-medium"
              : "text-[#8b7355]"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </Link>
        <Link
          href="/dashboard/drinks"
          className="flex flex-col items-center py-2 px-4 rounded-xl text-[#8b7355] hover:text-[#c41e3a] transition-colors"
        >
          <span className="text-2xl">🍺</span>
          <span className="text-xs">Drinks</span>
        </Link>
        <Link
          href="/dashboard/frens"
          className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
            pathname === "/dashboard/frens"
              ? "text-[#c41e3a] font-medium"
              : "text-[#8b7355]"
          }`}
        >
          <span className="text-xl">👥</span>
          <span className="text-xs">Frens</span>
        </Link>
      </nav>
    </div>
  );
}
