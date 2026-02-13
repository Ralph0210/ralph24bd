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
      className={`rounded-2xl bg-white border border-[#e8ddd0] shadow-sm ${paddingClass[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
