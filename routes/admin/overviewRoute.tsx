import React, { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";
import TabSkeleton from "./TabSkeleton";

const OverviewTab = lazy(() => import("@/components/feature/admin/tabs/OverviewTab"));

export const overviewRoute: RouteObject = {
  index: true,
  element: (
    <Suspense fallback={<TabSkeleton />}>
      <OverviewTab />
    </Suspense>
  ),
};
