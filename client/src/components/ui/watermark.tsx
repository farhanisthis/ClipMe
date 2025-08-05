import * as React from "react";
import { motion } from "framer-motion";

interface WatermarkProps {
  className?: string;
}

export function Watermark({ className }: WatermarkProps) {
  const [isRight, setIsRight] = React.useState(true);
  const [isDark, setIsDark] = React.useState(false);

  // Detect dark mode
  React.useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // Randomly switch sides every 45 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsRight((prev) => !prev);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleLinkedInClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      "https://linkedin.com/in/farhanisthis",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: isRight ? "20px" : "auto",
        left: isRight ? "auto" : "20px",
        zIndex: 999999,
        pointerEvents: "none",
        userSelect: "none",
        transition: "all 1s ease-in-out",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
        style={{
          backgroundColor: isDark
            ? "rgba(17, 24, 39, 0.9)"
            : "rgba(255, 255, 255, 0.9)",
          border: isDark
            ? "1px solid rgba(75, 85, 99, 0.3)"
            : "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          padding: "8px 12px",
          boxShadow: isDark
            ? "0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.5)"
            : "0 4px 6px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(12px)",
          fontSize: "11px",
          color: isDark ? "#e5e7eb" : "#374151",
          fontWeight: "500",
          maxWidth: "200px",
          lineHeight: "1.3",
        }}
      >
        <span>ClipMe — built by </span>
        <motion.span
          style={{
            color: isDark ? "#60a5fa" : "#3b82f6",
            fontWeight: "600",
            cursor: "pointer",
            pointerEvents: "auto",
            display: "inline-block",
            position: "relative",
            transition: "all 0.2s ease-in-out",
          }}
          whileHover={{
            scale: 1.05,
            color: isDark ? "#93c5fd" : "#1d4ed8",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLinkedInClick}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement;
            target.style.textShadow = isDark
              ? "0 0 8px rgba(96, 165, 250, 0.6)"
              : "0 0 8px rgba(59, 130, 246, 0.4)";
            target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement;
            target.style.textShadow = "none";
            target.style.transform = "translateY(0)";
          }}
          title="Connect with Farhan Ali on LinkedIn"
        >
          Farhan Ali
        </motion.span>
        <span>, designed to save you time.</span>
      </motion.div>
    </div>
  );
}
