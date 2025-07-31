import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  size?: "sm" | "md" | "lg";
  text?: string;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant = "spinner", size = "md", text, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12",
    };

    const textSizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    if (variant === "spinner") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center gap-3",
            className
          )}
          {...props}
        >
          <motion.div
            className={cn(
              "border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full",
              sizeClasses[size]
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          {text && (
            <motion.p
              className={cn(
                "text-slate-600 dark:text-slate-400 font-medium",
                textSizeClasses[size]
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {text}
            </motion.p>
          )}
        </div>
      );
    }

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center gap-3",
            className
          )}
          {...props}
        >
          <div className="flex space-x-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={cn(
                  "bg-blue-600 rounded-full",
                  size === "sm"
                    ? "w-2 h-2"
                    : size === "md"
                      ? "w-3 h-3"
                      : "w-4 h-4"
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          {text && (
            <motion.p
              className={cn(
                "text-slate-600 dark:text-slate-400 font-medium",
                textSizeClasses[size]
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {text}
            </motion.p>
          )}
        </div>
      );
    }

    if (variant === "pulse") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center gap-3",
            className
          )}
          {...props}
        >
          <motion.div
            className={cn("bg-blue-600 rounded-full", sizeClasses[size])}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {text && (
            <motion.p
              className={cn(
                "text-slate-600 dark:text-slate-400 font-medium",
                textSizeClasses[size]
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {text}
            </motion.p>
          )}
        </div>
      );
    }

    if (variant === "skeleton") {
      return (
        <div ref={ref} className={cn("space-y-3", className)} {...props}>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded shimmer"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 shimmer"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6 shimmer"></div>
          </div>
        </div>
      );
    }

    return null;
  }
);

Loading.displayName = "Loading";

export { Loading };
