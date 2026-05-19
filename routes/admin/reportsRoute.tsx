import React, { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";
import TabSkeleton from "./TabSkeleton";

const ReportsTab = lazy(() => import("@/components/feature/admin/tabs/ReportsTab"));

export const reportsRoute: RouteObject = {
  path: "reports",
  element: (
    <Suspense fallback={<TabSkeleton />}>
      <ReportsTab />
    </Suspense>
  ),
};
