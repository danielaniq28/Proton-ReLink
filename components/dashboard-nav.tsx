"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export const DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/controls",
  "/dashboard/climate",
  "/dashboard/health",
  "/dashboard/map",
] as const;

type DashboardPath = (typeof DASHBOARD_PATHS)[number];

function asDashboardPath(value: string): DashboardPath {
  return (DASHBOARD_PATHS as readonly string[]).includes(value) ? (value as DashboardPath) : "/dashboard";
}

type DashboardNavValue = {
  path: DashboardPath;
  go: (href: string) => void;
};

const DashboardNavContext = createContext<DashboardNavValue | null>(null);

export function DashboardNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [path, setPath] = useState<DashboardPath>(() => asDashboardPath(pathname));

  useEffect(() => {
    setPath(asDashboardPath(pathname));
  }, [pathname]);

  useEffect(() => {
    const onPop = () => setPath(asDashboardPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((href: string) => {
    const next = asDashboardPath(href);
    setPath(next);
    if (window.location.pathname !== next) window.history.pushState(null, "", next);
  }, []);

  const value = useMemo(() => ({ path, go }), [path, go]);
  return <DashboardNavContext.Provider value={value}>{children}</DashboardNavContext.Provider>;
}

export function useDashboardNav() {
  const value = useContext(DashboardNavContext);
  if (!value) throw new Error("useDashboardNav must be used inside the dashboard");
  return value;
}
