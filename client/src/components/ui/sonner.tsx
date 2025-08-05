import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      richColors
      closeButton={false}
      position="bottom-right"
      visibleToasts={3}
      toastOptions={{
        style: {
          background: "hsl(var(--background) / 0.95)",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border) / 0.5)",
          borderRadius: "16px",
          fontSize: "13px",
          padding: "12px 16px",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          minHeight: "auto",
        },
        className: "font-medium text-sm",
        duration: 3000,
        unstyled: false,
      }}
      expand={false}
      gap={8}
    />
  );
}
