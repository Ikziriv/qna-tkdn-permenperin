import React, { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";
import TabSkeleton from "./TabSkeleton";

const ActivityMonitorTab = lazy(() => import("@/components/feature/admin/tabs/ActivityMonitorTab"));

export const activityRoute: RouteObject = {
  path: "activity",
  element: (
    <Suspense fallback={<TabSkeleton />}>
      <ActivityMonitorTab />
    </Suspense>
  ),
};
