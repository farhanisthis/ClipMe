import { ClipboardCopy } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const dimensions = {
    sm: "32px",
    md: "64px",
    lg: "96px",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative group">
        <img
          src="/logo.png"
          alt="ClipMe Logo"
          width={dimensions[size]}
          height={dimensions[size]}
          className="drop-shadow-lg object-contain rounded-xl"
          style={{
            width: dimensions[size],
            height: dimensions[size],
          }}
        />

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 scale-150"></div>
      </div>

      {showText && (
        <h1
          className={`${textSizes[size]} font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent ml-3`}
        >
          ClipMe
        </h1>
      )}
    </div>
  );
}
