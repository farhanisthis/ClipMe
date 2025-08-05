import * as React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

interface WatermarkProps {
  className?: string;
}

export function Watermark({ className }: WatermarkProps) {
  const [isRight, setIsRight] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const { theme } = useTheme();

  // Calculate if dark mode based on theme and system preference
  const [systemPrefersDark, setSystemPrefersDark] = React.useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) =>
      setSystemPrefersDark(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const isDark = React.useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    // For system theme, use the tracked system preference
    return systemPrefersDark;
  }, [theme, systemPrefersDark]);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-hide on mobile after 30 seconds
  React.useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 30000); // Hide after 30 seconds on mobile

      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Randomly switch sides every 45 seconds (only on desktop)
  React.useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        setIsRight((prev) => !prev);
      }, 45000);

      return () => clearInterval(interval);
    }
  }, [isMobile]);

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
        bottom: isMobile ? "12px" : "20px",
        right: isRight ? (isMobile ? "12px" : "20px") : "auto",
        left: isRight ? "auto" : isMobile ? "12px" : "20px",
        zIndex: isMobile ? 999 : 999999, // Lower z-index on mobile
        pointerEvents: "none",
        userSelect: "none",
        transition: "all 1s ease-in-out",
        opacity: isMobile ? (isVisible ? 0.7 : 0) : 1, // Fade out on mobile
        transform:
          isMobile && !isVisible ? "translateY(20px)" : "translateY(0)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isMobile ? (isVisible ? 0.6 : 0) : 1,
          y: 0,
          scale: isMobile && !isVisible ? 0.8 : 1,
        }}
        transition={{ duration: 1, delay: isMobile ? 3 : 2 }} // Longer delay on mobile
        style={{
          backgroundColor: isDark
            ? "rgba(17, 24, 39, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
          border: isDark
            ? "1px solid rgba(75, 85, 99, 0.2)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: isMobile ? "6px" : "8px",
          padding: isMobile ? "6px 8px" : "8px 12px",
          boxShadow: isMobile
            ? isDark
              ? "0 2px 4px rgba(0, 0, 0, 0.2)"
              : "0 2px 4px rgba(0, 0, 0, 0.08)"
            : isDark
            ? "0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.5)"
            : "0 4px 6px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(8px)",
          fontSize: isMobile ? "9px" : "11px", // Smaller text on mobile
          color: isDark ? "#e5e7eb" : "#374151",
          fontWeight: isMobile ? "400" : "500", // Lighter weight on mobile
          maxWidth: isMobile ? "150px" : "200px", // Smaller max width on mobile
          lineHeight: "1.3",
          transform: isMobile ? "scale(0.9)" : "scale(1)", // Slightly smaller on mobile
        }}
      >
        <span>ClipMe — built by </span>
        <motion.span
          style={{
            color: isDark ? "#60a5fa" : "#3b82f6",
            fontWeight: isMobile ? "500" : "600", // Lighter weight on mobile
            cursor: "pointer",
            pointerEvents: "auto",
            display: "inline-block",
            position: "relative",
            transition: "all 0.2s ease-in-out",
          }}
          whileHover={
            isMobile
              ? {}
              : {
                  // Disable hover effects on mobile
                  scale: 1.05,
                  color: isDark ? "#93c5fd" : "#1d4ed8",
                }
          }
          whileTap={{ scale: 0.95 }}
          onClick={handleLinkedInClick}
          onMouseEnter={
            isMobile
              ? undefined
              : (e) => {
                  // Disable hover on mobile
                  const target = e.target as HTMLElement;
                  target.style.textShadow = isDark
                    ? "0 0 8px rgba(96, 165, 250, 0.6)"
                    : "0 0 8px rgba(59, 130, 246, 0.4)";
                  target.style.transform = "translateY(-1px)";
                }
          }
          onMouseLeave={
            isMobile
              ? undefined
              : (e) => {
                  // Disable hover on mobile
                  const target = e.target as HTMLElement;
                  target.style.textShadow = "none";
                  target.style.transform = "translateY(0)";
                }
          }
          title={isMobile ? undefined : "Connect with Farhan Ali on LinkedIn"} // No tooltip on mobile
        >
          Farhan Ali
        </motion.span>
        <span>, designed to save you time.</span>
      </motion.div>
    </div>
  );
}
