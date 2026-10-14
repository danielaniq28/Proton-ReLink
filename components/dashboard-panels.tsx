"use client";

import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {PANELS.map(({ href, View }) => {
        if (href !== path) return null;
        return (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <View />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
