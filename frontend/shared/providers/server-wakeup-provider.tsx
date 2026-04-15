"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";

export function ServerWakeupProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isChecking = true;

    const checkHealth = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/health`;
        // We use a raw 'axios.get'to completely bypass the global error toast interceptors and auth header logic.
        const res = await axios.get(url, { timeout: 3000 });
        if (res.status === 200) {
          setIsReady(true);
          return true;
        }
      } catch (err) {
        // We expect timeouts and 502/503 errors while waking up. 
        // Raw axios ensures this fails silently without triggering global error toasts.
      }
      return false;
    };

    const poll = async () => {
      while (isChecking) {
        const ok = await checkHealth();
        if (ok) {
          break;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    };

    poll();

    timeout = setTimeout(() => {
      setShowLoadingState(true);
    }, 5000);

    return () => {
      isChecking = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {children}
      {!isReady && showLoadingState && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-500 animate-in fade-in zoom-in-95">
          <div className="flex flex-col items-center justify-center space-y-6 px-8 py-10 text-center bg-card rounded-2xl shadow-2xl border border-primary/20 max-w-sm">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Server is waking up...</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The backend service was asleep due to inactivity. This can take around 17 seconds to start securely. Thank you for your patience!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
