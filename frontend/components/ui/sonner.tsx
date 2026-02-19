"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { useEffect, useState } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;
export const TOAST_DURATION = 2500;

export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Wait for theme to be resolved
  if (!mounted) {
    return null;
  }
  
  const isDarkMode = resolvedTheme === "dark";
  const toastBg = isDarkMode ? "!bg-white" : "!bg-black";
  const toastText = isDarkMode ? "!text-black" : "!text-white";

  return (
    <Sonner
      key={resolvedTheme}
      className="toaster group"
      duration={TOAST_DURATION}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: `group toast ${toastBg} ${toastText} border-border shadow-lg w-[calc(100vw-32px)] sm:w-full`,
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
