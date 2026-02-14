"use client";

export function FestiveBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden
    >
      <span
        className="absolute top-[18%] left-[10%] text-2xl text-[#c41e3a] opacity-20 landing-float"
        style={{ animationDelay: "0s" }}
      >
        福
      </span>
      <span
        className="absolute top-[25%] right-[12%] text-xl opacity-20 landing-float"
        style={{ animationDelay: "0.8s" }}
      >
        🎊
      </span>
      <span
        className="absolute bottom-[35%] left-[15%] text-xl opacity-20 landing-float"
        style={{ animationDelay: "1.6s" }}
      >
        🧧
      </span>
      <span
        className="absolute bottom-[30%] right-[8%] text-2xl text-[#c41e3a] opacity-20 landing-float"
        style={{ animationDelay: "2.4s" }}
      >
        福
      </span>
      <span
        className="absolute top-[40%] left-[8%] text-lg opacity-20 landing-twinkle"
      >
        ✦
      </span>
      <span
        className="absolute top-[55%] right-[15%] text-lg opacity-20 landing-twinkle"
        style={{ animationDelay: "0.5s" }}
      >
        ✦
      </span>
      <span
        className="absolute bottom-[20%] right-[25%] text-lg opacity-20 landing-twinkle"
        style={{ animationDelay: "1s" }}
      >
        ✦
      </span>
      <span
        className="absolute bottom-[45%] left-[20%] text-lg opacity-20 landing-twinkle"
        style={{ animationDelay: "1.5s" }}
      >
        ✦
      </span>
    </div>
  );
}
