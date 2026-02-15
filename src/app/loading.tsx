export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#c41e3a] border-t-transparent animate-spin" />
        <p className="text-footnote text-[#8b7355]">Loading...</p>
      </div>
    </div>
  );
}
