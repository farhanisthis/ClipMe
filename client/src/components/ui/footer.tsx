import * as React from "react";
import { motion } from "framer-motion";
import { Github, Heart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "simple" | "detailed";
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, variant = "simple", ...props }, ref) => {
    if (variant === "simple") {
      return (
        <footer
          ref={ref}
          className={cn(
            "fixed bottom-0 left-0 right-0 p-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200/60 dark:border-slate-700/60",
            className
          )}
          {...props}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="flex items-center justify-center gap-1"
          >
            Made with{" "}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </motion.span>{" "}
            for seamless clipboard sharing
          </motion.p>
        </footer>
      );
    }

    return (
      <footer
        ref={ref}
        className={cn(
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60",
          className
        )}
        {...props}
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                ClipShare
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Share clipboard content across devices with secure room codes.
                No accounts, no hassle.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                Features
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Cross-platform support</li>
                <li>Real-time synchronization</li>
                <li>Secure room codes</li>
                <li>QR code scanning</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                Links
              </h4>
              <div className="flex space-x-4">
                <motion.a
                  href="#"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="#"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-5 h-5" />
                </motion.a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2025 ClipShare. Built with modern web technologies.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                Made with{" "}
                <Heart className="w-3 h-3 text-red-500 fill-current" /> for
                developers
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export { Footer };
