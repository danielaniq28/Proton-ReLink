"use client";

import { useRef } from "react";
import { ClimateView } from "./climate-view";
import { ControlsView } from "./controls-view";
import { useDashboardNav } from "./dashboard-nav";
import { HealthView } from "./health-view";
import { MapView } from "./map-view";
import { Overview } from "./overview";

const PANELS = [
  { href: "/dashboard", View: Overview },
  { href: "/dashboard/controls", View: ControlsView },
  { href: "/dashboard/climate", View: ClimateView },
  { href: "/dashboard/health", View: HealthView },
  { href: "/dashboard/map", View: MapView },
] as const;

export function DashboardPanels() {
  const { path } = useDashboardNav();
  const seen = useRef(new Set<string>([path]));
  seen.current.add(path);

  return (
    <>
      {PANELS.map(({ href, View }) => {
        if (!seen.current.has(href)) return null;
        const active = href === path;
        return (
          <div key={href} className={active ? undefined : "hidden"} aria-hidden={!active}>
            <View />
          </div>
        );
      })}
    </>
  );
}
