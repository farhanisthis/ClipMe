import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "vibrant" | "dark";
  animated?: boolean;
}

const GradientBackground = React.forwardRef<
  HTMLDivElement,
  GradientBackgroundProps
>(({ className, variant = "default", animated = true, ...props }, ref) => {
  const variants = {
    default:
      "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/50",
    subtle:
      "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
    vibrant:
      "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 dark:from-purple-800 dark:via-pink-800 dark:to-red-800",
    dark: "bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900",
  };

  return (
    <div
      ref={ref}
      className={cn("absolute inset-0", variants[variant], className)}
      {...props}
    >
      {/* Geometric patterns overlay */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>

        {animated && (
          <>
            <motion.div
              className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/3 left-0 w-96 h-96 bg-gradient-to-tr from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl"
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </>
        )}
      </div>

      {/* Floating particles */}
      {animated && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400/30 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/40 rounded-full"
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-indigo-400/25 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.25, 0.5, 0.25],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </>
      )}
    </div>
  );
});

GradientBackground.displayName = "GradientBackground";

export { GradientBackground };
