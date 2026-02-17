import React from "react";
import { cn } from "@fin-catch/shared";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = React.memo(function Card({
  children,
  className = "",
  onClick,
}: CardProps) {
  // Detect cyber theme for enhanced styling
  const [isCyber, setIsCyber] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      const hasCyber =
        document.documentElement.classList.contains("cyber") ||
        document.documentElement.getAttribute("data-theme") === "cyber";
      setIsCyber(hasCyber);
    };

    checkTheme();
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm transition-all duration-200",
        onClick && "cursor-pointer",
        isCyber &&
          "cyber-grid-bg cyber-card-glow backdrop-blur-[24px] saturate-[180%]",
        className,
      )}
      style={{
        background: isCyber
          ? "rgba(30, 41, 59, 0.95)"
          : "var(--glass-bg-dark-strong)",
        borderColor: isCyber
          ? "rgba(6, 182, 212, 0.3)"
          : "var(--glass-border-light)",
        color: "var(--color-text-primary)",
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
