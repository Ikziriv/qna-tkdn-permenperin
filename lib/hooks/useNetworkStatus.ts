import { useState, useEffect, useCallback, useRef } from "react";

export type NetworkState = "online" | "offline" | "unknown";

export interface NetworkStatus {
  isOnline: boolean;
  state: NetworkState;
}

/**
 * React hook that tracks browser online/offline state.
 * Also performs a lightweight fetch probe to confirm actual connectivity
 * when the browser reports "online" (since navigator.onLine can be optimistic).
 */
export function useNetworkStatus(probeUrl?: string): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [state, setState] = useState<NetworkState>(navigator.onLine ? "online" : "offline");
  const probeAbortRef = useRef<AbortController | null>(null);

  const performProbe = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setState("offline");
      return;
    }

    // If no probe URL provided, trust navigator.onLine
    if (!probeUrl) {
      setIsOnline(true);
      setState("online");
      return;
    }

    // Cancel previous probe
    if (probeAbortRef.current) {
      probeAbortRef.current.abort();
    }
    const controller = new AbortController();
    probeAbortRef.current = controller;

    try {
      const res = await fetch(probeUrl, {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      });
      setIsOnline(res.ok);
      setState(res.ok ? "online" : "offline");
    } catch {
      setIsOnline(false);
      setState("offline");
    }
  }, [probeUrl]);

  useEffect(() => {
    const handleOnline = () => {
      // Don't immediately trust navigator.onLine; probe first
      performProbe();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setState("offline");
      if (probeAbortRef.current) {
        probeAbortRef.current.abort();
        probeAbortRef.current = null;
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial probe if online
    if (navigator.onLine && probeUrl) {
      performProbe();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (probeAbortRef.current) {
        probeAbortRef.current.abort();
      }
    };
  }, [performProbe, probeUrl]);

  return { isOnline, state };
}
