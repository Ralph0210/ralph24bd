import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-[14px] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden active:scale-[0.98] touch-manipulation";
  const variants = {
    primary:
      "bg-[#c41e3a] text-white hover:bg-[#9e1830] shadow-[var(--shadow-sm)]",
    secondary:
      "bg-[#d4af37] text-[#1a0f0a] hover:opacity-95 shadow-[var(--shadow-sm)]",
    outline:
      "border-2 border-[#c41e3a] text-[#c41e3a] hover:bg-[#c41e3a]/8",
    ghost: "text-[#5c4033] hover:bg-black/[0.04]",
  };
  const sizes = {
    sm: "h-11 px-5 text-[15px] min-h-[44px]",
    md: "h-12 px-6 text-base min-h-[44px]",
    lg: "h-14 px-8 text-[17px] min-h-[52px]",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      <span
        className="absolute inset-0 pointer-events-none animate-envelope-shine"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(212,175,55,0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(212,175,55,0.3) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(212,175,55,0.25) 0%, transparent 60%)`,
        }}
        aria-hidden
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
