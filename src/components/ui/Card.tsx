import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };
  return (
    <div
      className={`rounded-[20px] bg-white/90 backdrop-blur-xl border border-[#e8ddd0]/80 shadow-[var(--shadow-md)] transition-shadow duration-300 [@media(hover:hover)]:hover:shadow-lg ${paddingClass[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
