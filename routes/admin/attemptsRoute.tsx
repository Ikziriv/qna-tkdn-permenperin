import React, { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";
import TabSkeleton from "./TabSkeleton";

const AttemptsTab = lazy(() => import("@/components/feature/admin/tabs/AttemptsTab"));

export const attemptsRoute: RouteObject = {
  path: "attempts",
  element: (
    <Suspense fallback={<TabSkeleton />}>
      <AttemptsTab />
    </Suspense>
  ),
};
