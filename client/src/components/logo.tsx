import { ClipboardCopy } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: {
      container: "w-8 h-8",
      icon: "w-4 h-4",
      text: "text-sm"
    },
    md: {
      container: "w-16 h-16",
      icon: "w-8 h-8",
      text: "text-3xl"
    },
    lg: {
      container: "w-24 h-24",
      icon: "w-12 h-12",
      text: "text-4xl"
    }
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeConfig.container} bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 relative overflow-hidden`}>
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-50"></div>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        
        {/* Logo icon */}
        <ClipboardCopy className={`${sizeConfig.icon} text-white relative z-10`} />
        
        {/* Decorative elements */}
        <div className="absolute top-1 right-1 w-2 h-2 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white/20 rounded-full"></div>
      </div>
      
      {showText && (
        <h1 className={`${sizeConfig.text} font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent ml-3`}>
          ClipMe
        </h1>
      )}
    </div>
  );
}